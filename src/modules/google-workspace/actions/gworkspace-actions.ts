"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { headers } from "next/headers";
import { db } from "@/shared/infrastructure/database/db-client";
import { 
  googleWorkspaceOrder, 
  googleWorkspaceMailbox, 
  user as userSchema, 
  domain as domainSchema 
} from "@/shared/infrastructure/database/schemas";
import { 
  orderWorkspace, 
  setupWorkspaceAdmin as setupAdminProvider, 
  addMailboxUser as addUserProvider, 
  getWorkspaceDetails,
  searchWorkspaceOrders
} from "../infrastructure/gworkspace-provider";
import type { 
  WorkspaceOrderStatus,
} from "../gworkspace-types";
import { 
  addDnsRecord,
  getDomainDetailsByName
} from "@/modules/domains/infrastructure/resellerclub-provider";

/**
 * Create a new Google Workspace order
 */
export async function createWorkspaceOrder(
  domainId: string,
  months: number = 12,
  numberOfAccounts: number = 1
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
    if (domainRecord.userId !== session.user.id) throw new Error("Unauthorized");

    const userRecord = await db.query.user.findFirst({
      where: eq(userSchema.id, session.user.id),
    });

    if (!userRecord || !userRecord.resellerclubCustomerId) {
      throw new Error("ResellerClub customer account required. Please register a domain first.");
    }

    // 2. Place order via RC Provider
    console.log(`[gworkspace] Ordering workspace for ${domainRecord.name}`);
    const orderResult = await orderWorkspace(
      domainRecord.name,
      userRecord.resellerclubCustomerId,
      months,
      numberOfAccounts
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
    console.log(`[gworkspace] Auto-configuring MX records for ${domainRecord.name}`);
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
        record.priority
      );
    }

    revalidatePath("/mailboxes/google");
    return { success: true, workspaceOrderId };
  } catch (error) {
    console.error("[gworkspace] createWorkspaceOrder error:", error);
    
    // If order already exists or limit reached, try to find and import it
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("already exists") || errorMessage.includes("Limit reached")) {
      console.log("[gworkspace] Attempting to import existing order instead...");
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

    // 1. Ensure domain exists locally
    let domainRecord = await db.query.domain.findFirst({
      where: eq(domainSchema.name, domainName),
    });

    if (!domainRecord) {
      console.log(`[gworkspace] Domain ${domainName} not found locally. Searching RC...`);
      const rcDomain = await getDomainDetailsByName(domainName);
      console.log(`[gworkspace] RC Domain search result for ${domainName}:`, rcDomain);
      
      if (!rcDomain.success || !rcDomain.details) {
        console.error(`[gworkspace] Domain lookup failed for ${domainName}:`, rcDomain.error);
        throw new Error(rcDomain.error || "Domain not found on ResellerClub");
      }

      const details = rcDomain.details as Record<string, any>;
      
      // Check if user owns it on RC (customerid check)
      const userRecord = await db.query.user.findFirst({
        where: eq(userSchema.id, session.user.id),
      });
      
      if (!userRecord || !userRecord.resellerclubCustomerId) {
        throw new Error("ResellerClub customer account required.");
      }

      const rcCustomerId = details.customerid?.toString();
      if (rcCustomerId !== userRecord.resellerclubCustomerId) {
        console.warn(`[gworkspace] Ownership mismatch for ${domainName}. Owner: ${rcCustomerId}, Current: ${userRecord.resellerclubCustomerId}`);
        throw new Error("You do not own this domain on ResellerClub.");
      }

      // Import domain locally
      const domainId = crypto.randomUUID();
      const rcOrderId = details.orderid?.toString();
      
      if (!rcOrderId) throw new Error("Missing RC Order ID from domain details");

      await db.insert(domainSchema).values({
        id: domainId,
        userId: session.user.id,
        name: domainName,
        orderId: rcOrderId,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      domainRecord = await db.query.domain.findFirst({
        where: eq(domainSchema.id, domainId),
      });
    }

    if (!domainRecord) throw new Error("Failed to secure domain record");

    // 2. Import Workspace Order
    console.log(`[gworkspace] Deep importing workspace for ${domainName}...`);
    const importRes = await importWorkspaceOrder(domainRecord.id);
    console.log(`[gworkspace] Deep import result for ${domainName}:`, importRes);
    return importRes;
  } catch (error: unknown) {
    console.error(`[gworkspace] deepImportWorkspace error for ${domainName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Import an existing Google Workspace order from ResellerClub
 */
export async function importWorkspaceOrder(domainId: string) {
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

    // 1. Search for existing orders for this domain
    const searchResult = await searchWorkspaceOrders({
      domainName: domainRecord.name,
      customerId: userRecord.resellerclubCustomerId,
    });

    if (!searchResult.success || !searchResult.orders || searchResult.orders.length === 0) {
      throw new Error("No existing order found on ResellerClub to import");
    }

    // 2. Take the first (most recent) order found
    // RC API returns { [id]: { ... } } or [{ ... }]
    const rcOrder = searchResult.orders[0] as Record<string, any>;
    const rcOrderId = rcOrder.orderid || Object.keys(rcOrder)[0];
    
    if (!rcOrderId) throw new Error("Could not determine RC Order ID");

    // Check if we already have it locally
    const existingLocal = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.rcOrderId, rcOrderId.toString()),
    });

    if (existingLocal) {
      return { success: true, workspaceOrderId: existingLocal.id };
    }

    // 3. Save to local DB
    const workspaceOrderId = crypto.randomUUID();
    const status = ((rcOrder.status as string) || "active").toLowerCase();
    const numberOfAccounts = parseInt((rcOrder.no_of_accounts as string) || "1");
    const months = parseInt((rcOrder.months as string) || "12");
    const adminEmail = (rcOrder.admin_email as string) || null;

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
  alternateEmail: string
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

    if (!order || order.userId !== session.user.id) throw new Error("Workspace order not found");

    // 2. Call provider to setup admin
    const setupResult = await setupAdminProvider({
      workspaceOrderId: order.id,
      rcOrderId: order.rcOrderId,
      emailPrefix: emailPrefix,
      firstName,
      lastName,
      alternateEmail,
      customerName: session.user.name,
      company: session.user.name || "Default Company",
      zip: "00000",
    });

    if (!setupResult.success) {
      throw new Error(setupResult.error || "Failed to setup admin account");
    }

    // 3. Update order in DB
    const adminEmail = `${emailPrefix}@${order.domainName}`;
    await db.update(googleWorkspaceOrder)
      .set({ 
        status: "admin_configured", 
        adminEmail,
        updatedAt: new Date() 
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
  lastName: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) throw new Error("Unauthorized");

    const order = await db.query.googleWorkspaceOrder.findFirst({
      where: eq(googleWorkspaceOrder.id, workspaceOrderId),
    });

    if (!order || order.userId !== session.user.id) throw new Error("Workspace order not found");

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
      }
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
      throw new Error(detailsResult.error || "Failed to sync from ResellerClub");
    }

    const rcStatus = detailsResult.details.status.toLowerCase() as WorkspaceOrderStatus;
    
    // Update local status if changed
    await db.update(googleWorkspaceOrder)
      .set({ 
        status: rcStatus,
        updatedAt: new Date() 
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
          }
        }
      }
    });

    if (!mailbox || (mailbox as any).order.userId !== session.user.id) {
      throw new Error("Mailbox not found");
    }

    return { 
      success: true, 
      credentials: {
        email: mailbox.email,
        password: mailbox.password || "N/A",
        updatedAt: mailbox.passwordUpdatedAt
      } 
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
      }
    });

    if (!order || order.userId !== session.user.id) {
      throw new Error("Order not found");
    }

    const credentials = order.mailboxes.map(m => ({
      email: m.email,
      username: m.username,
      password: m.password || "N/A",
      role: m.role
    }));

    return { success: true, credentials };
  } catch (error) {
    console.error("[gworkspace] getAllOrderCredentials error:", error);
    return { success: false, error: "Failed to fetch all credentials" };
  }
}
