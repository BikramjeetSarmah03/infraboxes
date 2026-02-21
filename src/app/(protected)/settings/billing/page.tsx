import { ArrowRight, Check, CreditCard, History, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BillingSettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Current Plan Card */}
      <section className="relative overflow-hidden bg-zinc-900 border-none rounded-[2rem] p-8 shadow-xl shadow-zinc-900/10 group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
          <Rocket className="size-48 text-white" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Badge className="bg-white/10 text-white border-white/20 uppercase font-bold text-[10px] tracking-widest">
                CURRENT PLAN
              </Badge>
              <h2 className="text-3xl font-bold text-white">Starter Free</h2>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">$0</p>
              <p className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                forever free
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-3">
              {[
                "Up to 5 custom domains",
                "Basic DNS management",
                "3 private mailboxes",
                "Email community support",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-zinc-300 font-medium"
                >
                  <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="size-3 text-emerald-400 font-bold" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Button className="bg-white text-zinc-900 hover:bg-zinc-100 font-bold rounded-xl h-12 px-6 shadow-lg shadow-white/5 group/btn">
            Upgrade to Pro{" "}
            <ArrowRight className="ml-2 size-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Payment Method */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
          <CreditCard className="size-4 text-zinc-500" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
            Payment Method
          </h3>
        </div>
        <div className="p-8 flex flex-col items-center text-center max-w-sm mx-auto space-y-4">
          <div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <CreditCard className="size-8 text-zinc-400 font-light" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              No payment method added
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              You are currently on the free plan and don't need a payment method
              added yet.
            </p>
          </div>
          <Button
            variant="outline"
            className="font-bold border-zinc-200 dark:border-zinc-800 h-10 px-6 rounded-xl"
          >
            Add Payment Method
          </Button>
        </div>
      </section>

      {/* Billing History */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
          <History className="size-4 text-zinc-500" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
            Billing History
          </h3>
        </div>
        <div className="flex flex-col">
          <div className="p-12 flex flex-col items-center text-center text-zinc-400 dark:text-zinc-600 space-y-2">
            <History className="size-8 stroke-[1.5]" />
            <p className="text-xs font-bold uppercase tracking-widest">
              No invoices yet
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
