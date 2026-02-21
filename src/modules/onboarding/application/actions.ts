"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { db } from "@/shared/infrastructure/database/db-client";
import * as schema from "@/shared/infrastructure/database/schemas";

export async function submitOnboarding(data: {
  name?: string;
  phoneNumber?: string;
  companyName: string;
  companyCategory: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zip: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

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
    })
    .where(eq(schema.user.id, session.user.id));

  return { success: true };
}
