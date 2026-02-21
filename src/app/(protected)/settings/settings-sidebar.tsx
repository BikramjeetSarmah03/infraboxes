"use client";

import { cn } from "@/lib/utils";
import { User, Building2, CreditCard, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsNav = [
  {
    title: "Profile",
    href: "/settings",
    icon: User,
    description: "Personal information and account security",
  },
  {
    title: "Company Details",
    href: "/settings/company",
    icon: Building2,
    description: "Business name, tax ID and address",
  },
  {
    title: "Subscriptions",
    href: "/settings/billing",
    icon: CreditCard,
    description: "Manage your plan and billing history",
  },
  {
    title: "Advance",
    href: "/settings/advanced",
    icon: Settings2,
    description: "Danger zone and advanced configurations",
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/10 h-full lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] shrink-0">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Settings
        </h2>
        <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-widest">
          Platform Configuration
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {settingsNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border",
                isActive
                  ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  : "bg-transparent border-transparent hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors shrink-0",
                  isActive
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300",
                )}
              >
                <item.icon className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={cn(
                    "font-semibold text-sm truncate transition-colors",
                    isActive
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-400 font-medium",
                  )}
                >
                  {item.title}
                </span>
                <span className="text-[10px] text-zinc-500 truncate leading-tight">
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
            Support Center
          </h4>
          <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed font-medium">
            Active 24/7 for our enterprise infrastructure customers.
          </p>
        </div>
      </div>
    </aside>
  );
}
