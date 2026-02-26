"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, HelpCircle, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { purchaseDomain } from "../actions/domain-actions";
import { toast } from "sonner";
import { useState } from "react";
import type { DomainAvailability } from "../domain-types";

interface DomainResultsListProps {
  domains: DomainAvailability[];
  isLoading: boolean;
}

export function DomainResultsList({ domains, isLoading }: DomainResultsListProps) {
  const [purchasingDomain, setPurchasingDomain] = useState<string | null>(null);

  const handlePurchase = async (domainName: string) => {
    setPurchasingDomain(domainName);
    try {
      const result = await purchaseDomain(domainName);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred during purchase");
    } finally {
      setPurchasingDomain(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-muted/50 h-24 rounded-xl border border-border" />
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative group bg-card hover:bg-accent/5 transition-all duration-300 p-6 rounded-2xl border border-border shadow-sm hover:shadow-md h-full flex flex-col justify-between overflow-hidden"
        >
          {/* Status Background Accent */}
          <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${
            domain.status === "available" ? "bg-green-500" : domain.status === "taken" ? "bg-red-500" : "bg-gray-500"
          }`} />

          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold tracking-tight truncate max-w-50 lg:max-w-xs xl:max-w-sm">
                  {domain.domain}
                </h3>
                {domain.isPremium && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200">
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <StatusIcon status={domain.status} />
                <span className={`text-sm font-medium ${
                  domain.status === "available" ? "text-green-600" : domain.status === "taken" ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {domain.status === "available" ? "Available" : domain.status === "taken" ? "Unavailable" : "Status Unknown"}
                </span>
              </div>
            </div>

            {domain.pricing && domain.status === "available" && (
              <div className="text-right">
                <div className="text-2xl font-black text-primary">
                  ${domain.pricing.register}
                </div>
                <div className="text-xs text-muted-foreground">/yr</div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between relative z-10">
            <div className="text-xs text-muted-foreground italic">
              {domain.pricing?.renew && `Renews at $${domain.pricing.renew}/yr`}
            </div>
            
            <Button
              disabled={domain.status !== "available" || purchasingDomain !== null}
              size="sm"
              onClick={() => handlePurchase(domain.domain)}
              className={`rounded-full px-6 transition-all ${
                domain.status === "available" 
                ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/10" 
                : "bg-muted cursor-not-allowed text-muted-foreground"
              }`}
            >
              {purchasingDomain === domain.domain ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {domain.status === "available" ? "Select" : "Taken"}
                </>
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
