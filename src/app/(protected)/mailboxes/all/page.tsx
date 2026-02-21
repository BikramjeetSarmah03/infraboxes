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

export default function AllMailboxesPage() {
  const stats = [
    {
      label: "Total Mailboxes",
      value: "0",
      icon: Mail,
      color: "text-zinc-500",
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-100 dark:border-zinc-800",
    },
    {
      label: "Active",
      value: "0",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-100 dark:border-zinc-800",
    },
    {
      label: "Google Workspace",
      value: "0",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-100 dark:border-zinc-800",
    },
    {
      label: "Private SMTP",
      value: "0",
      icon: Mailbox,
      color: "text-purple-500",
      bg: "bg-zinc-50 dark:bg-zinc-900",
      border: "border-zinc-100 dark:border-zinc-800",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i.toString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 bg-white dark:bg-zinc-950 border ${stat.border} rounded-2xl flex items-center gap-4 group transition-all duration-300 hover:border-zinc-200 dark:hover:border-zinc-700`}
          >
            <div
              className={`size-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 border border-transparent group-hover:border-zinc-200 dark:group-hover:border-zinc-800 transition-all duration-500`}
            >
              <stat.icon className="size-5" />
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
        ))}
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
        </div>

        {/* Empty State */}
        <div className="p-20 flex flex-col items-center justify-center text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.6 }}
            className="size-20 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800"
          >
            <Mail className="size-10 text-zinc-300 dark:text-zinc-700" />
          </motion.div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              No mailboxes yet
            </h3>
            <p className="text-sm text-zinc-500 font-medium tracking-tight">
              Create your first mailbox to get started
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="h-10 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-widest px-6 shadow-xl shadow-zinc-900/10 transition-all duration-300">
              <PlusCircle className="size-4 mr-2" />
              Add First Mailbox
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* DNS Records Info Box */}
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
            <span className="text-blue-900 dark:text-blue-300 font-black">
              SPF
            </span>{" "}
            (Sender Policy Framework),
            <span className="text-blue-900 dark:text-blue-300 font-black ml-1">
              DKIM
            </span>{" "}
            (DomainKeys Identified Mail), and
            <span className="text-blue-900 dark:text-blue-300 font-black ml-1">
              DMARC
            </span>{" "}
            (Domain-based Message Authentication) are email authentication
            methods that help prevent email spoofing and improve deliverability.
          </p>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-500 cursor-pointer hover:underline transition-all">
            Click on a domain to manage its DNS records and security settings.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
