"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { db } from "@/shared/infrastructure/database/db-client";
import { user } from "@/shared/infrastructure/database/schemas/auth-schema";
import { company } from "@/shared/infrastructure/database/schemas/company-schema";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  companyName: z.string().optional(),
  companyCategory: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;

export async function updateProfile(data: ProfileData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = profileSchema.parse(data);

    // Remove undefined values to only update provided fields
    const bodyToUpdate: Record<string, any> = {};
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        bodyToUpdate[key] = value;
      }
    });

    if (Object.keys(bodyToUpdate).length === 0) {
      return { success: true };
    }

    // Update user in the database using better-auth's server API
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        ...bodyToUpdate,
        isAccountSetuped: true,
      } as any, // Cast to any to allow updating custom fields defined in additionalFields
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("Failed to update profile", err);
    if (err instanceof z.ZodError) {
      const zodError = err as z.ZodError;
      if (zodError.issues.length > 0) {
        return { success: false, error: zodError.issues[0].message };
      }
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function clearPersonalInformation() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Delete company profile entirely
    await db.delete(company).where(eq(company.userId, session.user.id));

    // Clear user fields natively supported by auth table
    await db
      .update(user)
      .set({
        companyName: null,
        companyCategory: null,
        phoneNumber: null,
        address: null,
        city: null,
        state: null,
        country: null,
        zip: null,
      })
      .where(eq(user.id, session.user.id));

    revalidatePath("/settings");
    revalidatePath("/settings/company");
    revalidatePath("/settings/advanced");
    return { success: true };
  } catch (error: any) {
    console.error("clearPersonalInformation error:", error);
    return { success: false, error: "Failed to clear personal information." };
  }
}

export async function scheduleAccountDeletion() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const deletionDate = new Date();
    // Schedule exactly 30 days from now
    deletionDate.setDate(deletionDate.getDate() + 30);

    await db
      .update(user)
      .set({
        scheduledForDeletion: true,
        deletionScheduledAt: deletionDate,
      })
      .where(eq(user.id, session.user.id));

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/settings/advanced");
    return { success: true };
  } catch (error: any) {
    console.error("scheduleAccountDeletion error:", error);
    return { success: false, error: "Failed to schedule account deletion." };
  }
}
