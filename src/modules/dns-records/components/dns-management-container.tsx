"use client";

import { motion } from "framer-motion";
import { ArrowRight, Filter, Globe, Network, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// No longer using hardcoded domains

export function DnsManagementContainer({ initialDomains }: { initialDomains: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDomains = initialDomains.filter((domain) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col flex-1 w-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-6 md:px-12 h-20 flex items-center justify-between max-w-[1500px] mx-auto w-full">
          <div className="flex items-center gap-5">
            <div className="size-11 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
              <Network className="size-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                DNS Management
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                Domain Name System Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
              <Input
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 w-64 bg-zinc-100 dark:bg-zinc-900 border-transparent focus:border-zinc-200 dark:focus:border-zinc-800 rounded-lg text-xs font-bold shadow-none"
              />
            </div>
            <button
              type="button"
              className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all"
            >
              <Filter className="size-4 text-zinc-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 md:px-12 py-12 max-w-[1500px] mx-auto w-full space-y-8 flex-1">
        <div className="grid grid-cols-1 gap-4">
          {filteredDomains.map((domain, i) => (
            <motion.div
              key={domain.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/dns-records/${domain.id}`}
                className="group flex items-center justify-between p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  <div className="size-14 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-all duration-500 shadow-none">
                    <Globe className="size-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {domain.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md shadow-none border",
                          domain.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                            : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
                        )}
                      >
                        {domain.status}
                      </Badge>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          domain.isDnsActivated
                            ? "text-zinc-400"
                            : "text-zinc-500",
                        )}
                      >
                        {domain.isDnsActivated
                          ? "DNS activated"
                          : "DNS not activated"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      ResellerClub Engine
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2 px-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Configure Records
                    </span>
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {initialDomains.length === 0 ? (
            <div className="py-24 text-center space-y-8 bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <div className="size-20 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Globe className="size-10" />
              </div>
              <div className="space-y-6 max-w-sm mx-auto px-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                    No Domains Found
                  </h3>
                  <p className="text-sm font-bold text-zinc-500 leading-relaxed">
                    You haven't registered any domains yet. Purchase your first domain to start managing DNS.
                  </p>
                </div>
                <Link
                  href="/domains"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10 dark:shadow-zinc-50/10 group"
                >
                  <Plus className="size-4" />
                  <span>Buy First Domain</span>
                  <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-300">
                <Search className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  No matching domains
                </p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">
                  Try adjusting your search filters
                </p>
              </div>
            </div>
          ) : null}


        </div>
      </div>
    </div>
  );
}
