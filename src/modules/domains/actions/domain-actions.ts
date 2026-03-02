"use server";

import type { DomainAvailability } from "../domain-types";
import {
  checkDomainAvailability,
  getDomainSuggestions,
  createResellerClubCustomer,
  createResellerClubContact,
  registerDomain,
} from "../infrastructure/resellerclub-provider";

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
 * Real domain purchase flow via ResellerClub
 */
export async function purchaseDomain(domainName: string, billingData: any) {
  try {
    console.log(`[actions] Purchasing domain: ${domainName}`);

    const { headers } = await import("next/headers");
    const { auth } = await import("@/modules/auth/infrastructure/auth-server");
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const { db } = await import("@/shared/infrastructure/database/db-client");
    const { user, domain } =
      await import("@/shared/infrastructure/database/schemas");
    const { eq } = await import("drizzle-orm");

    // 1. Get user details from DB to ensure we have email/phone
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!userRecord) throw new Error("User record not found");

    // 2. Prepare ResellerClub Customer Data
    // We use session info + billing info from form
    const rcCustomerData = {
      username: userRecord.email,
      name: billingData.name || userRecord.name,
      company: userRecord.companyName || billingData.name || userRecord.name,
      addressLine1: billingData.address,
      city: billingData.city,
      state: billingData.state,
      country: billingData.countryCode, // RC needs ISO country code
      zipcode: billingData.zipcode,
      phoneCountryCode:
        userRecord.phoneNumber?.split("-")[0]?.replace("+", "") || "1",
      phone:
        userRecord.phoneNumber?.split("-")[1] ||
        userRecord.phoneNumber?.replace(/[^0-9]/g, "") ||
        "0000000000",
      langPref: "en",
    };

    let customerId = userRecord.resellerclubCustomerId;

    // 3. Create RC Customer if not exists
    if (!customerId) {
      const signupResult = await createResellerClubCustomer(rcCustomerData);
      if (!signupResult.success || !signupResult.customerId) {
        throw new Error(
          `Failed to create reseller account: ${signupResult.error}`,
        );
      }
      customerId = signupResult.customerId;

      // Update our local user record
      await db
        .update(user)
        .set({ resellerclubCustomerId: customerId })
        .where(eq(user.id, session.user.id));
    }

    // 4. Create Contact for this specific registration
    const contactResult = await createResellerClubContact(
      customerId,
      rcCustomerData,
    );
    if (!contactResult.success || !contactResult.contactId) {
      throw new Error(
        `Failed to create domain contact: ${contactResult.error}`,
      );
    }
    const contactId = contactResult.contactId;

    // 5. Actually register the domain
    const regResult = await registerDomain(
      domainName,
      customerId,
      contactId,
      1,
    );

    if (!regResult.success || !regResult.orderId) {
      throw new Error(regResult.error || "Registration failed at ResellerClub");
    }

    // 6. Save successful registration to our database
    await db.insert(domain).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: domainName,
      orderId: regResult.orderId,
      status: "active",
      isDnsActivated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: `Domain ${domainName} has been registered successfully!`,
      orderId: regResult.orderId,
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
