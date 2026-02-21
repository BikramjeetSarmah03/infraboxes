import { auth } from "@/modules/auth/infrastructure/auth-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  User,
  Calendar,
  ShieldCheck,
  Globe,
  Mailbox,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const { user } = session;

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Usage Statistics Section - Moved Up */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none">
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
                5
              </p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
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
                0
              </p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                Total Mailboxes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Account Information Section */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none">
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
              {user.email}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Account ID
            </p>
            <p className="text-xs font-mono text-zinc-500 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-2 py-1 rounded w-fit">
              {user.id}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Member Since
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              <Calendar className="size-4 text-zinc-400" />
              {new Date(user.createdAt).toLocaleDateString("en-US", {
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
              active
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
              starter
            </Badge>
          </div>
        </div>
      </section>

      {/* Personal DetailsSection */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="size-4 text-zinc-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
              Personal Details
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] font-bold px-3 border-zinc-200 dark:border-zinc-800 uppercase tracking-wider"
          >
            <Pencil className="size-3 mr-1.5" /> Edit
          </Button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Full Name
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {user.name}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Company
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              TESL LABS
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Phone Country Code
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              91
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Phone Number
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              9981278955
            </p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Address
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              123 Rssting
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              City
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Delhi
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              State
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Delhi
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Country
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              IN
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
              Zip Code
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              110098
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
