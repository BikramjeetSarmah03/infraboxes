import { DnsManagementContainer } from "@/modules/dns-records/components/dns-management-container";

export const metadata = {
  title: "DNS Management | InfraBoxes",
  description: "Manage your domain DNS records with professional tools.",
};

export default function DNSManagementPage() {
  return <DnsManagementContainer />;
}
