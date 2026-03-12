export interface DomainSuggestion {
  domain: string;
  sld: string;
  tld: string;
}

export interface DomainAvailability {
  domain: string;
  status: "available" | "taken" | "unknown";
  isPremium: boolean;
  pricing?: {
    register?: string;
    renew?: string;
  };
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price: string;
  currency: string;
  isPremium: boolean;
}

export interface ResellerClubConfig {
  authUserId: string;
  apiKey: string;
  proxyUrl?: string;
  proxyToken?: string;
}

export interface ResellerClubCustomerData {
  username: string;
  password?: string;
  name: string;
  company: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  phoneCountryCode: string; // e.g., "91"
  phone: string;
  langPref?: string;
}
export interface BillingData {
  name: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  stateCode?: string;
  zipcode: string;
  country: string;
  countryCode: string;
}

export interface RCPricingResponse {
  [productKey: string]: {
    adddomain?: {
      [years: string]: string;
    };
    renewdomain?: {
      [years: string]: string;
    };
  };
}

export interface DNSRecord {
  id: string;
  type: string;
  host: string;
  value: string;
  ttl: number;
  priority?: number;
}
