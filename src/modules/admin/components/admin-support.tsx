"use client";

import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

const tickets = [
  {
    id: "#TKT-1024",
    subject: "Server connection timeout",
    user: "Michael Chen",
    priority: "High",
    status: "Open",
  },
  {
    id: "#TKT-1025",
    subject: "Domain name verification fail",
    user: "Sarah Jones",
    priority: "Medium",
    status: "In Progress",
  },
  {
    id: "#TKT-1026",
    subject: "Billing inquiry - March",
    user: "John Carter",
    priority: "Low",
    status: "Resolved",
  },
];

export function AdminSupport() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Support Center
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Handle customer inquiries and technical issues
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Total Tickets
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              1,204
            </span>
            <MessageSquare size={20} className="text-blue-500" />
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
          <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
            Open Now
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              14
            </span>
            <Clock size={20} className="text-red-500" />
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Resolved Today
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              42
            </span>
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Avg Response
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              1.5h
            </span>
            <LifeBuoy size={20} className="text-slate-400" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
          Active Support Tickets
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`p-2 rounded-lg mt-1 ${
                    ticket.status === "Open"
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : ticket.status === "In Progress"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  {ticket.status === "Open" ? (
                    <AlertCircle size={20} />
                  ) : ticket.status === "In Progress" ? (
                    <Clock size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                      {ticket.id}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                        ticket.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.priority} Priority
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {ticket.subject}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Requested by {ticket.user}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toast.info("Opening ticket details...")}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
              >
                Respond
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
