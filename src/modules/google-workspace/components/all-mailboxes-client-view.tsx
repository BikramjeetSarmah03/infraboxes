"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Globe,
  Mail,
  Mailbox,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface AllMailboxesClientViewProps {
  stats: { label: string; value: string; type: string }[];
  mailboxes: any[];
}

export function AllMailboxesClientView({ stats, mailboxes }: AllMailboxesClientViewProps) {
  const statConfig: Record<string, any> = {
    total: {
      icon: Mail,
      color: "text-zinc-500",
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-100 dark:border-zinc-800",
    },
    active: {
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-100 dark:border-zinc-800",
    },
    google: {
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-100 dark:border-zinc-800",
    },
    private: {
      icon: Mailbox,
      color: "text-purple-500",
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-100 dark:border-zinc-800",
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const config = statConfig[stat.type] || statConfig.total;
          const Icon = config.icon;
          return (
            <motion.div
              key={i.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 bg-white dark:bg-zinc-950 border ${config.border} rounded-2xl flex items-center gap-4 group transition-all duration-300 hover:border-zinc-200 dark:hover:border-zinc-700`}
            >
              <div className={`size-12 rounded-full ${config.bg} ${config.color} flex items-center justify-center shrink-0 border border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-800 transition-all duration-500`}>
                <Icon className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-none">
                  {stat.value}
                </p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Mailboxes Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Your Mailboxes
          </h2>
          <Link href="/mailboxes/google">
            <Button variant="ghost" className="h-9 rounded-lg font-bold text-[10px] uppercase tracking-widest gap-2">
              <PlusCircle className="size-3.5" />
              Add Mailbox
            </Button>
          </Link>
        </div>

        {mailboxes.length === 0 ? (
          /* Empty State */
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="size-20 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
              <Mail className="size-10 text-zinc-300 dark:text-zinc-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                No mailboxes yet
              </h3>
              <p className="text-sm text-zinc-500 font-medium tracking-tight">
                Setup Google Workspace or Private SMTP to get started
              </p>
            </div>
            <Link href="/mailboxes/google">
              <Button className="h-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-widest px-6 shadow-xl transition-all duration-300">
                <PlusCircle className="size-4 mr-2" />
                Add First Mailbox
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                    <TableRow>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Domain</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Provider</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mailboxes.map((mailbox) => (
                        <TableRow key={mailbox.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20">
                            <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">{mailbox.email}</TableCell>
                            <TableCell className="text-sm text-zinc-500 font-medium">{mailbox.domainName}</TableCell>
                            <TableCell>
                                <Badge className="bg-blue-50 text-blue-600 border-none font-bold text-[9px] uppercase tracking-tighter gap-1">
                                    <Globe className="size-3" />
                                    Google
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px]">
                                    {mailbox.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          </div>
        )}
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4 group"
      >
        <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-500 shrink-0">
          <ShieldCheck className="size-5" />
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-400 tracking-tight">
            About DNS Security Records
          </h4>
          <p className="text-xs leading-relaxed font-semibold text-blue-800/70 dark:text-blue-400/60 max-w-4xl">
            <span className="text-blue-900 dark:text-blue-300 font-black">SPF</span>,
            <span className="text-blue-900 dark:text-blue-300 font-black ml-1">DKIM</span>, and
            <span className="text-blue-900 dark:text-blue-300 font-black ml-1">DMARC</span> are critical for deliverability.
            Our Google Workspace orchestration automatically configures these for you upon provisioning.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
