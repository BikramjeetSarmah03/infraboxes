import type { Metadata } from "next";
import { DomainCheckoutWizard } from "@/modules/domains/components/domain-checkout-wizard";

export const metadata: Metadata = {
  title: "Domain Registration | InfraBoxes",
  description:
    "Search and register custom domains for your infrastructure via our 3-step secure process.",
};

export default function DomainsPage() {
  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-16">
      <main className="container mx-auto px-4 max-w-300">
        <div className="flex flex-col space-y-12">
          <DomainCheckoutWizard />
        </div>
      </main>
    </div>
  );
}
