/**
 * ResellerClub API Provider
 *
 * Handles domain suggestions and availability checks.
 * All operations are performed server-side.
 */

import type {
  DomainAvailability,
  DomainSuggestion,
  ResellerClubConfig,
} from "../domain-types";

const config: ResellerClubConfig = {
  authUserId: process.env.RESELLERCLUB_AUTH_USER_ID || "",
  apiKey: process.env.RESELLERCLUB_API_KEY || "",
  proxyUrl: process.env.RC_PROXY_URL,
  proxyToken: process.env.RC_PROXY_TOKEN,
};

const IS_TEST = process.env.RESELLERCLUB_IS_TEST === "true";

// API endpoints
const BASE_URL = IS_TEST
  ? "https://test.httpapi.com/api"
  : "https://httpapi.com/api";
const SUGGEST_API = `${BASE_URL}/domains/v5/suggest-names.json`;
// Note: Suggest API and Availability API use different subdomains in production but test is unified
const AVAILABILITY_API = IS_TEST
  ? `${BASE_URL}/domains/available.json`
  : "https://domaincheck.httpapi.com/api/domains/available.json";

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://manage.india.resellerclub.com/",
  Origin: "https://manage.india.resellerclub.com",
};

// Supported TLDs
export const SUPPORTED_TLDS = [
  "com",
  "net",
  "org",
  "io",
  "co",
  "info",
  "biz",
  "us",
  "email",
  "in",
  "me",
  "tech",
  "online",
  "store",
  "app",
  "dev",
];

const CHUNK_SIZE = 5;

/**
 * Get domain suggestions based on a keyword
 */
export async function getDomainSuggestions(
  keyword: string,
): Promise<DomainSuggestion[]> {
  try {
    const cleanKeyword = keyword
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "");
    if (!cleanKeyword || cleanKeyword.length < 2) return [];

    let response: Response;

    // Use Legacy Proxy if configured
    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/domains/suggest?keyword=${encodeURIComponent(cleanKeyword)}`;
      console.log(`[domains] PROXY REQUEST: ${url}`);
      console.log(
        `[domains] TOKEN PREVIEW: ${config.proxyToken.substring(0, 10)}... (length: ${config.proxyToken.length})`,
      );

      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[domains] Proxy Error (${response.status}):`, errorText);
      }
    } else {
      if (!config.authUserId || !config.apiKey) {
        console.error("[domains] Missing ResellerClub credentials");
        return [];
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        keyword: cleanKeyword,
      });

      SUPPORTED_TLDS.forEach((tld) => params.append("tlds", tld));
      const url = `${SUGGEST_API}?${params.toString()}`;

      response = await fetch(url, {
        method: "GET",
        headers: COMMON_HEADERS,
        cache: "no-store",
      });
    }

    if (!response.ok) {
      console.error("[domains] Suggestions API error:", response.status);
      return [];
    }

    const data = await response.json();
    console.log(
      `[domains] Raw suggestions data for keyword '${cleanKeyword}':`,
      data,
    );

    // Check for error payload from ResellerClub (sometimes 200 OK with error body)
    if (data?.status?.toString().toUpperCase() === "ERROR") {
      console.error("[domains] RC suggestions error:", data.message);
      return [];
    }

    const suggestions: DomainSuggestion[] = [];

    // ResellerClub API can return suggestions in various formats:
    // 1. An array of strings: ["example.com", "example.net"]
    // 2. An object where keys are domain names and values are objects:
    //    { "example.com": { "status": "available" }, "example.net": { "status": "available" } }
    // 3. An object where keys are domain names and values are just empty objects or null:
    //    { "example.com": {}, "example.net": null }
    // 4. An object with a 'response' key containing an array or object of suggestions.

    let itemsToParse: any[] = [];

    if (Array.isArray(data)) {
      itemsToParse = data;
    } else if (typeof data === "object" && data !== null) {
      if (
        data.response &&
        (Array.isArray(data.response) || typeof data.response === "object")
      ) {
        // Handle case 4: suggestions nested under a 'response' key
        itemsToParse = Array.isArray(data.response)
          ? data.response
          : Object.keys(data.response);
      } else {
        // Handle cases 2 and 3: object where keys are domain names
        itemsToParse = Object.keys(data);
      }
    }

    itemsToParse.forEach((item: any) => {
      let domainName: string | null = null;

      if (typeof item === "string") {
        // Case 1: item is directly the domain name (e.g., from an array or Object.keys)
        domainName = item;
      } else if (typeof item === "object" && item !== null) {
        // If item is an object, try to find the domain name within it
        if (item.domain) {
          domainName = item.domain;
        } else if (item.name) {
          domainName = item.name;
        } else if (item.fqdn) {
          // Fully Qualified Domain Name
          domainName = item.fqdn;
        }
      }

      if (domainName && domainName.includes(".")) {
        const parts = domainName.split(".");
        const tld = parts.pop() || "";
        const sld = parts.join(".");
        suggestions.push({ domain: domainName, sld, tld });
      } else if (domainName) {
        // If it's a string but doesn't contain a '.', it might be an SLD without TLD
        // We can choose to ignore these or try to append common TLDs if needed.
        // For now, we only add fully qualified domain names.
        console.warn(`[domains] Skipping malformed suggestion: ${domainName}`);
      }
    });

    return suggestions;
  } catch (error) {
    console.error("[domains] Suggestion fetch error:", error);
    return [];
  }
}

/**
 * Check availability for a batch of domains
 */
export async function checkDomainAvailability(
  domains: string[],
): Promise<DomainAvailability[]> {
  const results: DomainAvailability[] = [];

  for (let i = 0; i < domains.length; i += CHUNK_SIZE) {
    const chunk = domains.slice(i, i + CHUNK_SIZE);
    const chunkResults = await checkChunk(chunk);
    results.push(...chunkResults);

    if (i + CHUNK_SIZE < domains.length) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Respect rate limits
    }
  }

  return results;
}

async function checkChunk(domains: string[]): Promise<DomainAvailability[]> {
  const slds = [...new Set(domains.map((d) => d.split(".")[0]))];
  const tlds = [...new Set(domains.map((d) => d.split(".").pop() || ""))];

  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/domains/available`;
      console.log(`[domains] PROXY CHUNK REQUEST: ${url}`);

      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ domainNames: slds, tlds }),
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[domains] Proxy Chunk Error (${response.status}):`,
          errorText,
        );
      }
    } else {
      if (!config.authUserId || !config.apiKey) return [];

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
      });
      slds.forEach((sld) => {
        params.append("domain-name", sld);
      });
      tlds.forEach((tld) => {
        params.append("tlds", tld);
      });

      response = await fetch(`${AVAILABILITY_API}?${params.toString()}`, {
        method: "GET",
        headers: COMMON_HEADERS,
        cache: "no-store",
      });
    }

    if (!response.ok)
      return domains.map((d) => ({
        domain: d,
        status: "unknown",
        isPremium: false,
      }));

    const data = await response.json();
    return parseAvailabilityData(data, domains);
  } catch (error) {
    console.error("[domains] Chunk check error:", error);
    return domains.map((d) => ({
      domain: d,
      status: "unknown",
      isPremium: false,
    }));
  }
}

function parseAvailabilityData(
  data: any,
  requestedDomains: string[],
): DomainAvailability[] {
  if (data?.status?.toString().toUpperCase() === "ERROR") {
    return requestedDomains.map((d) => ({
      domain: d,
      status: "unknown",
      isPremium: false,
    }));
  }

  // RC returns { "domain.com": { status: "available", ... } }
  const normalizedData: Record<string, any> = {};
  if (data && typeof data === "object") {
    Object.keys(data).forEach((key) => {
      normalizedData[key.toLowerCase()] = data[key];
    });
  }

  return requestedDomains.map((domain) => {
    const info = normalizedData[domain.toLowerCase()];
    if (!info) return { domain, status: "unknown", isPremium: false };

    const status = (info.status || "").toLowerCase();
    let availability: "available" | "taken" | "unknown" = "unknown";

    if (status === "available") availability = "available";
    else if (status.includes("reg")) availability = "taken";

    const isPremium = !!info.costHash || !!info.premium;
    const pricing = info.costHash
      ? {
          register: info.costHash.register || info.costHash.create,
          renew: info.costHash.renew,
        }
      : undefined;

    return { domain, status: availability, isPremium, pricing };
  });
}
