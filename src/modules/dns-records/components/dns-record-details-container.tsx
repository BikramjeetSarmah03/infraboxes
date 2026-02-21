"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Globe,
  Plus,
  RotateCcw,
  Settings,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DnsRecordDetailsContainerProps {
  domainId: string;
}

export function DnsRecordDetailsContainer({
  domainId,
}: DnsRecordDetailsContainerProps) {
  const domainName = domainId.replace(/-/g, ".");
  const [showAddForm, setShowAddForm] = useState(true);

  return (
    <div className="flex flex-col flex-1 w-full bg-white dark:bg-black">
      {/* Sticky Module Header - Connected Look */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="px-6 md:px-12 h-20 flex items-center justify-between max-w-[1500px] mx-auto w-full">
          <div className="flex items-center gap-5">
            <Link href="/dns-records">
              <button
                type="button"
                className="size-11 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
              >
                <ArrowLeft className="size-5" />
              </button>
            </Link>
            <div className="size-11 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-none">
              <Globe className="size-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                {domainName}
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                DNS Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="h-9 gap-2 rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest px-4 shadow-none"
            >
              <ShieldAlert className="size-3.5 text-amber-500" />
              Inactive
            </Badge>
            <button
              type="button"
              className="h-10 px-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <RotateCcw className="size-3.5" /> Refresh
            </button>
            <Button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="h-10 px-6 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-widest shadow-none"
            >
              <Plus className="size-3.5 mr-2" /> Add Record
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 md:px-12 py-12 max-w-[1500px] mx-auto w-full space-y-10 flex-1">
        {/* Status Warning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-start gap-4"
        >
          <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0 border border-amber-200 dark:border-amber-800 shadow-none">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">
              Action Required: Activation Pending
            </h4>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-500/70 font-bold uppercase tracking-widest leading-relaxed">
              DNS management is currently idle. System will automatically
              provision infrastructure upon your first record interaction.
            </p>
          </div>
        </motion.div>

        {/* Add Record Section */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-6">
                  <div className="flex items-center gap-2">
                    <Plus className="size-4 text-zinc-900 dark:text-zinc-100" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                      Configure New Record
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    Discard
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <label
                      htmlFor="record-type"
                      className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1"
                    >
                      Record Type
                    </label>
                    <div className="relative">
                      <select
                        id="record-type"
                        className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-[11px] font-black uppercase tracking-widest px-4 appearance-none focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                      >
                        <option value="A">A Record</option>
                        <option value="AAAA">AAAA Record</option>
                        <option value="MX">MX Record</option>
                        <option value="CNAME">CNAME</option>
                        <option value="TXT">TXT Record</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label
                      htmlFor="record-name"
                      className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1"
                    >
                      Name / Host
                    </label>
                    <Input
                      id="record-name"
                      placeholder="@ or subdomain"
                      className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-bold shadow-none"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label
                      htmlFor="record-value"
                      className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1"
                    >
                      Value / Target
                    </label>
                    <Input
                      id="record-value"
                      placeholder="IP Address or Target"
                      className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-bold shadow-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="record-ttl"
                      className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1"
                    >
                      TTL (Seconds)
                    </label>
                    <Input
                      id="record-ttl"
                      placeholder="3600"
                      className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-bold shadow-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  <Button
                    type="button"
                    className="h-12 px-10 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02]"
                  >
                    Provision Record
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Records Table Mockup */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-none">
          <div className="px-8 h-16 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <Settings className="size-4 text-zinc-400" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                Active Zone Records
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                Zone ID:{" "}
              </span>
              <span className="text-[9px] font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest monospaced">
                RC-124498714
              </span>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {/* Empty State */}
            <div className="p-32 flex flex-col items-center justify-center text-center space-y-6">
              <div className="size-20 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 shadow-none">
                <Globe className="size-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">
                  Zone is currently empty
                </h4>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  No active DNS records found for this domain
                </p>
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowAddForm(true)}
                className="rounded-lg h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-none"
              >
                Initialize First Record
              </Button>
            </div>
          </div>
        </div>

        {/* Help Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-black text-xs">
              ?
            </div>
            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-tight">
              Need help with propagation times? Check our{" "}
              <button
                type="button"
                className="underline underline-offset-4 text-zinc-900 dark:text-zinc-100"
              >
                DNS Infrastructure Guide
              </button>
            </p>
          </div>
          <div className="flex items-center gap-4 opacity-50 grayscale">
            <div className="h-4 w-12 bg-zinc-400 rounded" />
            <div className="h-4 w-16 bg-zinc-400 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
