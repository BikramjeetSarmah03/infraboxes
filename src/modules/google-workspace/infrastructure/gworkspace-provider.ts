/**
 * Google Workspace Infrastructure Provider
 * Handles communication with ResellerClub GApps API via RC Proxy.
 */

import { ResellerClubConfig } from "@/modules/domains/domain-types";
import { 
  RCWorkspaceOrderDetails, 
  SetupAdminInput, 
  AddMailboxUserInput 
} from "../gworkspace-types";

const config: ResellerClubConfig = {
  authUserId: process.env.RESELLERCLUB_AUTH_USER_ID || "",
  apiKey: process.env.RESELLERCLUB_API_KEY || "",
  proxyUrl: process.env.RC_PROXY_URL,
  proxyToken: process.env.RC_PROXY_TOKEN,
};

const IS_TEST = process.env.RESELLERCLUB_IS_TEST === "true";
const BASE_URL = IS_TEST
  ? "https://test.httpapi.com/api"
  : "https://httpapi.com/api";

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Order Google Workspace for a domain
 */
export async function orderWorkspace(
  domainName: string,
  customerId: string,
  months: number = 12,
  noOfAccounts: number = 1,
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/order`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({
          domainName,
          customerId,
          months,
          noOfAccounts,
        }),
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing ResellerClub config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": domainName,
        "customer-id": customerId,
        months: months.toString(),
        "no-of-accounts": noOfAccounts.toString(),
        "invoice-option": "NoInvoice",
      });

      const url = `${BASE_URL}/gapps/in/add.json?${params.toString()}`;
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
        error: result.message || result.error || "Workspace order failed",
      };
    }
  } catch (error) {
    console.error("[gworkspace] Order workspace error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Setup Admin account for existing Workspace order
 */
export async function setupWorkspaceAdmin(
  input: SetupAdminInput,
): Promise<{ success: boolean; password?: string; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/admin/add`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({
          orderId: input.rcOrderId,
          emailAddress: input.emailPrefix,
          firstName: input.firstName,
          lastName: input.lastName,
          alternateEmailAddress: input.alternateEmail,
          customerName: input.customerName,
          company: input.company,
          zip: input.zip,
        }),
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing ResellerClub config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "order-id": input.rcOrderId,
        "email-address": input.emailPrefix,
        "first-name": input.firstName,
        "last-name": input.lastName,
        "alternate-email-address": input.alternateEmail,
        name: input.customerName,
        company: input.company,
        zip: input.zip,
      });

      const url = `${BASE_URL}/gapps/in/admin/add.json?${params.toString()}`;
      response = await fetch(url, {
        method: "POST",
        headers: COMMON_HEADERS,
      });
    }

    const result = await response.json();

    if (response.ok && result.status === "Success") {
      return { 
        success: true, 
        password: result.password // RC returns this for auto-gen
      };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Admin setup failed",
      };
    }
  } catch (error) {
    console.error("[gworkspace] Setup admin error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add a new user mailbox to Workspace
 */
export async function addMailboxUser(
  input: AddMailboxUserInput,
): Promise<{ success: boolean; password?: string; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/add-user`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({
          domainName: input.domainName,
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
        }),
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing ResellerClub config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": input.domainName,
        username: input.username,
        "first-name": input.firstName,
        "last-name": input.lastName,
      });

      const url = `${BASE_URL}/googleapps/add-user.json?${params.toString()}`;
      response = await fetch(url, {
        method: "POST",
        headers: COMMON_HEADERS,
      });
    }

    const result = await response.json();

    if (response.ok && result.status === "Success") {
      return { 
        success: true,
        password: result.password // RC returns this for auto-gen
      };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Add user failed",
      };
    }
  } catch (error) {
    console.error("[gworkspace] Add user error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Workspace order details
 */
export async function getWorkspaceDetails(
  rcOrderId: string,
): Promise<{ success: boolean; details?: RCWorkspaceOrderDetails; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/details?order-id=${rcOrderId}`;
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.proxyToken}`,
        },
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing ResellerClub config" };
      }

      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "order-id": rcOrderId,
      });

      const url = `${BASE_URL}/googleapps/details.json?${params.toString()}`;
      response = await fetch(url, { headers: COMMON_HEADERS });
    }

    const result = await response.json();

    if (response.ok && result.orderid) {
      return { success: true, details: result };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Failed to get workspace details",
      };
    }
  } catch (error) {
    console.error("[gworkspace] Get details error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search Google Workspace orders
 */
export async function searchWorkspaceOrders(
  params: {
    domainName?: string;
    customerId?: string;
    status?: string;
  }
): Promise<{ success: boolean; orders?: Record<string, unknown>[]; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const queryParams = new URLSearchParams();
      if (params.domainName) queryParams.append("domainName", params.domainName);
      if (params.customerId) queryParams.append("customerId", params.customerId);
      if (params.status) queryParams.append("status", params.status);

      const url = `${config.proxyUrl}/googleapps/search?${queryParams.toString()}`;
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.proxyToken}`,
        },
      });
    } else {
      if (!config.authUserId || !config.apiKey) {
        return { success: false, error: "Missing ResellerClub config" };
      }

      const queryParams = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "no-of-records": "10",
        "page-no": "1",
      });
      if (params.domainName) queryParams.append("domain-name", params.domainName);
      if (params.customerId) queryParams.append("customer-id", params.customerId);
      if (params.status) queryParams.append("status", params.status);

      const url = `${BASE_URL}/gapps/in/search.json?${queryParams.toString()}`;
      response = await fetch(url, { headers: COMMON_HEADERS });
    }

    const result = await response.json();

    if (response.ok) {
      // The search API usually returns an object with results keys or an array
      return { success: true, orders: result.results || (Array.isArray(result) ? result : []) };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Search failed",
      };
    }
  } catch (error) {
    console.error("[gworkspace] Search error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
