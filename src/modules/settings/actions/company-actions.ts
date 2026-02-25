"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { db } from "@/shared/infrastructure/database/db-client";
import { company } from "@/shared/infrastructure/database/schemas/company-schema";

const companyProfileSchema = z.object({
  legalName: z.string().min(2, "Legal name is required"),
  taxId: z.string().optional(),
  incorporationDate: z.date().optional().or(z.string().optional()),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
});

export type CompanyProfileData = z.infer<typeof companyProfileSchema>;

export async function upsertCompanyProfile(data: CompanyProfileData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = companyProfileSchema.parse(data);
    const userId = session.user.id;

    // Check if company already exists
    const existingCompany = await db.query.company.findFirst({
      where: eq(company.userId, userId),
    });

    // Handle date conversion if string
    let incDate: Date | undefined;
    if (validatedData.incorporationDate) {
      incDate = new Date(validatedData.incorporationDate);
    }

    if (existingCompany) {
      // Update existing
      await db
        .update(company)
        .set({
          legalName: validatedData.legalName,
          taxId: validatedData.taxId,
          incorporationDate: incDate,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          country: validatedData.country,
          zip: validatedData.zip,
          updatedAt: new Date(),
        })
        .where(eq(company.userId, userId));
    } else {
      // Insert new
      // Generate unique ID
      const newCompanyId = crypto.randomUUID();
      await db.insert(company).values({
        id: newCompanyId,
        userId: userId,
        legalName: validatedData.legalName,
        taxId: validatedData.taxId,
        incorporationDate: incDate,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        zip: validatedData.zip,
      });
    }

    revalidatePath("/settings");
    revalidatePath("/settings/company");
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to update company profile", err);
    if (err instanceof z.ZodError) {
      const zodError = err as z.ZodError;
      if (zodError.issues && zodError.issues.length > 0) {
        return { success: false, error: zodError.issues[0].message };
      }
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}
