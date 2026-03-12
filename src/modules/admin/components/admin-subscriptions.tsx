"use client";

import {
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";

const subscriptions = [
  {
    id: "#SUB-001",
    user: "John Doe",
    plan: "Pro Monthly",
    amount: "$29.00",
    status: "Active",
    date: "2024-03-01",
  },
  {
    id: "#SUB-002",
    user: "Jane Smith",
    plan: "Enterprise",
    amount: "$499.00",
    status: "Active",
    date: "2024-02-28",
  },
  {
    id: "#SUB-003",
    user: "Bob Wilson",
    plan: "Basic",
    amount: "$9.00",
    status: "Cancelled",
    date: "2024-02-15",
  },
];

export function AdminSubscriptions() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Subscriptions
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage customer plans and billing status
          </p>
        </div>
        <button
          onClick={() => toast.info("New subscription flow coming soon")}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          <span className="text-sm font-semibold">New Subscription</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Filter by ID or user..."
              className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subscriptions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                    {sub.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {sub.user}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {sub.plan}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                    {sub.amount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        sub.status === "Active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() =>
                        toast.info("Subscription details feature coming soon")
                      }
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
