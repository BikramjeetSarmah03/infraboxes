"use server";

import { db } from "@/shared/infrastructure/database/db-client";
import { domain } from "@/shared/infrastructure/database/schemas";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { headers } from "next/headers";
import { eq, desc, count } from "drizzle-orm";

export async function getDashboardStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // 1. Get Domain Stats
    const domainStats = await db
      .select({ count: count() })
      .from(domain)
      .where(eq(domain.userId, userId));

    const totalDomains = domainStats[0]?.count || 0;

    // 2. Get Recent Domains
    const recentDomains = await db.query.domain.findMany({
      where: eq(domain.userId, userId),
      orderBy: [desc(domain.createdAt)],
      limit: 5,
    });

    // 3. Mailbox Placeholder (expand later when mailbox module is ready)
    const totalMailboxes = 0;
    const activeMailboxes = 0;
    const recentMailboxes: any[] = [];

    return {
      success: true,
      stats: {
        totalDomains,
        totalMailboxes,
        activeMailboxes,
      },
      recentDomains,
      recentMailboxes,
    };
  } catch (error) {
    console.error("[dashboard-actions] getDashboardStats error:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}
