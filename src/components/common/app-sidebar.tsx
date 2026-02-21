"use client";

import {
  Globe,
  LayoutDashboard,
  Mail,
  Mailbox,
  Network,
  Package,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
              Domains
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              5 Active
            </span>
          </div>
          <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-2"></div>
          <div className="flex flex-col gap-0.5 items-end text-right">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
              Mailboxes
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              0 Active
            </span>
          </div>
        </div>

        {/* Collapsed View */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center justify-center gap-4 mt-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 cursor-pointer">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 leading-none">
                  5
                </span>
                <Globe className="size-4 text-zinc-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>5 Active Domains</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1 cursor-pointer">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 leading-none">
                  0
                </span>
                <Mailbox className="size-4 text-zinc-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>0 Active Mailboxes</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
