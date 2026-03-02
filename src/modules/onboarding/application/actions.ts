"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { createResellerClubCustomer } from "@/modules/domains/infrastructure/resellerclub-provider";
import { db } from "@/shared/infrastructure/database/db-client";
import * as schema from "@/shared/infrastructure/database/schemas";

export async function submitOnboarding(data: {
  name?: string;
  phoneNumber?: string;
  companyName: string;
  companyCategory: string;
  address: string;
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
  zip: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // 1. Create ResellerClub Customer
  let resellerclubCustomerId: string | null = null;

  if (data.phoneNumber) {
    // Simple phone parsing for ResellerClub (expects cc and number separately)
    // Most phones from InputPhone come as +<cc><number>
    const phoneFull = data.phoneNumber.replace("+", "");
    let phoneCC = "1"; // Default
    let phoneNumber = phoneFull;

    // Common CC lengths (1-3 digits)
    // We can be smarter but this is a start.
    // Usually +91, +1, +44, etc.
    if (phoneFull.startsWith("91")) {
      phoneCC = "91";
      phoneNumber = phoneFull.slice(2);
    } else if (phoneFull.startsWith("1")) {
      phoneCC = "1";
      phoneNumber = phoneFull.slice(1);
    } else if (phoneFull.length > 10) {
      // Guess CC is the prefix before last 10 digits
      phoneCC = phoneFull.slice(0, phoneFull.length - 10);
      phoneNumber = phoneFull.slice(phoneFull.length - 10);
    }

    const rcResult = await createResellerClubCustomer({
      username: session.user.email,
      name: data.name || session.user.name || "Customer",
      company: data.companyName,
      addressLine1: data.address,
      city: data.city,
      state: data.state, // RC signup often accepts full state name
      country: data.countryCode, // RC requires 2-char country code
      zipcode: data.zip,
      phoneCountryCode: phoneCC,
      phone: phoneNumber,
    });

    if (rcResult.success) {
      resellerclubCustomerId = rcResult.customerId;
    } else {
      console.error("[onboarding] RC Client Creation Failed:", rcResult.error);
      // We might want to throw or just log. User says: "create a reseller hub customer account so that we can get price etc"
      // So we should probably try our best.
    }
  }

  // 2. Update local database
  await db
    .update(schema.user)
    .set({
      isAccountSetuped: true,
      ...(data.name ? { name: data.name } : {}),
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
      companyName: data.companyName,
      companyCategory: data.companyCategory,
      address: data.address,
      country: data.country,
      state: data.state,
      city: data.city,
      zip: data.zip,
      resellerclubCustomerId: resellerclubCustomerId,
    })
    .where(eq(schema.user.id, session.user.id));

  return { success: true };
}
