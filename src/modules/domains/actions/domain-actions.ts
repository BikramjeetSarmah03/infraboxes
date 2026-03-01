"use server";

import {
  getDomainSuggestions,
  checkDomainAvailability,
} from "../infrastructure/resellerclub-provider";
import type { DomainAvailability } from "../domain-types";

/**
 * Search for domains based on keyword
 * 1. Get suggestions locally
 * 2. Rapidly check availability in chunks
 * 3. Return combined results
 */
export async function searchDomains(
  keyword: string,
  tld: string = "com",
  page: number = 0,
) {
  try {
    console.log(
      `[actions] Searching domains for: "${keyword}" (tld: ${tld}, page: ${page})`,
    );

    // 1. Get suggestions
    const suggestions = await getDomainSuggestions(keyword, tld, page);
    if (!suggestions || suggestions.length === 0) {
      return { success: true, domains: [] };
    }

    // 2. Extract domain names for availability check
    const domainNames = suggestions.map((s) => s.domain);

    // Get customer ID from session if exists
    const { headers } = await import("next/headers");
    const { auth } = await import("@/modules/auth/infrastructure/auth-server");
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    let customerId: string | undefined;
    if (session?.user?.id) {
      const { db } = await import("@/shared/infrastructure/database/db-client");
      const { user } = await import("@/shared/infrastructure/database/schemas");
      const { eq } = await import("drizzle-orm");

      const userRecord = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
      });

      customerId = userRecord?.resellerclubCustomerId || undefined;
    }

    // 3. Check availability
    const availabilityResults = await checkDomainAvailability(
      domainNames,
      customerId,
    );

    return {
      success: true,
      domains: availabilityResults,
    };
  } catch (error) {
    console.error("[actions] searchDomains error:", error);
    return {
      success: false,
      error: "Failed to search for domains. Please try again.",
    };
  }
}

/**
 * Simulate domain purchase flow
 */
export async function purchaseDomain(domainName: string) {
  try {
    console.log(`[actions] Reserving domain: ${domainName}`);

    // Simulation delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const { headers } = await import("next/headers");
    const { auth } = await import("@/modules/auth/infrastructure/auth-server");
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const orderId = `sim_${Math.random().toString(36).substring(7)}`;

    const { db } = await import("@/shared/infrastructure/database/db-client");
    const { domain } = await import("@/shared/infrastructure/database/schemas");

    // Save to our DB
    await db.insert(domain).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: domainName,
      orderId: orderId,
      status: "active",
      isDnsActivated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: `Domain ${domainName} has been reserved successfully!`,
      orderId: orderId,
    };
  } catch (error) {
    console.error("[actions] purchaseDomain error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Registration failed. Please contact support.",
    };
  }
}

/**
 * Get all domains owned by the current user
 */
export async function getUserDomains() {
  try {
    const { headers } = await import("next/headers");
    const { auth } = await import("@/modules/auth/infrastructure/auth-server");
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const { db } = await import("@/shared/infrastructure/database/db-client");
    const { domain } = await import("@/shared/infrastructure/database/schemas");
    const { eq, desc } = await import("drizzle-orm");

    const userDomains = await db.query.domain.findMany({
      where: eq(domain.userId, session.user.id),
      orderBy: [desc(domain.createdAt)],
    });

    return {
      success: true,
      domains: userDomains,
    };
  } catch (error) {
    console.error("[actions] getUserDomains error:", error);
    return {
      success: false,
      error: "Failed to fetch domains",
    };
  }
}
