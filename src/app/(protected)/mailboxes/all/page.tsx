import { db } from "@/shared/infrastructure/database/db-client";
import { googleWorkspaceMailbox, googleWorkspaceOrder } from "@/shared/infrastructure/database/schemas";
import { count, eq } from "drizzle-orm";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { headers } from "next/headers";
import { AllMailboxesClientView } from "@/modules/google-workspace/components/all-mailboxes-client-view";

export const dynamic = "force-dynamic";

export default async function AllMailboxesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) return null;

  // 1. Fetch Google Workspace stats
  const workspaceOrders = await db.query.googleWorkspaceOrder.findMany({
    where: eq(googleWorkspaceOrder.userId, session.user.id),
    with: {
        mailboxes: true,
    }
  });

  const googleMailboxCount = workspaceOrders.reduce((acc, order) => acc + order.mailboxes.length, 0);
  const activeGoogleMailboxes = workspaceOrders.reduce((acc, order) => {
    return acc + order.mailboxes.filter(m => m.status === "active").length;
  }, 0);

  // For now, Private SMTP is 0 as it's not implemented yet
  const privateSmtpCount = 0;

  const stats = [
    {
      label: "Total Mailboxes",
      value: (googleMailboxCount + privateSmtpCount).toString(),
      type: "total",
    },
    {
      label: "Active",
      value: activeGoogleMailboxes.toString(),
      type: "active",
    },
    {
      label: "Google Workspace",
      value: googleMailboxCount.toString(),
      type: "google",
    },
    {
      label: "Private SMTP",
      value: privateSmtpCount.toString(),
      type: "private",
    },
  ];

  // Flatten all mailboxes for the list
  const allMailboxes = workspaceOrders.flatMap(order => 
    order.mailboxes.map(m => ({
        ...m,
        domainName: order.domainName,
        provider: "google" as const
    }))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <AllMailboxesClientView stats={stats} mailboxes={allMailboxes} />
    </div>
  );
}
