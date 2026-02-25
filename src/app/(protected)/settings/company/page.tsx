import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { CompanyProfileSection } from "@/modules/settings/components/company-profile-section";
import { db } from "@/shared/infrastructure/database/db-client";
import { company } from "@/shared/infrastructure/database/schemas/company-schema";

export default async function CompanySettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch company details
  const companyData = await db.query.company.findFirst({
    where: eq(company.userId, session.user.id),
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <CompanyProfileSection
        initialData={{
          legalName: companyData?.legalName || "",
          taxId: companyData?.taxId,
          incorporationDate: companyData?.incorporationDate,
          status: companyData?.status,
          address: companyData?.address,
          city: companyData?.city,
          state: companyData?.state,
          country: companyData?.country,
          zip: companyData?.zip,
        }}
      />
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
