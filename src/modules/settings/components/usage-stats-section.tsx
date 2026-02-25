"use client";

import { Globe, Mailbox, ShieldCheck } from "lucide-react";

interface UsageStatsSectionProps {
  // Since we haven't built mailbox and domains API fully yet,
  // we can pass these as props or fetch locally later.
  totalDomains?: number;
  totalMailboxes?: number;
}

export function UsageStatsSection({
  totalDomains = 0,
  totalMailboxes = 0,
}: UsageStatsSectionProps) {
  return (
    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
        <ShieldCheck className="size-4 text-zinc-500" />
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
          Usage Statistics
        </h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
          <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <Globe className="size-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-none">
              {totalDomains}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
              Total Domains
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
          <div className="size-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <Mailbox className="size-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-none">
              {totalMailboxes}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
              Total Mailboxes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
