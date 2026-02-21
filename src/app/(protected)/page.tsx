import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Globe,
  Mail,
  MailOpen,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/modules/auth/infrastructure/auth-server";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  if (!session.user.isAccountSetuped) {
    redirect("/onboarding");
  }

  return (
    <div className="w-full h-full flex-1 relative overflow-hidden bg-zinc-50/50 dark:bg-black">
      {/* Subtle Background Glow Desktop */}
      <div className="absolute top-0 inset-x-0 h-125 w-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-blue-100/50 via-zinc-50/0 to-transparent dark:from-indigo-900/10 dark:via-black/0 dark:to-transparent pointer-events-none -z-10" />

      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {session.user.name?.split(" ")[0] || "Admin"} 👋
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Here is an overview of your infrastructure today.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KPI 1 */}
          <div
            className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-5 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] flex items-center justify-between hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all group cursor-default animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Total Domains
              </span>
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                5
              </span>
            </div>
            <div className="size-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Globe className="size-5 text-white" />
            </div>
          </div>

          {/* KPI 2 */}
          <div
            className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-5 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] flex items-center justify-between hover:shadow-[0_8px_30px_-12px_rgba(168,85,247,0.15)] hover:-translate-y-1 transition-all group cursor-default animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Total Mailboxes
              </span>
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                0
              </span>
            </div>
            <div className="size-12 rounded-2xl bg-linear-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
              <Mail className="size-5 text-white" />
            </div>
          </div>

          {/* KPI 3 */}
          <div
            className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-emerald-100/60 dark:border-emerald-900/30 rounded-3xl p-5 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] flex items-center justify-between hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition-all group cursor-default animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Active Mailboxes
              </span>
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                0
              </span>
            </div>
            <div className="size-12 rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <CheckCircle2 className="size-5 text-white" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "400ms" }}
        >
          <h2 className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase flex items-center gap-2">
            Quick Actions{" "}
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1 ml-2" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative overflow-hidden bg-linear-to-br from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-300 border-none rounded-[1.5rem] p-6 shadow-xl shadow-zinc-900/10 group hover:-translate-y-1 transition-all duration-500 cursor-pointer">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-all duration-500 group-hover:scale-125 transform origin-top-right">
                <Globe className="size-24 text-white dark:text-black" />
              </div>
              <ArrowUpRight className="absolute top-6 right-6 size-5 text-zinc-400 group-hover:text-white dark:group-hover:text-black transition-colors z-10" />

              <div className="relative z-10 space-y-1.5 mb-5 mt-1">
                <h3 className="text-xl font-bold text-white dark:text-black">
                  Register a Domain
                </h3>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs">
                  Search and purchase your perfect domain name quickly and
                  securely.
                </p>
              </div>
              <Button className="relative z-10 bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 text-sm h-10 px-6 rounded-lg font-semibold transition-transform active:scale-95 shadow-md">
                Get Started{" "}
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <div className="relative bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[1.5rem] p-6 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] group hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 cursor-pointer hover:border-zinc-300/80 dark:hover:border-zinc-700/80">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.02] group-hover:opacity-10 transition-all duration-500 group-hover:scale-125 transform origin-top-right">
                <Mail className="size-24 text-zinc-900 dark:text-white" />
              </div>
              <ArrowUpRight className="absolute top-6 right-6 size-5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50 transition-colors z-10" />

              <div className="relative z-10 space-y-1.5 mb-5 mt-1">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  Create Mailbox
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                  Set up professional email mailboxes for your verified domains.
                </p>
              </div>
              <Button
                variant="outline"
                className="relative z-10 border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm h-10 px-6 rounded-lg font-semibold transition-all active:scale-95 group-hover:border-zinc-300 dark:group-hover:border-zinc-700"
              >
                Create Mailbox{" "}
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Modules */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "500ms" }}
        >
          {/* Recent Mailboxes */}
          <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[1.5rem] flex flex-col shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">
                Recent Mailboxes
              </h3>
              <Link
                href="/mailboxes"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center py-10 gap-2 text-zinc-400 dark:text-zinc-600">
              <MailOpen className="size-8 stroke-[1.5]" />
              <p className="text-xs font-medium">No mailboxes yet</p>
            </div>
          </div>

          {/* Your Domains */}
          <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-[1.5rem] flex flex-col shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-4 border-b border-zinc-100/50 dark:border-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">
                Your Domains
              </h3>
              <Link
                href="/domains"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="flex flex-col">
              {[
                { name: "miraallc.com", status: "active" },
                { name: "miraalabs.org", status: "active" },
                { name: "miraalabs.net", status: "dns_pending" },
                { name: "miraalabs.com", status: "dns_pending" },
                { name: "miraalabs.info", status: "dns_pending" },
              ].map((domain, i, arr) => (
                <div
                  key={domain.name}
                  className={`flex items-center justify-between p-3.5 px-5 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 transition-all duration-300 cursor-pointer group ${i !== arr.length - 1 ? "border-b border-zinc-100/50 dark:border-zinc-900/50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-all duration-300 shadow-sm border border-zinc-200/40 dark:border-zinc-800/40">
                      <Globe className="size-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                        {domain.name}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      domain.status === "active" ? "default" : "secondary"
                    }
                    className={
                      domain.status === "active"
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/20 shadow-none font-medium text-[10px] px-1.5 py-0 leading-none h-5 rounded hover:scale-105 transition-transform uppercase"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 shadow-none font-medium text-[10px] px-1.5 py-0 leading-none h-5 rounded hover:scale-105 transition-transform uppercase"
                    }
                  >
                    {domain.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
