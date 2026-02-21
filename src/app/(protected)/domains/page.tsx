import { DomainSearchContainer } from "@/modules/domains/components/domain-search-container";

export const metadata = {
  title: "Domain Registry | Infraboxes",
  description:
    "Search and register global top-level domains with automated infrastructure sync.",
};

export default function DomainsPage() {
  return <DomainSearchContainer />;
}
