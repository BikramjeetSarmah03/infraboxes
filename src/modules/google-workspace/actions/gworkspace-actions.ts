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
  getWorkspaceDetails 
} from "../infrastructure/gworkspace-provider";
import { addDnsRecord } from "@/modules/domains/infrastructure/resellerclub-provider";

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

    const rcStatus = detailsResult.details.status.toLowerCase();
    
    // Update local status if changed
    await db.update(googleWorkspaceOrder)
      .set({ 
        status: rcStatus as any, // Simple mapping for now
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
