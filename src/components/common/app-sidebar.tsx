"use client";

import {
  Globe,
  LayoutDashboard,
  Mail,
  Mailbox,
  Network,
  Package,
  Settings2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NavUser } from "./nav-user";
import { getDashboardStats } from "@/modules/dashboard/actions/dashboard-actions";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Domains",
    url: "/domains",
    icon: Globe,
  },
  {
    title: "DNS Records",
    url: "/dns-records",
    icon: Network,
  },
  {
    title: "All Mailboxes",
    url: "/mailboxes/all",
    icon: Mailbox,
  },
  {
    title: "Private Mailboxes",
    url: "/mailboxes/private",
    icon: Package,
  },
  {
    title: "Google Mailboxes",
    url: "/mailboxes/google",
    icon: Mail,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [stats, setStats] = useState({ totalDomains: 0, totalMailboxes: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await getDashboardStats();
        if (res.success && res.stats) {
          setStats({
            totalDomains: res.stats.totalDomains,
            totalMailboxes: res.stats.totalMailboxes,
          });
        }
      } catch (error) {
        console.error("Failed to fetch sidebar stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border py-0 group-data-[collapsible=icon]:py-3">
        <SidebarMenu className="py-0">
          <SidebarMenuItem className="py-0">
            <SidebarMenuButton
              asChild
              className="h-14 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center! "
            >
              <Link href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
                  <Mail className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold text-base">InfraBoxes</span>
                  <span className="text-xs text-muted-foreground">
                    Admin Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-3 mt-4 px-2 group-data-[collapsible=icon]:-ml-3">
            {navItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={cn(
                      "text-base py-6 gap-4 [&>svg]:size-5 transition-colors duration-200 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:mx-auto! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center",
                      isActive
                        ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    )}
                  >
                    <Link href={item.url}>
                      <item.icon className="shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border py-2 gap-2">
        {/* Expanded View */}
        <div className="mx-2 flex group-data-[collapsible=icon]:hidden items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900 mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center w-full py-1">
              <Loader2 className="size-3 animate-spin text-zinc-400" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  Domains
                </span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">
                  {stats.totalDomains} Active
                </span>
              </div>
              <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-2"></div>
              <div className="flex flex-col gap-0.5 items-end text-right">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  Mailboxes
                </span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight">
                  {stats.totalMailboxes} Active
                </span>
              </div>
            </>
          )}
        </div>

        {/* Collapsed View */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center justify-center gap-4 mt-2 py-2">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-zinc-400" />
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-50 leading-none">
                      {stats.totalDomains}
                    </span>
                    <Globe className="size-4 text-zinc-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-[10px] uppercase font-bold tracking-tight">{stats.totalDomains} Active Domains</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-50 leading-none">
                      {stats.totalMailboxes}
                    </span>
                    <Mailbox className="size-4 text-zinc-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-[10px] uppercase font-bold tracking-tight">{stats.totalMailboxes} Active Mailboxes</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
