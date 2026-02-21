import { Building2, Pencil, Calendar, MapPin, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CompanySettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-zinc-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
              Business Profile
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold px-3 border-zinc-200 dark:border-zinc-800"
          >
            <Pencil className="size-3 mr-1.5" /> Edit
          </Button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Legal Name
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              TESL LABS PRIVATE LIMITED
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Tax ID / PAN
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              ABCDE1234F
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Incorporation Date
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              <Calendar className="size-4 text-zinc-400" />
              January 12, 2024
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Company Status
            </p>
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 shadow-none font-bold text-[10px] uppercase">
              verified
            </Badge>
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Registered Address
            </p>
            <div className="flex items-start gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              <MapPin className="size-4 text-zinc-400 mt-0.5" />
              <span>
                Plot No 45, Tech Park, Okhla Phase III, New Delhi, India -
                110020
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
          <Fingerprint className="size-4 text-zinc-500" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
            Identity & Verification
          </h3>
        </div>
        <div className="p-8 flex flex-col items-center text-center max-w-sm mx-auto space-y-4">
          <div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <ShieldCheck className="size-8 text-zinc-400" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-50">
              KYC Verified
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              Your company identity has been successfully verified. You now have
              higher transaction limits.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-bold border-zinc-200 dark:border-zinc-800"
          >
            View Certificate
          </Button>
        </div>
      </section>
    </div>
  );
}

import { ShieldCheck } from "lucide-react";
