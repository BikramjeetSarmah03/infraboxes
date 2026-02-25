"use client";

import { Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AccountInfoSectionProps {
  email: string;
  userId: string;
  createdAt: Date;
  status?: "active" | "inactive" | "suspended";
  planType?: string;
}

export function AccountInfoSection({
  email,
  userId,
  createdAt,
  status = "active",
  planType = "starter",
}: AccountInfoSectionProps) {
  return (
    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
        <User className="size-4 text-zinc-500" />
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
          Account Information
        </h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
            Email Address
          </p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {email}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
            Account ID
          </p>
          <p className="text-xs font-mono text-zinc-500 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-2 py-1 rounded w-fit">
            {userId}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
            Member Since
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            <Calendar className="size-4 text-zinc-400" />
            {new Date(createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
            Account Status
          </p>
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 shadow-none font-bold text-[10px] uppercase h-5">
            {status}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
            Plan Type
          </p>
          <Badge
            variant="secondary"
            className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 shadow-none font-bold text-[10px] uppercase h-5"
          >
            {planType}
          </Badge>
        </div>
      </div>
    </section>
  );
}
