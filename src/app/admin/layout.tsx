import { auth } from "@/modules/auth/infrastructure/auth-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/modules/admin/components/admin-sidebar";
import { Bell, Search } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AdminSidebar userEmail={session.user.email} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b bg-white dark:bg-slate-900 z-30">
          <div className="flex items-center flex-1 max-w-md relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="System search..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Admin Console
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Superuser
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
