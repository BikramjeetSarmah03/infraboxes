import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MainSidebarLayout } from "@/components/common/main-sidebar-layout";
import { auth } from "@/modules/auth/infrastructure/auth-server";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  return <MainSidebarLayout>{children}</MainSidebarLayout>;
}
