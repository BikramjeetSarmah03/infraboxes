/**
 * Domain Suggestion Modifiers
 * These are used to generate domain name suggestions by appending or prepending
 * common high-converting keywords to a base keyword.
 */
export const DOMAIN_MODIFIERS = [
  "", // Pure keyword
  "hq",
  "app",
  "get",
  "labs",
  "studio",
  "inc",
  "official",
  "tech",
  "solutions",
  "hub",
  "central",
  "pro",
  "direct",
  "plus",
  "group",
  "box",
  "flow",
  "core",
  "net",
  "base",
  "field",
  "way",
  "point",
  "link",
  "cloud",
  "stack",
  "wise",
  "mint",
  "vibe",
  "peak",
];

/**
 * Supported Top-Level Domains (TLDs)
 */
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

/**
 * ResellerClub Product Key Mapping
 * Used for fetching TLD-specific pricing.
 */
export const TLD_PRODUCT_MAP: Record<string, string> = {
  com: "domcno",
  net: "dotnet",
  org: "domorg",
  biz: "dombiz",
  info: "dominfo",
  us: "domus",
  in: "dotin",
  co: "dotco",
  io: "dotio",
  tech: "dottech",
  online: "dotonline",
  store: "dotstore",
  app: "dotapp",
  dev: "dotdev",
  me: "dotme",
  email: "dotemail",
};
