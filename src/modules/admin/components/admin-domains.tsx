"use client";

import {
  Globe,
  ExternalLink,
  Calendar,
  Search,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const domains = [
  {
    id: 1,
    name: "example.com",
    user: "John Doe",
    expiry: "2025-03-24",
    status: "Active",
  },
  {
    id: 2,
    name: "infybox.net",
    user: "Sarah Smith",
    expiry: "2024-06-12",
    status: "Expiring",
  },
  {
    id: 3,
    name: "repyar.com",
    user: "John Carter",
    expiry: "2026-01-05",
    status: "Active",
  },
];

export function AdminDomains() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Domain Purchases
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Monitor and manage all domain registrations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                <Globe size={24} />
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  domain.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {domain.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              {domain.name}
              <ExternalLink size={16} className="text-slate-400" />
            </h3>
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Customer
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {domain.user}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Expiry Date
                </span>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                  <Calendar size={16} />
                  <span>{domain.expiry}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => toast.info("Viewing domain settings...")}
              className="w-full mt-6 py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all group"
            >
              Manage Domain
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
