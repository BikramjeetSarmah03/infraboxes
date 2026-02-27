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
import {
  DOMAIN_MODIFIERS,
  SUPPORTED_TLDS,
} from "../constants/domain-constants";

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

// Exported constants moved to constants/domain-constants.ts
export { SUPPORTED_TLDS };

const CHUNK_SIZE = 5;

/**
 * Get domain suggestions based on a keyword
 */
export async function getDomainSuggestions(
  keyword: string,
  tld: string = "com",
  page: number = 0,
): Promise<DomainSuggestion[]> {
  const cleanKeyword = keyword
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

  if (!cleanKeyword || cleanKeyword.length < 2) return [];

  const suggestions: DomainSuggestion[] = [];
  const pageSize = 8;
  const start = page * pageSize;

  const currentModifiers = DOMAIN_MODIFIERS.slice(start, start + pageSize);

  currentModifiers.forEach((mod) => {
    let sld = cleanKeyword;

    if (mod === "get") {
      sld = mod + cleanKeyword;
    } else if (mod !== "") {
      sld = cleanKeyword + mod;
    }

    suggestions.push({
      domain: `${sld}.${tld}`,
      sld,
      tld,
    });
  });

  return suggestions;
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
      console.log(`[domains] PROXY CHUNK REQUEST (Specialized): ${url}`);

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

      const url = `${AVAILABILITY_API}?${params.toString()}`;
      console.log(`[domains] DIRECT CHUNK REQUEST: ${url}`);

      response = await fetch(url, {
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

interface RCAvailabilityInfo {
  status: string;
  costHash?: {
    register?: string;
    create?: string;
    renew?: string;
  };
  premium?: boolean;
}

function parseAvailabilityData(
  data:
    | (Record<string, RCAvailabilityInfo> & { status?: string })
    | null
    | undefined,
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
  // RC returns { "domain.com": { status: "available", ... } }
  const normalizedData: Record<string, RCAvailabilityInfo> = {};
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
