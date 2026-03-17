import { GoogleDashboardView } from "@/modules/google-workspace/components/google-dashboard-view";
import { getUserWorkspaceOrders } from "@/modules/google-workspace/actions/gworkspace-actions";
import { getUserDomains } from "@/modules/domains/actions/domain-actions";

export const dynamic = "force-dynamic";

export default async function GoogleMailboxesPage() {
  const [ordersResult, domainsResult] = await Promise.all([
    getUserWorkspaceOrders(),
    getUserDomains(),
  ]);

  const orders = ordersResult.success ? ordersResult.orders || [] : [];
  const domains = domainsResult.success ? domainsResult.domains || [] : [];

  // Filter only active domains for the wizard
  const activeDomains = domains
    .filter((d: any) => d.status === "active")
    .map((d: any) => ({
      id: d.id,
      name: d.name,
      status: d.status,
    }));

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto">
      <GoogleDashboardView 
        orders={orders as any} 
        domains={activeDomains} 
      />
    </div>
  );
}
