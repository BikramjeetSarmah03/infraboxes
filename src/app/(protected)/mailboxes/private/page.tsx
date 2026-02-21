"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Database,
  Globe,
  Lock,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivateMailboxesPage() {
  const progress = 5;
  const total = 10;
  const percentage = (progress / total) * 100;

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-10">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Mailbox Infrastructure
        </h1>
        <p className="text-zinc-500 font-medium">
          Scale your email operations with dedicated private server resources.
        </p>
      </motion.div>

      {/* Main Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative overflow-hidden bg-zinc-950 dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-3xl group"
      >
        {/* Animated Background Glow */}
        <div className="absolute -top-24 -right-24 size-96 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 size-96 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />

        <div className="relative z-10 p-8 md:p-14 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="size-20 rounded-[1.75rem] bg-linear-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center shadow-2xl"
            >
              <Server className="size-10 text-white" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white tracking-tight">
                Dedicated Private Server
              </h2>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-zinc-400 font-semibold tracking-wide text-sm uppercase">
                  Available for Pro Clusters
                </p>
              </div>
            </div>
          </div>

          <p className="max-w-3xl text-zinc-400 text-lg leading-relaxed font-medium">
            Private mailboxes run on your own dedicated server using Aerosend's
            high-performance infrastructure. This architecture provides{" "}
            <span className="text-white">perfect isolation</span>, superior
            deliverability, and absolute privacy for your high-volume email
            operations.
          </p>
        </div>
      </motion.div>

      {/* Progress & Setup Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-12 space-y-10 shadow-sm relative overflow-hidden"
      >
        <div className="space-y-6">
          <div className="flex items-end justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Domain Requirements
              </h3>
              <p className="text-sm text-zinc-500">
                Reach the threshold to initialize your server
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tabular-nums">
                {progress}
              </span>
              <span className="text-sm font-bold text-zinc-400 ml-2">
                / {total}
              </span>
            </div>
          </div>

          <div className="relative h-4 w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-1 border border-zinc-200/50 dark:border-zinc-800/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="relative h-full bg-linear-to-r from-indigo-500 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-end px-1 overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite] -translate-x-full"
                style={{ width: "200%" }}
              />
              <div className="size-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
            </motion.div>
          </div>
        </div>

        {/* Dynamic Status Box */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/40 dark:border-amber-900/20 rounded-[2rem] p-6 flex items-center gap-6"
        >
          <div className="size-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
            <Lock className="size-6 outline-none" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-amber-900 dark:text-amber-400">
              Upgrade Required
            </h4>
            <p className="text-sm text-amber-700/80 dark:text-amber-500/70 font-medium leading-relaxed">
              Connect{" "}
              <span className="font-bold text-amber-900 dark:text-amber-300">
                5 more domains
              </span>{" "}
              to automatically deploy your dedicated cluster.
            </p>
          </div>
        </motion.div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Mailboxes",
              value: "3 per Domain",
              icon: Zap,
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              label: "Infrastructure",
              value: "Dedicated",
              icon: Database,
              color: "text-indigo-500",
              bg: "bg-indigo-50 dark:bg-indigo-900/20",
            },
            {
              label: "Privacy",
              value: "Full Isolation",
              icon: ShieldCheck,
              color: "text-emerald-500",
              bg: "bg-emerald-50 dark:bg-emerald-900/20",
            },
          ].map((feat, i) => (
            <motion.div
              key={i.toString()}
              whileHover={{ y: -5 }}
              className="p-6 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-4"
            >
              <div
                className={`size-10 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center`}
              >
                <feat.icon className="size-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {feat.value}
                </p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  {feat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="w-full h-16 rounded-[1.5rem] bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-lg transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 group">
            <Globe className="size-6 group-hover:rotate-180 transition-transform duration-700" />
            <span>Scale My Infrastructure</span>
            <ArrowRight className="size-6 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Footer Info */}
      <div className="flex items-center justify-center gap-3 text-sm text-zinc-400 font-medium">
        <Activity className="size-4" />
        <span>
          Deployment usually takes less than 15 minutes after unlocking.
        </span>
      </div>
    </div>
  );
}
