/**
 * ResellerClub API Provider
 *
 * Handles domain suggestions and availability checks.
 * All operations are performed server-side.
 */

import {
  DOMAIN_MODIFIERS,
  SUPPORTED_TLDS,
  TLD_PRODUCT_MAP,
} from "../constants/domain-constants";
import type {
  DomainAvailability,
  DomainSuggestion,
  ResellerClubConfig,
  ResellerClubCustomerData,
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

// Exported constants moved to constants/domain-constants.ts
export { SUPPORTED_TLDS };

const CHUNK_SIZE = 5;

/**
 * Base pricing cache to avoid redundant calls
 */
const pricingCache: Record<
  string,
  Record<string, { register: string; renew: string }>
> = {};

async function getBasePricing(customerId?: string) {
  const cacheKey = customerId || "generic";
  if (pricingCache[cacheKey]) return pricingCache[cacheKey];

  try {
    let data: any;

    if (config.proxyUrl && config.proxyToken) {
      const url = new URL(`${config.proxyUrl}/products/customer-price`);
      Object.values(TLD_PRODUCT_MAP).forEach((pk) =>
        url.searchParams.append("product-key", pk),
      );
      if (customerId) {
        url.searchParams.append("customer-id", customerId);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
      });

      if (!response.ok) return {};
      data = await response.json();
    } else {
      if (!config.authUserId || !config.apiKey) return {};

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
      });
      Object.values(TLD_PRODUCT_MAP).forEach((pk) =>
        params.append("product-key", pk),
      );
      if (customerId) {
        params.append("customer-id", customerId);
      }

      const url = `${BASE_URL}/products/customer-price.json?${params.toString()}`;
      const response = await fetch(url, { headers: COMMON_HEADERS });
      if (!response.ok) return {};
      data = await response.json();
    }

    const cache: Record<string, { register: string; renew: string }> = {};

    // Map RC product keys back to TLDs
    const pkToTld = Object.fromEntries(
      Object.entries(TLD_PRODUCT_MAP).map(([tld, pk]) => [pk, tld]),
    );

    Object.keys(data).forEach((pk) => {
      const tld = pkToTld[pk];
      if (!tld) return;

      const p = data[pk];
      const register = p.adddomain?.["1"] || "0.00";
      const renew = p.renewdomain?.["1"] || "0.00";

      cache[tld] = { register, renew };
    });

    pricingCache[cacheKey] = cache;
    return cache;
  } catch (error) {
    console.error("[domains] Pricing fetch error:", error);
    return {};
  }
}

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
  customerId?: string,
): Promise<DomainAvailability[]> {
  const results: DomainAvailability[] = [];

  for (let i = 0; i < domains.length; i += CHUNK_SIZE) {
    const chunk = domains.slice(i, i + CHUNK_SIZE);
    const chunkResults = await checkChunk(chunk, customerId);
    results.push(...chunkResults);

    if (i + CHUNK_SIZE < domains.length) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Respect rate limits
    }
  }

  return results;
}

async function checkChunk(
  domains: string[],
  customerId?: string,
): Promise<DomainAvailability[]> {
  const slds = [...new Set(domains.map((d) => d.split(".")[0]))];
  const tlds = [...new Set(domains.map((d) => d.split(".").pop() || ""))];

  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/domains/available`;
      const body = { domainNames: slds, tlds };
      console.log({ body });

      console.log(`[domains] PROXY CHUNK REQUEST: ${url}`);

      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify(body),
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

      console.log({ params: params.toString() });

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
    const basePricing = await getBasePricing(customerId);
    return parseAvailabilityData(data, domains, basePricing);
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
  basePricing: Record<string, { register: string; renew: string }> = {},
): DomainAvailability[] {
  if (data?.status?.toString().toUpperCase() === "ERROR") {
    return requestedDomains.map((d) => ({
      domain: d,
      status: "unknown",
      isPremium: false,
    }));
  }

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

    const parts = domain.split(".");
    const tld = parts.pop() || "";
    const base = basePricing[tld];

    const isPremium = !!info.costHash || !!info.premium;
    const pricing = info.costHash
      ? {
          register: info.costHash.register || info.costHash.create,
          renew: info.costHash.renew,
        }
      : base
        ? {
            register: base.register,
            renew: base.renew,
          }
        : undefined;

    return { domain, status: availability, isPremium, pricing };
  });
}

/**
 * Create a new customer account in ResellerClub
 */
export async function createResellerClubCustomer(
  data: ResellerClubCustomerData,
): Promise<{ customerId: string; success: boolean; error?: string }> {
  try {
    let response: Response;

    const payload = {
      ...data,
      password: data.password || "User@123456", // Default secure-ish password if none provided
      langPref: data.langPref || "en",
    };

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/customers/signup`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify(payload),
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { customerId: "", success: false, error: "Missing config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        username: payload.username,
        passwd: payload.password,
        name: payload.name,
        company: payload.company,
        "address-line-1": payload.addressLine1,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        zipcode: payload.zipcode,
        "phone-cc": payload.phoneCountryCode,
        phone: payload.phone,
        "lang-pref": payload.langPref,
      });

      const url = `${BASE_URL}/customers/v2/signup.json?${params.toString()}`;
      response = await fetch(url, {
        method: "POST",
        headers: COMMON_HEADERS,
      });
    }

    const result = await response.text();

    // RC returns customerId as a string if success, or an error object
    if (response.ok && !isNaN(Number(result.trim()))) {
      return { customerId: result.trim(), success: true };
    } else {
      try {
        const errorData = JSON.parse(result);
        return {
          customerId: "",
          success: false,
          error:
            errorData.message || errorData.error || "Failed to create customer",
        };
      } catch {
        return {
          customerId: "",
          success: false,
          error: result || "Failed to create customer",
        };
      }
    }
  } catch (error) {
    console.error("[domains] Create customer error:", error);
    return {
      customerId: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a contact for a ResellerClub customer
 */
export async function createResellerClubContact(
  customerId: string,
  data: ResellerClubCustomerData,
): Promise<{ contactId: string; success: boolean; error?: string }> {
  try {
    let response: Response;

    const payload = {
      ...data,
      "customer-id": customerId,
      type: "Contact",
    };

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/contacts/add`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify(payload),
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { contactId: "", success: false, error: "Missing config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "customer-id": customerId,
        name: data.name,
        company: data.company,
        email: data.username,
        "address-line-1": data.addressLine1,
        city: data.city,
        state: data.state,
        country: data.country,
        zipcode: data.zipcode,
        "phone-cc": data.phoneCountryCode,
        phone: data.phone,
        type: "Contact",
      });

      const url = `${BASE_URL}/contacts/add.json?${params.toString()}`;
      response = await fetch(url, {
        method: "POST",
        headers: COMMON_HEADERS,
      });
    }

    const result = await response.text();

    if (response.ok && !isNaN(Number(result.trim()))) {
      return { contactId: result.trim(), success: true };
    } else {
      try {
        const errorData = JSON.parse(result);
        return {
          contactId: "",
          success: false,
          error:
            errorData.message || errorData.error || "Failed to create contact",
        };
      } catch {
        return {
          contactId: "",
          success: false,
          error: result || "Failed to create contact",
        };
      }
    }
  } catch (error) {
    console.error("[domains] Create contact error:", error);
    return {
      contactId: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Register a domain in ResellerClub
 */
export async function registerDomain(
  domainName: string,
  customerId: string,
  contactId: string,
  years: number = 1,
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/domains/register`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({
          domainName,
          customerId,
          regContactId: contactId,
          adminContactId: contactId,
          techContactId: contactId,
          billingContactId: contactId,
          years,
          ns: ["ns1.infraboxes.com", "ns2.infraboxes.com"], // Generic nameservers
          invoiceOption: "KeepInvoice",
        }),
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": domainName,
        years: years.toString(),
        ns: "ns1.infraboxes.com", // Add first NS
        "customer-id": customerId,
        "reg-contact-id": contactId,
        "admin-contact-id": contactId,
        "tech-contact-id": contactId,
        "billing-contact-id": contactId,
        "invoice-option": "KeepInvoice",
      });
      // Append second NS
      params.append("ns", "ns2.infraboxes.com");

      const url = `${BASE_URL}/domains/register.json?${params.toString()}`;
      response = await fetch(url, {
        method: "POST",
        headers: COMMON_HEADERS,
      });
    }

    const result = await response.json();

    if (response.ok && (result.status === "Success" || result.entityid)) {
      return {
        success: true,
        orderId: result.entityid?.toString() || result.actionid?.toString(),
      };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Domain registration failed",
      };
    }
  } catch (error) {
    console.error("[domains] Register domain error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * List DNS records for a domain in ResellerClub
 */
export async function listDnsRecords(
  domainName: string,
): Promise<{ success: boolean; records?: any[]; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/dns/records/search?domainName=${domainName}`;
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.proxyToken}`,
        },
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": domainName,
      });

      const url = `${BASE_URL}/dns/manage/search-records.json?${params.toString()}`;
      response = await fetch(url, { headers: COMMON_HEADERS });
    }

    const result = await response.json();

    if (response.ok) {
      // Result is usually an array or an object with records
      return { success: true, records: Array.isArray(result) ? result : [] };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Failed to list DNS records",
      };
    }
  } catch (error) {
    console.error("[domains] List DNS records error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add a DNS record in ResellerClub
 */
export async function addDnsRecord(
  domainName: string,
  type: string,
  host: string,
  value: string,
  ttl: number = 3600,
  priority?: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    // Map common types to RC endpoints
    const typeMap: Record<string, string> = {
      A: "add-ipv4-record",
      AAAA: "add-ipv6-record",
      MX: "add-mx-record",
      CNAME: "add-cname-record",
      TXT: "add-txt-record",
      NS: "add-ns-record",
      SRV: "add-srv-record",
    };

    const endpoint = typeMap[type.toUpperCase()];
    if (!endpoint)
      return { success: false, error: `Unsupported record type: ${type}` };

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/dns/records/add`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ domainName, type, host, value, ttl, priority }),
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": domainName,
        host: host === "@" ? "" : host,
        value: value,
        ttl: ttl.toString(),
      });

      if (priority !== undefined) {
        params.append("priority", priority.toString());
      }

      const url = `${BASE_URL}/dns/manage/${endpoint}.json?${params.toString()}`;
      response = await fetch(url, {
        method: "POST",
        headers: COMMON_HEADERS,
      });
    }

    const result = await response.json();

    if (response.ok && result.status === "Success") {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Failed to add DNS record",
      };
    }
  } catch (error) {
    console.error("[domains] Add DNS record error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a DNS record in ResellerClub
 */
export async function deleteDnsRecord(
  domainName: string,
  type: string,
  host: string,
  value: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    const typeMap: Record<string, string> = {
      A: "delete-ipv4-record",
      AAAA: "delete-ipv6-record",
      MX: "delete-mx-record",
      CNAME: "delete-cname-record",
      TXT: "delete-txt-record",
      NS: "delete-ns-record",
      SRV: "delete-srv-record",
    };

    const endpoint = typeMap[type.toUpperCase()];
    if (!endpoint)
      return { success: false, error: `Unsupported record type: ${type}` };

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/dns/records/delete`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ domainName, type, host, value }),
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": domainName,
        host: host === "@" ? "" : host,
        value: value,
      });

      const url = `${BASE_URL}/dns/manage/${endpoint}.json?${params.toString()}`;
      response = await fetch(url, {
        method: "POST",
        headers: COMMON_HEADERS,
      });
    }

    const result = await response.json();

    if (response.ok && result.status === "Success") {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Failed to delete DNS record",
      };
    }
  } catch (error) {
    console.error("[domains] Delete DNS record error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
