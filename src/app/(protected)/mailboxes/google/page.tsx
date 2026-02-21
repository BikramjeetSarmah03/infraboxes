"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ExternalLink,
  Key,
  Mail,
  MessageSquare,
  RefreshCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function GoogleMailboxesPage() {
  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50 shadow-none font-bold text-[10px] uppercase tracking-widest h-6">
            G-Suite Integration
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Google Mailboxes
          </h1>
          <p className="text-zinc-500 font-medium text-lg leading-relaxed">
            Sync your existing Google Workspace accounts for centralized
            outbound management.
          </p>
        </div>

        {/* Animated Brand Pulse */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse rounded-full" />
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative size-24 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-center overflow-hidden group"
          >
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Simple representation of Google colors via dots */}
            <div className="grid grid-cols-2 gap-2">
              <div className="size-4 rounded-full bg-red-500" />
              <div className="size-4 rounded-full bg-blue-500" />
              <div className="size-4 rounded-full bg-yellow-500" />
              <div className="size-4 rounded-full bg-green-500" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hero Connection Card */}
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
                  Connect Workspace Account
                </h2>
                <p className="text-zinc-500 leading-relaxed font-medium">
                  Effortlessly authorize your Google Workspace domains using
                  OAuth 2.0. Aerosend will handle API syncing, token refreshing,
                  and deliverability monitoring automatically.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: ShieldCheck,
                    text: "Official Google OAuth 2.0 certified app",
                  },
                  {
                    icon: RefreshCcw,
                    text: "Bi-directional syncing every 15 minutes",
                  },
                  {
                    icon: MessageSquare,
                    text: "Automated deliverability warming",
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
                <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all duration-300 shadow-lg shadow-blue-500/20 gap-3 group">
                  Authorize G-Suite
                  <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-8 rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold bg-transparent text-zinc-600 dark:text-zinc-400 gap-2"
                >
                  <ExternalLink className="size-5" /> View Docs
                </Button>
              </div>
            </div>

            <div className="md:w-72 lg:w-80 space-y-4">
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Active Connections
                  </p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                    12 Accounts
                  </p>
                </div>
                <div className="h-px bg-zinc-200/50 dark:bg-zinc-800" />
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Pricing Plan
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                      Google Add-on
                    </span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px]">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">
                    $5.00 / account / mo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Team Management",
            desc: "Easily distribute mailboxes among your team members.",
            icon: Users,
          },
          {
            title: "Auto-Refresh",
            desc: "Persistent API tokens ensure your service never sleeps.",
            icon: Key,
          },
          {
            title: "Smart Throttling",
            desc: "Respect G-Suite daily limits with our AI engine.",
            icon: Mail,
          },
        ].map((feat, i) => (
          <motion.div
            key={i.toString()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 + 0.4 }}
            className="p-8 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm space-y-4 hover:shadow-xl transition-all duration-500"
          >
            <div className="size-12 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950">
              <feat.icon className="size-6" />
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {feat.title}
            </h4>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              {feat.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
