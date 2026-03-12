"use client";

import {
  LayoutDashboard,
  Users,
  CreditCard,
  LifeBuoy,
  Globe,
  ChevronLeft,
  ChevronRight,
  User,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Customers",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Domains",
    href: "/admin/domains",
    icon: Globe,
  },
  {
    title: "Support",
    href: "/admin/support",
    icon: LifeBuoy,
  },
];

export function AdminSidebar({ userEmail }: { userEmail: string | undefined }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out z-40",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex-none w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            I
          </div>
          {!isCollapsed && (
            <span className="font-bold text-slate-900 dark:text-white truncate">
              InfraBoxes
            </span>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white",
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "flex-none",
                  isActive
                    ? "text-white"
                    : "group-hover:scale-110 transition-transform",
                )}
              />
              {!isCollapsed && (
                <span className="font-medium text-sm truncate">
                  {item.title}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/40" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Area */}
      <div className="p-3 border-t space-y-2">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group",
            isCollapsed && "justify-center",
          )}
          title="User View"
        >
          <LayoutGrid
            size={20}
            className="group-hover:scale-110 transition-transform"
          />
          {!isCollapsed && (
            <span className="text-sm font-medium">User View</span>
          )}
        </Link>

        <div
          className={cn(
            "flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50",
            isCollapsed ? "justify-center" : "space-x-3",
          )}
        >
          <div className="flex-none w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <User size={16} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                Admin
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {userEmail}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
