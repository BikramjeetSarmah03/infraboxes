import { DnsManagementContainer } from "@/modules/dns-records/components/dns-management-container";
import { getUserDomains } from "@/modules/domains/actions/domain-actions";

export const metadata = {
  title: "DNS Management | InfraBoxes",
  description: "Manage your domain DNS records with professional tools.",
};

export default async function DNSManagementPage() {
  const result = await getUserDomains();
  const initialDomains = result.success ? result.domains || [] : [];

  return <DnsManagementContainer initialDomains={initialDomains} />;
}

