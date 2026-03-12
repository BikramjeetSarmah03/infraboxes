"use client";

import {
  Users,
  CreditCard,
  Globe,
  LifeBuoy,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const chartData = [
  { name: "Mon", users: 400, revenue: 2400 },
  { name: "Tue", users: 600, revenue: 3500 },
  { name: "Wed", users: 500, revenue: 2800 },
  { name: "Thu", users: 800, revenue: 4200 },
  { name: "Fri", users: 700, revenue: 3800 },
  { name: "Sat", users: 900, revenue: 4800 },
  { name: "Sun", users: 1100, revenue: 5600 },
];

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up",
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/10",
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/10",
  },
  {
    title: "Domains Active",
    value: "12,234",
    change: "+19%",
    trend: "up",
    icon: Globe,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/10",
  },
  {
    title: "Support Tickets",
    value: "573",
    change: "-4%",
    trend: "down",
    icon: LifeBuoy,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/10",
  },
];

export function AdminDashboard() {
  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome back. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div
                className={`flex items-center space-x-1 text-xs font-bold ${stat.trend === "up" ? "text-emerald-600" : "text-red-600"}`}
              >
                <span>{stat.change}</span>
                {stat.trend === "up" ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.title}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Revenue Growth
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Weekly revenue trends and projections
              </p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide={true} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Live Activity
          </h2>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 flex-none ring-4 ring-white dark:ring-slate-900">
                  <TrendingUp size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    Domain purchase:{" "}
                    {
                      ["infy.com", "box.io", "cloud.net", "data.sh", "app.dev"][
                        i - 1
                      ]
                    }
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                    {i * 2} minutes ago
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Full Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
