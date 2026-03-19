/**
 * Google Workspace Infrastructure Provider
 * Handles communication with ResellerClub GApps API via RC Proxy.
 */

import { ResellerClubConfig } from "@/modules/domains/domain-types";
import { 
  RCWorkspaceOrderDetails, 
  SetupAdminInput, 
  AddMailboxUserInput,
  WorkspaceOrderStatus
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
      const fullEmail = `${input.emailPrefix.trim()}@${input.domainName.toLowerCase().trim()}`;
      const url = `${config.proxyUrl}/googleapps/admin/add`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({
          orderId: input.rcOrderId,
          domainName: input.domainName,
          emailAddress: fullEmail,
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

      const fullEmail = `${input.emailPrefix.trim()}@${input.domainName.toLowerCase().trim()}`;
      const params = new URLSearchParams({
        "auth-userid": config.authUserId || "",
        "api-key": config.apiKey || "",
        "order-id": input.rcOrderId,
        "email-address": fullEmail,
        "domain-name": input.domainName.toLowerCase().trim(),
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
    console.log(`[gworkspace] searchWorkspaceOrders for ${params.domainName || params.customerId} raw result:`, JSON.stringify(result).slice(0, 500));

    if (response.ok) {
      // RC Search API returns { "1": {..}, "2": {..}, "recno": X } or an array
      let orders: any[] = [];
      if (Array.isArray(result)) {
        orders = result;
      } else if (typeof result === "object" && result !== null) {
        // Extract numeric keys
        orders = Object.keys(result)
          .filter(k => !Number.isNaN(Number(k)))
          .map(k => (result as Record<string, any>)[k]);
      }
      return { success: true, orders };
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
/**
 * Add more accounts (licenses/seats) to an existing Workspace order
 */
export async function addWorkspaceAccounts(
  rcOrderId: string,
  noOfAccounts: number
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/add-account`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({
          orderId: rcOrderId,
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
        "order-id": rcOrderId,
        "no-of-accounts": noOfAccounts.toString(),
        "invoice-option": "NoInvoice",
      });

      const url = `${BASE_URL}/googleapps/add-account.json?${params.toString()}`;
      response = await fetch(url, {
        method: "POST",
        headers: COMMON_HEADERS,
      });
    }

    const result = await response.json();

    if (response.ok && (result.status === "Success" || result.actionid)) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.message || result.error || "Failed to add accounts",
      };
    }
  } catch (error) {
    console.error("[gworkspace] Add accounts error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Renew Google Workspace order
 */
export async function renewWorkspace(
  rcOrderId: string,
  months: number = 12
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/renew`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({
          orderId: rcOrderId,
          months,
        }),
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "order-id": rcOrderId,
        months: months.toString(),
        "invoice-option": "NoInvoice",
      });
      const url = `${BASE_URL}/googleapps/renew.json?${params.toString()}`;
      response = await fetch(url, { method: "POST", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    if (response.ok && (result.status === "Success" || result.actionid)) {
      return { success: true };
    }
    return { success: false, error: result.message || "Renewal failed" };
  } catch (error) {
    return { success: false, error: "Renewal error" };
  }
}

/**
 * Suspend Google Workspace order
 */
export async function suspendWorkspace(
  rcOrderId: string,
  reason: string = "Manual suspension"
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/suspend`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ orderId: rcOrderId, reason }),
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "order-id": rcOrderId,
        reason,
      });
      const url = `${BASE_URL}/googleapps/suspend.json?${params.toString()}`;
      response = await fetch(url, { method: "POST", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    return response.ok && result.status === "Success" 
      ? { success: true }
      : { success: false, error: result.message || "Suspension failed" };
  } catch (error) {
    return { success: false, error: "Suspension error" };
  }
}

/**
 * Unsuspend Google Workspace order
 */
export async function unsuspendWorkspace(
  rcOrderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/unsuspend`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ orderId: rcOrderId }),
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "order-id": rcOrderId,
      });
      const url = `${BASE_URL}/googleapps/unsuspend.json?${params.toString()}`;
      response = await fetch(url, { method: "POST", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    return response.ok && result.status === "Success" 
      ? { success: true }
      : { success: false, error: result.message || "Unsuspension failed" };
  } catch (error) {
    return { success: false, error: "Unsuspension error" };
  }
}

/**
 * Delete (Cancel) Google Workspace order
 */
export async function deleteWorkspace(
  rcOrderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/delete`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ orderId: rcOrderId }),
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "order-id": rcOrderId,
      });
      const url = `${BASE_URL}/googleapps/delete.json?${params.toString()}`;
      response = await fetch(url, { method: "POST", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    return response.ok && result.status === "Success" 
      ? { success: true }
      : { success: false, error: result.message || "Deletion failed" };
  } catch {
    return { success: false, error: "Deletion error" };
  }
}

/**
 * Get Google Workspace specific DNS records
 */
export async function getWorkspaceDnsRecords(
  domainName: string
): Promise<{ success: boolean; records?: Record<string, any>[]; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/dns-records?domain-name=${domainName}`;
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.proxyToken}`,
        },
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": domainName,
      });
      const url = `${BASE_URL}/googleapps/dns-records.json?${params.toString()}`;
      response = await fetch(url, { method: "GET", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    return response.ok 
      ? { success: true, records: result }
      : { success: false, error: result.message || "Failed to fetch DNS records" };
  } catch (error) {
    return { success: false, error: "DNS records fetch error" };
  }
}

/**
 * Activate Free Email service for a domain
 */
export async function activateFreeEmail(
  rcOrderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/activate-free-email`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ orderId: rcOrderId }),
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "order-id": rcOrderId,
      });
      const url = `${BASE_URL}/mail/activate.json?${params.toString()}`;
      response = await fetch(url, { method: "POST", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    return response.ok && result.status === "Success"
      ? { success: true }
      : { success: false, error: result.message || "Activation failed" };
  } catch (error) {
    return { success: false, error: "Activation error" };
  }
}

/**
 * Delete a specific mailbox user
 */
export async function deleteMailboxUser(
  domainName: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/delete-user`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ domainName, username }),
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": domainName,
        username,
      });
      const url = `${BASE_URL}/googleapps/delete-user.json?${params.toString()}`;
      response = await fetch(url, { method: "POST", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    return response.ok && result.status === "Success" 
      ? { success: true }
      : { success: false, error: result.message || "User deletion failed" };
  } catch (error) {
    return { success: false, error: "User deletion error" };
  }
}

/**
 * Delete accounts (license reduction)
 */
export async function deleteWorkspaceAccounts(
  rcOrderId: string,
  noOfAccounts: number
): Promise<{ success: boolean; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/delete-account`;
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyToken}`,
        },
        body: JSON.stringify({ orderId: rcOrderId, noOfAccounts }),
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "order-id": rcOrderId,
        "no-of-accounts": noOfAccounts.toString(),
      });
      const url = `${BASE_URL}/googleapps/delete-account.json?${params.toString()}`;
      response = await fetch(url, { method: "POST", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    return response.ok 
      ? { success: true }
      : { success: false, error: result.message || "License reduction failed" };
  } catch (error) {
    return { success: false, error: "License reduction error" };
  }
}

/**
 * Get Order ID from domain name
 */
export async function getGSuiteOrderId(
  domainName: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    let response: Response;

    if (config.proxyUrl && config.proxyToken) {
      const url = `${config.proxyUrl}/googleapps/order-id?domainName=${domainName}`;
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.proxyToken}`,
        },
      });
    } else {
      const params = new URLSearchParams({
        "auth-userid": config.authUserId,
        "api-key": config.apiKey,
        "domain-name": domainName,
      });
      const url = `${BASE_URL}/googleapps/orderid.json?${params.toString()}`;
      response = await fetch(url, { method: "GET", headers: COMMON_HEADERS });
    }

    const result = await response.json();
    // Result might be just the number or an error object
    if (typeof result === "number" || (typeof result === "string" && !Number.isNaN(Number(result)))) {
      return { success: true, orderId: result.toString() };
    }
    
    return { success: false, error: result.message || "Failed to fetch Order ID" };
  } catch (error) {
    return { success: false, error: "Get Order ID error" };
  }
}
