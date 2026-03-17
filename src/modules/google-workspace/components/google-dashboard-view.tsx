"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GoogleWorkspaceOrder,
  GoogleWorkspaceMailbox,
} from "../gworkspace-types";
import { WorkspaceOrderCard } from "./workspace-order-card";
import { GoogleWorkspaceWizard } from "./google-workspace-wizard";

interface GoogleDashboardViewProps {
  orders: (GoogleWorkspaceOrder & { mailboxes: GoogleWorkspaceMailbox[] })[];
  domains: { id: string; name: string; status: string }[];
}

export function GoogleDashboardView({
  orders,
  domains,
}: GoogleDashboardViewProps) {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowWizard(false)}
            className="size-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Setup New Workspace
            </h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Google Workspace Provisioning
            </p>
          </div>
        </div>
        <GoogleWorkspaceWizard domains={domains} />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50 shadow-none font-bold text-[10px] uppercase tracking-widest h-6">
            G-Suite Management
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Google Mailboxes
          </h1>
          <p className="text-zinc-500 font-medium text-lg leading-relaxed">
            Manage your Google Workspace accounts and provision new mailboxes.
          </p>
        </div>

        <Button
          onClick={() => setShowWizard(true)}
          className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all duration-300 shadow-xl shadow-blue-500/20 gap-3 group"
        >
          <Plus className="size-5" />
          Setup New Workspace
        </Button>
      </div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-1 rounded-[2.5rem] bg-linear-to-br from-blue-500/20 via-zinc-200/50 to-indigo-500/20 dark:from-blue-900/40 dark:via-zinc-900/40 dark:to-indigo-900/40 shadow-2xl"
        >
          <div className="bg-white dark:bg-zinc-950 rounded-[2.25rem] p-8 md:p-14 space-y-10">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="flex-1 space-y-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    Start Provisioning Google Workspace
                  </h2>
                  <p className="text-zinc-500 leading-relaxed font-medium">
                    Automatically setup Google Workspace for your domains. We
                    handle the ordering, admin configuration, and DNS record
                    management through ResellerClub.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      icon: ShieldCheck,
                      text: "Automated ResellerClub GApps provisioning",
                    },
                    {
                      icon: RefreshCcw,
                      text: "Instant admin account setup & management",
                    },
                    {
                      icon: Mail,
                      text: "Auto-configured MX records for your domains",
                    },
                  ].map((item, i) => (
                    <div
                      key={i.toString()}
                      className="flex items-center gap-3 text-sm font-bold text-zinc-600 dark:text-zinc-400"
                    >
                      <div className="size-6 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <item.icon className="size-3.5 text-zinc-400" />
                      </div>
                      {item.text}
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    onClick={() => setShowWizard(true)}
                    className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all duration-300 shadow-lg shadow-blue-500/20 gap-3 group"
                  >
                    Get Started Now
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>

              <div className="md:w-72 lg:w-80 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-center space-y-4">
                <div className="size-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-2">
                  <ShieldCheck className="size-10" />
                </div>
                <h4 className="font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest text-[10px]">
                  Certified Setup
                </h4>
                <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                  Official API Integration with ResellerClub Infrastructure
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">
            Active Workspace Orders
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <WorkspaceOrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
