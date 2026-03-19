"use server";

import { revalidatePath } from "next/cache";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { headers } from "next/headers";
import { db } from "@/shared/infrastructure/database/db-client";
import {
  googleWorkspaceOrder,
  googleWorkspaceMailbox,
  user as userSchema,
  domain as domainSchema,
} from "@/shared/infrastructure/database/schemas";
import {
  orderWorkspace,
  setupWorkspaceAdmin as setupAdminProvider,
  addMailboxUser as addUserProvider,
  getWorkspaceDetails,
  searchWorkspaceOrders,
  addWorkspaceAccounts,
  activateFreeEmail,
} from "../infrastructure/gworkspace-provider";
import type { WorkspaceOrderStatus } from "../gworkspace-types";
import {
  addDnsRecord,
  getDomainDetailsByName,
} from "@/modules/domains/infrastructure/resellerclub-provider";
import { activateDns } from "@/modules/dns-records/actions/dns-actions";

/**
 * Create a new Google Workspace order
 */
export async function createWorkspaceOrder(
  domainId: string,
  months: number = 12,
  numberOfAccounts: number = 1,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Get domain and user details
    const domainRecord = await db.query.domain.findFirst({
      where: eq(domainSchema.id, domainId),
    });

    if (!domainRecord) throw new Error("Domain not found");
    if (domainRecord.userId !== session.user.id)
      throw new Error("Unauthorized");

    const userRecord = await db.query.user.findFirst({
      where: eq(userSchema.id, session.user.id),
    });

    if (!userRecord || !userRecord.resellerclubCustomerId) {
      throw new Error(
        "ResellerClub customer account required. Please register a domain first.",
      );
    }

    // 1.5 Auto-activate DNS if not already active
    if (!domainRecord.isDnsActivated) {
      console.log(`[gworkspace] DNS not activated for ${domainRecord.name}, triggering activation...`);
      const activationRes = await activateDns(domainId);
      if (!activationRes.success) {
        console.warn(`[gworkspace] DNS activation failed: ${activationRes.error}. Attempting to proceed anyway.`);
      } else {
        console.log(`[gworkspace] DNS activated successfully for ${domainRecord.name}`);
      }
    }

    // 2. Place order via RC Provider
    console.log(`[gworkspace] Ordering workspace for ${domainRecord.name}`);
    const orderResult = await orderWorkspace(
      domainRecord.name,
      userRecord.resellerclubCustomerId,
      months,
      numberOfAccounts,
    );

    if (!orderResult.success || !orderResult.orderId) {
      throw new Error(orderResult.error || "Failed to place workspace order");
    }

    // 3. Save to local DB
    const workspaceOrderId = crypto.randomUUID();
    await db.insert(googleWorkspaceOrder).values({
      id: workspaceOrderId,
      userId: session.user.id,
      domainId: domainId,
      rcOrderId: orderResult.orderId,
      rcCustomerId: userRecord.resellerclubCustomerId,
      domainName: domainRecord.name,
      status: "active",
      numberOfAccounts,
      months,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. Auto-add Google MX Records
    console.log(
      `[gworkspace] Auto-configuring MX records for ${domainRecord.name}`,
    );
    const mxRecords = [
      { priority: 1, value: "ASPMX.L.GOOGLE.COM" },
      { priority: 5, value: "ALT1.ASPMX.L.GOOGLE.COM" },
      { priority: 5, value: "ALT2.ASPMX.L.GOOGLE.COM" },
      { priority: 10, value: "ALT3.ASPMX.L.GOOGLE.COM" },
      { priority: 10, value: "ALT4.ASPMX.L.GOOGLE.COM" },
    ];

    for (const record of mxRecords) {
      await addDnsRecord(
        domainRecord.name,
        domainRecord.orderId,
        "MX",
        "@",
        record.value,
        7200,
        record.priority,
      );
    }

    revalidatePath("/mailboxes/google");
    return { success: true, workspaceOrderId };
  } catch (error) {
    console.error("[gworkspace] createWorkspaceOrder error:", error);

    // If order already exists or limit reached, try to find and import it
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("Limit reached")
    ) {
      console.log(
        "[gworkspace] Attempting to import existing order instead...",
      );
      const importResult = await importWorkspaceOrder(domainId);
      if (importResult.success) return importResult;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Deep Import: Import a Workspace order by domain name
 * Even if the domain is not in our local database
 */
export async function deepImportWorkspace(domainName: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Get user and security check
    const userRecord = await db.query.user.findFirst({
      where: eq(userSchema.id, session.user.id),
    });

    if (!userRecord || !userRecord.resellerclubCustomerId) {
      throw new Error(
        "ResellerClub customer account required. Please register a domain first.",
      );
    }

    // 2. Fetch Order ID directly by domain name
    console.log(`[gworkspace] Fetching Order ID for ${domainName}...`);
    const { getGSuiteOrderId } = await import("../infrastructure/gworkspace-provider");
    const orderIdResult = await getGSuiteOrderId(domainName);
    
    let rcOrderId: string | undefined;
    let rcOrderRaw: any;

    if (orderIdResult.success && orderIdResult.orderId) {
      rcOrderId = orderIdResult.orderId;
      console.log(`[gworkspace] Found Order ID: ${rcOrderId}`);
    } else {
      // Fallback: Search for Workspace Order by domain name first
      console.log(`[gworkspace] Direct ID fetch failed. Searching Workspace API for ${domainName}...`);
      let workspaceSearch = await searchWorkspaceOrders({ domainName });

      if (
        !workspaceSearch.success ||
        !workspaceSearch.orders ||
        workspaceSearch.orders.length === 0
      ) {
        workspaceSearch = await searchWorkspaceOrders({
          customerId: userRecord.resellerclubCustomerId,
        });
      }

      if (workspaceSearch.success && workspaceSearch.orders && workspaceSearch.orders.length > 0) {
        rcOrderRaw = (workspaceSearch.orders as any[]).find((o) => {
          const dName = (o.domainname || o.domain_name || o["entity.description"] || "").toLowerCase();
          const target = domainName.toLowerCase();
          return dName === target || (dName.length > 5 && target.startsWith(dName));
        });

        if (rcOrderRaw) {
          rcOrderId = rcOrderRaw.orderid || rcOrderRaw.entityid || rcOrderRaw["orders.orderid"] || rcOrderRaw["entity.entityid"];
        }
      }
    }

    if (!rcOrderId) {
      throw new Error(`Could not find a Google Workspace order for ${domainName} on your account.`);
    }

    // 2.a If we only have OrderId but not the raw order, fetch details to get CustomerID
    let rcCustomerId: string | undefined;
    if (rcOrderRaw) {
      rcCustomerId = (rcOrderRaw.customerid || rcOrderRaw.entity_customerid || rcOrderRaw["entity.customerid"])?.toString();
    } else {
      const { getWorkspaceDetails } = await import("../infrastructure/gworkspace-provider");
      const detailsRes = await getWorkspaceDetails(rcOrderId);
      if (detailsRes.success && detailsRes.details) {
        rcCustomerId = (detailsRes.details as any).customerid?.toString();
      }
    }

    if (!rcCustomerId) {
      throw new Error("Could not determine ResellerClub Customer ID for this order.");
    }

    // 3. Ownership Verification
    if (rcCustomerId !== userRecord.resellerclubCustomerId) {
      console.warn(
        `[gworkspace] Ownership mismatch for ${domainName}. Order Customer: ${rcCustomerId}, Local User RC ID: ${userRecord.resellerclubCustomerId}`,
      );
      throw new Error("You do not own this workspace order on ResellerClub.");
    }

    // 3. Ensure local domain record exists
    let domainRecord = await db.query.domain.findFirst({
      where: eq(domainSchema.name, domainName),
    });

    if (!domainRecord) {
      console.log(
        `[gworkspace] Domain ${domainName} not found locally. Searching Domain API...`,
      );
      const rcDomain = await getDomainDetailsByName(domainName);

      let domainOrderId = "0"; // Placeholder if Domain API fails

      if (rcDomain.success && rcDomain.details) {
        domainOrderId = (rcDomain.details as any).orderid?.toString() || "0";
      } else {
        console.warn(
          `[gworkspace] Domain API failed for discovery (${rcDomain.error}). Using placeholder Order ID.`,
        );
      }

      const domainId = crypto.randomUUID();
      await db.insert(domainSchema).values({
        id: domainId,
        userId: session.user.id,
        name: domainName,
        orderId: domainOrderId,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      domainRecord = await db.query.domain.findFirst({
        where: eq(domainSchema.id, domainId),
      });
    }

    if (!domainRecord)
      throw new Error("Failed to secure domain record for import");

    // 4. Import Workspace Order
    console.log(
      `[gworkspace] Proceeding to import workspace order ${rcOrderId} for ${domainName}...`,
    );
    return await importWorkspaceOrder(domainRecord.id, rcOrderId.toString());
  } catch (error: unknown) {
    console.error(
      `[gworkspace] deepImportWorkspace error for ${domainName}:`,
      error,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Import an existing Google Workspace order from ResellerClub
 */
export async function importWorkspaceOrder(
  domainId: string,
  providedRcOrderId?: string,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) throw new Error("Unauthorized");

    const domainRecord = await db.query.domain.findFirst({
      where: eq(domainSchema.id, domainId),
    });

    if (!domainRecord) throw new Error("Domain not found");

    const userRecord = await db.query.user.findFirst({
      where: eq(userSchema.id, session.user.id),
    });

    if (!userRecord || !userRecord.resellerclubCustomerId) {
      throw new Error("ResellerClub customer required");
    }

    // 0.5 Auto-activate DNS if not already active
    if (!domainRecord.isDnsActivated) {
      console.log(`[gworkspace] DNS not activated for ${domainRecord.name}, triggering activation...`);
      const activationRes = await activateDns(domainId);
      if (!activationRes.success) {
        console.warn(`[gworkspace] DNS activation failed: ${activationRes.error}. Attempting to proceed anyway.`);
      }
    }

    // 1. Get or Search for RC Order
    let rcOrder: Record<string, any> | null = null;
    let rcOrderId = providedRcOrderId;

    if (!rcOrderId) {
      console.log(`[gworkspace] Searching for order for domainId: ${domainId}`);
      const searchResult = await searchWorkspaceOrders({
        domainName: domainRecord.name,
        customerId: userRecord.resellerclubCustomerId,
      });

      if (
        !searchResult.success ||
        !searchResult.orders ||
        searchResult.orders.length === 0
      ) {
        throw new Error("No existing order found on ResellerClub to import");
      }
      rcOrder = searchResult.orders[0] as Record<string, any>;
      rcOrderId =
        rcOrder.orderid ||
        rcOrder.entityid ||
        rcOrder["orders.orderid"] ||
        rcOrder["entity.entityid"] ||
        Object.keys(rcOrder)[0];
    }

    if (!rcOrderId) throw new Error("Could not determine RC Order ID");

    // 2. Fetch full details if we don't have rcOrder yet
    if (!rcOrder) {
      const detailsRes = await getWorkspaceDetails(rcOrderId.toString());
      if (!detailsRes.success || !detailsRes.details) {
        throw new Error(
          detailsRes.error || "Failed to fetch workspace details during import",
        );
      }
      rcOrder = detailsRes.details as any;
    }

    // 2. Reconciliation: If a domain already has an order with ID "0", we update it
    const existingWithZero = await db.query.googleWorkspaceOrder.findFirst({
      where: and(
        eq(googleWorkspaceOrder.domainName, domainRecord.name),
        eq(googleWorkspaceOrder.rcOrderId, "0"),
      ),
    });

    if (existingWithZero) {
      console.log(
        `[gworkspace] Reconciling existing order ${existingWithZero.id} (ID: 0) to real ID ${rcOrderId}`,
      );
      await db
        .update(googleWorkspaceOrder)
        .set({
          rcOrderId: rcOrderId.toString(),
          updatedAt: new Date(),
        })
        .where(eq(googleWorkspaceOrder.id, existingWithZero.id));
      return { success: true, workspaceOrderId: existingWithZero.id };
    }

    const existingLocal = await db.query.googleWorkspaceOrder.findFirst({
      where: and(
        eq(googleWorkspaceOrder.userId, session.user.id),
        eq(googleWorkspaceOrder.rcOrderId, rcOrderId.toString()),
      ),
    });

    if (existingLocal) {
      return { success: true, workspaceOrderId: existingLocal.id };
    }

    // 3. Save to local DB
    const workspaceOrderId = crypto.randomUUID();

    // Helper to get nested/dot-notated values
    const getVal = (paths: string[]) => {
      for (const p of paths) {
        if (rcOrder![p] !== undefined) return rcOrder![p];
      }
      return null;
    };

    const status = (
      getVal(["currentstatus", "entity.currentstatus", "status"]) || "active"
    )
      .toString()
      .toLowerCase();
    const numberOfAccounts = parseInt(
      (getVal(["no_of_accounts", "numberOfAccounts"]) || "1").toString(),
    );
    const months = parseInt((getVal(["months", "tenure"]) || "12").toString());
    const adminEmail =
      getVal(["admin_email", "adminEmail"])?.toString() || null;

    await db.insert(googleWorkspaceOrder).values({
      id: workspaceOrderId,
      userId: session.user.id,
      domainId: domainId,
      rcOrderId: rcOrderId.toString(),
      rcCustomerId: userRecord.resellerclubCustomerId,
      domainName: domainRecord.name,
      status: status as any,
      numberOfAccounts,
      months,
      adminEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/mailboxes/google");
    return { success: true, workspaceOrderId };
  } catch (error) {
    console.error("[gworkspace] importWorkspaceOrder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Setup the primary admin account for a workspace order
 */
export async function setupWorkspacePrimaryAdmin(
  workspaceOrderId: string,
  emailPrefix: string,
  firstName: string,
  lastName: string,
  alternateEmail: string,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Get workspace order
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId),
    });

    if (!order || order.userId !== session.user.id)
      throw new Error("Workspace order not found");

    // 2. Reconciliation: If rcOrderId is "0" or invalid, try to find the real one
    let targetRcOrderId = order.rcOrderId;
    const isInvalidId =
      !targetRcOrderId ||
      targetRcOrderId === "0" ||
      targetRcOrderId === "undefined";
    
    if (isInvalidId) {
      console.log(
        `[gworkspace] setupWorkspacePrimaryAdmin: rcOrderId is "${targetRcOrderId}" for ${order.domainName}, reconciling...`,
      );
      const userRecord = await db.query.user.findFirst({
        where: eq(userSchema.id, session.user.id),
      });

      if (userRecord?.resellerclubCustomerId) {
        const searchResult = await searchWorkspaceOrders({
          domainName: order.domainName,
          customerId: userRecord.resellerclubCustomerId,
        });

        if (
          searchResult.success &&
          searchResult.orders &&
          searchResult.orders.length > 0
        ) {
          const rcOrder = searchResult.orders[0] as Record<string, any>;
          const realId = (
            rcOrder.orderid ||
            rcOrder.entityid ||
            rcOrder["orders.orderid"] ||
            rcOrder["entity.entityid"]
          )?.toString();

          if (realId) {
            console.log(
              `[gworkspace] setupWorkspacePrimaryAdmin: Found real ID ${realId} for ${order.domainName}`,
            );
            targetRcOrderId = realId;
            // Update the DB so we don't have to do this again
            await db
              .update(googleWorkspaceOrder)
              .set({ rcOrderId: realId, updatedAt: new Date() })
              .where(eq(googleWorkspaceOrder.id, workspaceOrderId));
          }
        }
      }
    }

    if (!targetRcOrderId || targetRcOrderId === "0" || targetRcOrderId === "undefined") {
      console.warn(`[gworkspace] setupWorkspacePrimaryAdmin: FAILED RECONCILIATION. Domain=${order.domainName}, OriginalID=${order.rcOrderId}, Status=${order.status}`);
      throw new Error(`Could not determine real Order ID for workspace (current: ${targetRcOrderId})`);
    }

    console.log(`[gworkspace] setupWorkspacePrimaryAdmin: INVOKING PROVIDER. Domain=${order.domainName}, targetRcOrderId=${targetRcOrderId}`);

    // 2.5 Activate Free Email (Prerequisite for GSuite Admin setup)
    try {
      console.log(`[gworkspace] setupWorkspacePrimaryAdmin: Activating Free Email for ${targetRcOrderId}`);
      const activationResult = await activateFreeEmail(targetRcOrderId);
      if (!activationResult.success) {
        // If it's 404 or already activated, we DON'T stop. We proceed to admin setup.
        console.warn(`[gworkspace] setupWorkspacePrimaryAdmin: Free Email activation result (proceeding anyway):`, activationResult.error);
      }
    } catch (actError) {
      console.error(`[gworkspace] setupWorkspacePrimaryAdmin: Free Email activation error (ignoring):`, actError);
    }

    // 2.7 Fetch real user profile data for zip/company
    const userData = await db.query.user.findFirst({
      where: eq(userSchema.id, session.user.id),
    });

    if (!userData?.zip || !userData?.companyName) {
      throw new Error("Please complete your profile (Zip Code and Company Name) before setting up GSuite.");
    }

    // 3. Call provider to setup admin
    const setupResult = await setupAdminProvider({
      workspaceOrderId: order.id,
      rcOrderId: targetRcOrderId,
      domainName: order.domainName,
      emailPrefix: emailPrefix,
      firstName,
      lastName,
      alternateEmail,
      customerName: userData.name || session.user.name || "Customer",
      company: userData.companyName,
      zip: userData.zip,
    });

    if (!setupResult.success) {
      console.error(`[gworkspace] Admin setup failed for ${order.domainName}:`, setupResult.error);
      throw new Error(setupResult.error || "Failed to setup admin account");
    }

    // 3. Update order in DB
    const adminEmail = `${emailPrefix}@${order.domainName}`;
    await db
      .update(googleWorkspaceOrder)
      .set({
        status: "admin_configured",
        adminEmail,
        updatedAt: new Date(),
      })
      .where(eq(googleWorkspaceOrder.id, workspaceOrderId));

    // 4. Create admin mailbox record
    await db.insert(googleWorkspaceMailbox).values({
      id: crypto.randomUUID(),
      workspaceOrderId: order.id,
      email: adminEmail,
      username: emailPrefix,
      firstName,
      lastName,
      password: setupResult.password,
      passwordUpdatedAt: setupResult.password ? new Date() : null,
      role: "admin",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/mailboxes/google");
    return { success: true };
  } catch (error) {
    console.error("[gworkspace] setupWorkspacePrimaryAdmin error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Add a new user mailbox to the workspace
 */
export async function addWorkspaceUserMailbox(
  workspaceOrderId: string,
  username: string,
  firstName: string,
  lastName: string,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) throw new Error("Unauthorized");

    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId),
    });

    if (!order || order.userId !== session.user.id)
      throw new Error("Workspace order not found");

    // 1. Call provider
    const addResult = await addUserProvider({
      workspaceOrderId: order.id,
      domainName: order.domainName,
      username,
      firstName,
      lastName,
    });

    if (!addResult.success) {
      throw new Error(addResult.error || "Failed to add user mailbox");
    }

    // 2. Save mailbox to DB
    const mailboxEmail = `${username}@${order.domainName}`;
    await db.insert(googleWorkspaceMailbox).values({
      id: crypto.randomUUID(),
      workspaceOrderId: order.id,
      email: mailboxEmail,
      username,
      firstName,
      lastName,
      password: addResult.password,
      passwordUpdatedAt: addResult.password ? new Date() : null,
      role: "user",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/mailboxes/google");
    return { success: true };
  } catch (error) {
    console.error("[gworkspace] addWorkspaceUserMailbox error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch all workspace orders for the current user
 */
export async function getUserWorkspaceOrders() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const orders = await db.query.googleWorkspaceOrder.findMany({
      where: eq(googleWorkspaceOrder.userId, session.user.id),
      orderBy: [desc(googleWorkspaceOrder.createdAt)],
      with: {
        mailboxes: true,
      },
    });

    return { success: true, orders };
  } catch (error) {
    console.error("[gworkspace] getUserWorkspaceOrders error:", error);
    return { success: false, error: "Failed to fetch workspace orders" };
  }
}

/**
 * Refresh local workspace order details from RC API
 */
export async function syncWorkspaceOrderDetails(workspaceOrderId: string) {
  try {
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId),
    });

    if (!order) throw new Error("Order not found");

    const detailsResult = await getWorkspaceDetails(order.rcOrderId);
    if (!detailsResult.success || !detailsResult.details) {
      throw new Error(
        detailsResult.error || "Failed to sync from ResellerClub",
      );
    }

    const rcStatus =
      detailsResult.details.status.toLowerCase() as WorkspaceOrderStatus;

    // Update local status if changed
    await db
      .update(googleWorkspaceOrder)
      .set({
        status: rcStatus,
        updatedAt: new Date(),
      })
      .where(eq(googleWorkspaceOrder.id, workspaceOrderId));

    revalidatePath("/mailboxes/google");
    return { success: true };
  } catch (error) {
    console.error("[gworkspace] syncWorkspaceOrderDetails error:", error);
    return { success: false, error: "Sync failed" };
  }
}

/**
 * Get credentials for a single mailbox
 */
export async function getMailboxCredentials(mailboxId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) throw new Error("Unauthorized");

    const mailbox = await db.query.googleWorkspaceMailbox.findFirst({
      where: eq(googleWorkspaceMailbox.id, mailboxId),
      with: {
        order: {
          columns: {
            userId: true,
          },
        },
      },
    });

    if (!mailbox || (mailbox as any).order.userId !== session.user.id) {
      throw new Error("Mailbox not found");
    }

    return {
      success: true,
      credentials: {
        email: mailbox.email,
        password: mailbox.password || "N/A",
        updatedAt: mailbox.passwordUpdatedAt,
      },
    };
  } catch (error) {
    console.error("[gworkspace] getMailboxCredentials error:", error);
    return { success: false, error: "Failed to fetch credentials" };
  }
}

/**
 * Get all credentials for a workspace order
 */
export async function getAllOrderCredentials(workspaceOrderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) throw new Error("Unauthorized");

    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId),
      with: {
        mailboxes: true,
      },
    });

    if (!order || order.userId !== session.user.id) {
      throw new Error("Order not found");
    }

    const credentials = order.mailboxes.map((m) => ({
      email: m.email,
      username: m.username,
      password: m.password || "N/A",
      role: m.role,
    }));

    return { success: true, credentials };
  } catch (error) {
    console.error("[gworkspace] getAllOrderCredentials error:", error);
    return { success: false, error: "Failed to fetch all credentials" };
  }
}
/**
 * Add more licenses (seats) to an existing workspace order
 */
export async function addWorkspaceLicensesAction(
  workspaceOrderId: string,
  noOfAccounts: number,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Get workspace order
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId),
    });

    if (!order || order.userId !== session.user.id) {
      throw new Error("Workspace order not found");
    }

    // 2. Reconciliation: If rcOrderId is "0" or invalid, try to find the real one
    let targetRcOrderId = order.rcOrderId;
    const isInvalidId =
      !targetRcOrderId ||
      targetRcOrderId === "0" ||
      targetRcOrderId === "undefined";
    
    if (isInvalidId) {
      console.log(
        `[gworkspace] addWorkspaceLicensesAction: rcOrderId is "${targetRcOrderId}" for ${order.domainName}, reconciling...`,
      );
      const userRecord = await db.query.user.findFirst({
        where: eq(userSchema.id, session.user.id),
      });

      if (userRecord?.resellerclubCustomerId) {
        const searchResult = await searchWorkspaceOrders({
          domainName: order.domainName,
          customerId: userRecord.resellerclubCustomerId,
        });

        if (
          searchResult.success &&
          searchResult.orders &&
          searchResult.orders.length > 0
        ) {
          const rcOrder = searchResult.orders[0] as Record<string, any>;
          const realId = (
            rcOrder.orderid ||
            rcOrder.entityid ||
            rcOrder["orders.orderid"] ||
            rcOrder["entity.entityid"]
          )?.toString();

          if (realId) {
            console.log(
              `[gworkspace] addWorkspaceLicensesAction: Found real ID ${realId} for ${order.domainName}`,
            );
            targetRcOrderId = realId;
            // Update the DB so we don't have to do this again
            await db
              .update(googleWorkspaceOrder)
              .set({ rcOrderId: realId, updatedAt: new Date() })
              .where(eq(googleWorkspaceOrder.id, workspaceOrderId));
          }
        }
      }
    }

    if (!targetRcOrderId || targetRcOrderId === "0" || targetRcOrderId === "undefined") {
      console.warn(`[gworkspace] addWorkspaceLicensesAction: FAILED RECONCILIATION. Domain=${order.domainName}, OriginalID=${order.rcOrderId}`);
      throw new Error(`Could not determine real Order ID for workspace (current: ${targetRcOrderId})`);
    }

    console.log(`[gworkspace] addWorkspaceLicensesAction: INVOKING PROVIDER. Domain=${order.domainName}, targetRcOrderId=${targetRcOrderId}`);

    // 3. Call provider to add licenses
    const result = await addWorkspaceAccounts(targetRcOrderId, noOfAccounts);

    if (!result.success) {
      throw new Error(result.error || "Failed to add licenses");
    }

    // 3. Update DB locally
    await db
      .update(googleWorkspaceOrder)
      .set({
        numberOfAccounts: order.numberOfAccounts + noOfAccounts,
        updatedAt: new Date(),
      })
      .where(eq(googleWorkspaceOrder.id, workspaceOrderId));

    revalidatePath("/mailboxes/google");
    return { success: true };
  } catch (error) {
    console.error("[gworkspace] addWorkspaceLicensesAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Renew workspace order action
 */
export async function renewWorkspaceAction(workspaceOrderId: string, months: number = 12) {
  try {
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId)
    });
    if (!order) throw new Error("Order not found");

    const { renewWorkspace } = await import("../infrastructure/gworkspace-provider");
    const res = await renewWorkspace(order.rcOrderId, months);
    if (res.success) {
      await db.update(googleWorkspaceOrder)
        .set({ updatedAt: new Date() })
        .where(eq(googleWorkspaceOrder.id, workspaceOrderId));
      revalidatePath("/mailboxes/google");
    }
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Renewal failed" };
  }
}

/**
 * Suspend workspace order action
 */
export async function suspendWorkspaceAction(workspaceOrderId: string) {
  try {
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId)
    });
    if (!order) throw new Error("Order not found");

    const { suspendWorkspace } = await import("../infrastructure/gworkspace-provider");
    const res = await suspendWorkspace(order.rcOrderId);
    if (res.success) {
      await db.update(googleWorkspaceOrder)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(googleWorkspaceOrder.id, workspaceOrderId));
      revalidatePath("/mailboxes/google");
    }
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Suspension failed" };
  }
}

/**
 * Unsuspend workspace order action
 */
export async function unsuspendWorkspaceAction(workspaceOrderId: string) {
  try {
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId)
    });
    if (!order) throw new Error("Order not found");

    const { unsuspendWorkspace } = await import("../infrastructure/gworkspace-provider");
    const res = await unsuspendWorkspace(order.rcOrderId);
    if (res.success) {
      await db.update(googleWorkspaceOrder)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(googleWorkspaceOrder.id, workspaceOrderId));
      revalidatePath("/mailboxes/google");
    }
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unsuspension failed" };
  }
}

/**
 * Delete (Cancel) workspace order action
 */
export async function deleteWorkspaceAction(workspaceOrderId: string) {
  try {
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId)
    });
    if (!order) throw new Error("Order not found");

    const { deleteWorkspace } = await import("../infrastructure/gworkspace-provider");
    const res = await deleteWorkspace(order.rcOrderId);
    if (res.success) {
      await db.update(googleWorkspaceOrder)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(googleWorkspaceOrder.id, workspaceOrderId));
      
      // Mark all mailboxes as deleted
      await db.update(googleWorkspaceMailbox)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(googleWorkspaceMailbox.workspaceOrderId, workspaceOrderId));

      revalidatePath("/mailboxes/google");
    }
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Deletion failed" };
  }
}

/**
 * Delete a specific mailbox user action
 */
export async function deleteWorkspaceMailboxAction(mailboxId: string) {
  try {
    const mailbox = await db.query.googleWorkspaceMailbox.findFirst({
      where: eq(googleWorkspaceMailbox.id, mailboxId),
      with: {
        order: true
      }
    });

    if (!mailbox || !mailbox.order) throw new Error("Mailbox not found");

    const { deleteMailboxUser } = await import("../infrastructure/gworkspace-provider");
    const res = await deleteMailboxUser(mailbox.order.domainName, mailbox.username);
    
    if (res.success) {
      await db.update(googleWorkspaceMailbox)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(googleWorkspaceMailbox.id, mailboxId));
      
      revalidatePath("/mailboxes/google");
    }
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "User deletion failed" };
  }
}

/**
 * Get Google Workspace DNS records action
 */
export async function getWorkspaceDnsRecordsAction(workspaceOrderId: string) {
  try {
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId)
    });
    if (!order) throw new Error("Order not found");

    const { getWorkspaceDnsRecords } = await import("../infrastructure/gworkspace-provider");
    return await getWorkspaceDnsRecords(order.domainName);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch DNS records" };
  }
}

/**
 * Get Google Workspace transfer token/details
 * Note: RC API usually provides this via the details or a specific transfer context
 */
export async function getWorkspaceTransferDetailsAction(workspaceOrderId: string): Promise<{
  success: boolean;
  transferToken?: string;
  details?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId)
    });
    if (!order) throw new Error("Order not found");

    const { getWorkspaceDetails } = await import("../infrastructure/gworkspace-provider");
    const res = await getWorkspaceDetails(order.rcOrderId);
    
    if (res.success && res.details) {
      // In ResellerClub, transfer token is often 'transfer_token' or 'customer_token' in details
      const details = res.details as unknown as Record<string, unknown>;
      return {
        success: true,
        transferToken: (details.transfer_token || details.customer_token || "Consult ResellerClub Panel") as string,
        details: details
      };
    }
    return {
      success: false,
      error: res.error || "Failed to fetch details"
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch transfer details" };
  }
}

/**
 * Reduce the number of licenses (accounts) for a workspace
 */
export async function deleteWorkspaceAccountsAction(
  workspaceOrderId: string,
  noOfAccounts: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session?.user?.id) throw new Error("Unauthorized");

    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId)
    });
    if (!order || order.userId !== session.user.id) {
      throw new Error("Workspace order not found");
    }

    const { deleteWorkspaceAccounts } = await import("../infrastructure/gworkspace-provider");
    const res = await deleteWorkspaceAccounts(order.rcOrderId, noOfAccounts);

    if (res.success) {
      // Update local count
      const newCount = Math.max(0, order.numberOfAccounts - noOfAccounts);
      await db.update(googleWorkspaceOrder)
        .set({ numberOfAccounts: newCount, updatedAt: new Date() })
        .where(eq(googleWorkspaceOrder.id, workspaceOrderId));

      revalidatePath("/mailboxes/google");
      return { success: true };
    }

    return { success: false, error: res.error || "Failed to reduce licenses" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "License reduction error" };
  }
}
