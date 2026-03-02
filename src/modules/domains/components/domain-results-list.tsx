"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { purchaseDomain } from "../actions/domain-actions";
import type { DomainAvailability } from "../domain-types";

interface DomainResultsListProps {
  domains: DomainAvailability[];
  isLoading: boolean;
  selectedDomains?: string[];
  onSelect?: (domain: DomainAvailability) => void;
}

export function DomainResultsList({
  domains,
  isLoading,
  selectedDomains = [],
  onSelect,
}: DomainResultsListProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleSelect = (domain: DomainAvailability) => {
    if (selectedDomains.includes(domain.domain)) return;

    setIsProcessing(domain.domain);
    if (onSelect) {
      onSelect(domain);
    }
    // Brief processing state for visual feedback
    setTimeout(() => {
      setIsProcessing(null);
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-muted/50 h-24 rounded-xl border border-border"
          />
        ))}
      </div>
    );
  }

  if (domains.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      {domains.map((domain, index) => (
        <motion.div
          key={domain.domain}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 p-6 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 truncate max-w-[200px] sm:max-w-xs">
                  {domain.domain}
                </h3>
                {domain.isPremium && (
                  <Badge
                    variant="secondary"
                    className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-black text-[9px] uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 rounded-md"
                  >
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <StatusIcon status={domain.status} />
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    domain.status === "available"
                      ? "text-emerald-500"
                      : domain.status === "taken"
                        ? "text-zinc-400"
                        : "text-zinc-500"
                  }`}
                >
                  {domain.status === "available"
                    ? "Available"
                    : domain.status === "taken"
                      ? "Unavailable"
                      : "Unknown"}
                </span>
              </div>
            </div>

            {domain.status === "available" && (
              <div className="text-right">
                <div className="flex items-baseline justify-end space-x-0.5">
                  <span className="text-xs font-black text-zinc-400">$</span>
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter">
                    {domain.pricing?.register || "0.00"}
                  </span>
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-400 font-black">
                  /year
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-6">
            <div className="space-y-1">
              {domain.status === "available" && domain.pricing?.renew && (
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-md">
                  Renewal: ${domain.pricing.renew}/yr
                </div>
              )}
            </div>

            <Button
              disabled={
                domain.status !== "available" || isProcessing === domain.domain
              }
              size="sm"
              onClick={() => handleSelect(domain)}
              className={cn(
                "h-10 px-6 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-none",
                domain.status === "available"
                  ? selectedDomains.includes(domain.domain)
                    ? "bg-emerald-500 text-white cursor-default"
                    : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed",
              )}
            >
              {isProcessing === domain.domain ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {selectedDomains.includes(domain.domain) ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selected
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {domain.status === "available"
                        ? "Select Domain"
                        : "Not Available"}
                    </>
                  )}
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: DomainAvailability["status"] }) {
  switch (status) {
    case "available":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "taken":
      return <XCircle className="w-4 h-4 text-red-400" />;
    default:
      return <HelpCircle className="w-4 h-4 text-gray-400" />;
  }
}
