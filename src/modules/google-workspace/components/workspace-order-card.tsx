"use client";

import { useState } from "react";
import type {
  GoogleWorkspaceOrder,
  GoogleWorkspaceMailbox,
} from "../gworkspace-types";
import { MailboxList } from "./mailbox-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Mail,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Settings,
  Download,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { 
  syncWorkspaceOrderDetails, 
  getAllOrderCredentials,
  addWorkspaceLicensesAction
} from "../actions/gworkspace-actions";
import { toast } from "sonner";
import { AddLicensesDialog } from "./add-licenses-dialog";

import { cn } from "@/lib/utils";

interface WorkspaceOrderCardProps {
  order: GoogleWorkspaceOrder & { mailboxes: GoogleWorkspaceMailbox[] };
  onConfigureAdmin?: (order: GoogleWorkspaceOrder & { mailboxes: GoogleWorkspaceMailbox[] }) => void;
  onAddMailbox?: (order: GoogleWorkspaceOrder & { mailboxes: GoogleWorkspaceMailbox[] }) => void;
}

export function WorkspaceOrderCard({ order, onConfigureAdmin, onAddMailbox }: WorkspaceOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddingLicenses, setIsAddingLicenses] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncWorkspaceOrderDetails(order.id);
      if (result.success) {
        toast.success("Sync complete");
      } else {
        toast.error(result.error || "Sync failed");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    const result = await getAllOrderCredentials(order.id);
    if (!result.success || !result.credentials) {
      toast.error(result.error || "Failed to fetch credentials for export");
      return;
    }

    const content = result.credentials
      .map(c => `Email: ${c.email}\nPassword: ${c.password}\nRole: ${c.role}\n-------------------`)
      .join("\n\n");
    
    const blob = new Blob([`Google Workspace Credentials - ${order.domainName}\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credentials-${order.domainName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Credentials exported successfully");
  };

  const statusColors: Record<string, string> = {
    active:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50",
    admin_configured:
      "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50",
    pending:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50",
    suspended:
      "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-200/50 dark:border-red-900/50",
  };

  return (
    <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="p-0">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Globe className="size-6" />
            </div>
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <CardTitle className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight break-all leading-tight">
                  {order.domainName}
                </CardTitle>
                <Badge
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all",
                    statusColors[order.status] || "bg-zinc-100 text-zinc-600"
                  )}
                  variant="outline"
                >
                  {order.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Order ID:{" "}
                  <span className="text-blue-500/80">
                    {order.rcOrderId}
                  </span>
                </p>
                <div className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1">
                  <Globe className="size-3" />
                  Workspace
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center min-w-24 shadow-inner">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                Accounts
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-zinc-900 dark:text-zinc-50 leading-none">
                  {order.mailboxes.length}
                </span>
                <span className="text-xs font-bold text-zinc-400">/ {order.numberOfAccounts}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-xl text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all duration-300"
                onClick={handleExport}
                title="Export All Credentials"
              >
                <Download className="size-4.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-xl text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-300"
                onClick={handleSync}
                disabled={isSyncing}
                title="Sync from Provider"
              >
                <RefreshCcw
                  className={`size-4.5 ${isSyncing ? "animate-spin" : ""}`}
                />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-xl text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-300"
                onClick={() => setIsAddingLicenses(true)}
                title="Buy More Seats"
              >
                <Plus className="size-4.5" />
              </Button>
            </div>

            <Button
              variant="outline"
              className={cn(
                "h-12 px-5 rounded-2xl border-zinc-200 dark:border-zinc-800 transition-all duration-300 font-black text-[10px] uppercase tracking-[0.15em] gap-3 group",
                isExpanded 
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 border-transparent shadow-xl shadow-zinc-500/20" 
                  : "bg-white text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-500 shadow-sm"
              )}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Users className={cn("size-4 transition-transform group-hover:scale-110", isExpanded ? "text-blue-400" : "")} />
              {isExpanded ? "Hide Settings" : "Manage Mailboxes"}
              {isExpanded ? (
                <ChevronUp className="size-4 opacity-50" />
              ) : (
                <ChevronDown className="size-4 opacity-50" />
              )}
            </Button>

            {!order.adminEmail && onConfigureAdmin && (
              <Button
                className="h-12 px-6 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30 transition-all duration-500 hover:scale-105"
                onClick={() => onConfigureAdmin(order)}
              >
                Configure Business
              </Button>
            )}
          </div>
        </div>

        {/* Info Bar */}
        <div className="px-6 py-3 bg-zinc-50/50 dark:bg-zinc-900/30 border-y border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Calendar className="size-3.5" />
              Created: {format(new Date(order.createdAt), "MMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Mail className="size-3.5" />
              Admin:{" "}
              <span className="text-zinc-900 dark:text-zinc-300">
                {order.adminEmail || "Not setup"}
              </span>
            </div>
          </div>

          <Button
            variant="link"
            className="h-auto p-0 text-blue-500 font-bold text-xs gap-1"
          >
            <Settings className="size-3" />
            Workspace Settings
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-6 bg-zinc-50/20 dark:bg-zinc-950/20 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">
                Account List
              </h3>
              {order.mailboxes.length < order.numberOfAccounts && (
                <Button 
                  onClick={() => onAddMailbox?.(order)}
                  className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-blue-500/20"
                >
                  + Add User
                </Button>
              )}
            </div>

            <MailboxList mailboxes={order.mailboxes} />
          </div>
        </CardContent>
      )}

      <AddLicensesDialog 
        isOpen={isAddingLicenses}
        onClose={() => setIsAddingLicenses(false)}
        workspaceOrderId={order.id}
        domainName={order.domainName}
      />
    </Card>
  );
}
