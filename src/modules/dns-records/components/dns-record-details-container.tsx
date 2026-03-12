"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Globe,
  Loader2,
  Plus,
  RotateCcw,
  Settings,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  getDomainInfo,
  listDnsRecords,
  addDnsRecord,
  deleteDnsRecord,
  activateDns,
} from "../actions/dns-actions";
import type { domain } from "@/shared/infrastructure/database/schemas";

type Domain = typeof domain.$inferSelect;

interface RemoteRecord {
  id?: string;
  type: string;
  host: string;
  value: string;
  ttl: string | number;
  priority?: string | number;
}

const TYPE_COLORS: Record<string, string> = {
  A: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30",
  AAAA: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/30",
  CNAME:
    "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30",
  MX: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30",
  TXT: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30",
  NS: "bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-900/20 dark:text-zinc-400 dark:border-zinc-900/30",
  SRV: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30",
};

const dnsRecordSchema = z.object({
  type: z.enum(["A", "AAAA", "MX", "CNAME", "TXT", "SRV", "NS"]),
  host: z.string().min(1, "Name is required (use @ for root)"),
  value: z.string().min(1, "Target / Value is required"),
  ttl: z.string().min(1, "TTL is required").refine((val) => Number(val) >= 7200, {
    message: "TTL must be at least 7200 (2 hours)",
  }),
  priority: z.string().optional(),
}).refine((data) => {
  if (data.type === "A") {
    const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipv4Regex.test(data.value);
  }
  if (data.type === "AAAA") {
    return data.value.includes(":"); // Simple check for IPv6
  }
  if (["CNAME", "MX", "NS", "SRV"].includes(data.type)) {
    return data.value.includes("."); // Basic check for hostname
  }
  return true;
}, {
  message: "Invalid format for selected type",
  path: ["value"],
}).refine((data) => {
  if (["MX", "SRV"].includes(data.type) && !data.priority) {
    return false;
  }
  return true;
}, {
  message: "Priority required",
  path: ["priority"],
});

type DnsFormValues = z.infer<typeof dnsRecordSchema>;

interface DnsRecordDetailsContainerProps {
  domainId: string;
}

export function DnsRecordDetailsContainer({
  domainId,
}: DnsRecordDetailsContainerProps) {
  const [domainData, setDomainData] = useState<Domain | null>(null);
  const [records, setRecords] = useState<RemoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const form = useForm<DnsFormValues>({
    resolver: zodResolver(dnsRecordSchema),
    defaultValues: {
      type: "A",
      host: "@",
      value: "",
      ttl: "7200",
      priority: "",
    },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [domainRes, recordsRes] = await Promise.all([
        getDomainInfo(domainId),
        listDnsRecords(domainId),
      ]);

      if (domainRes.success) setDomainData(domainRes.domain || null);
      if (recordsRes.success) setRecords(recordsRes.records || []);
      else toast.error(recordsRes.error || "Failed to fetch records");
    } catch {
      toast.error("An error occurred while fetching data");
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onProvisionSubmit = async (values: DnsFormValues) => {
    setIsSaving(true);
    try {
      // Auto-activate if not already active
      if (!domainData?.isDnsActivated) {
        await activateDns(domainId);
      }
      
      const res = await addDnsRecord(
        domainId,
        values.type,
        values.host,
        values.value,
        Number(values.ttl),
        values.priority ? Number(values.priority) : undefined
      );

      if (res.success) {
        toast.success("Record provisioned successfully");
        setShowAddForm(false);
        form.reset();
        fetchData();
      } else {
        toast.error(res.error || "Failed to add record");
      }
    } catch {
      toast.error("Failed to add record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (record: RemoteRecord) => {
    if (!confirm(`Are you sure you want to delete this ${record.type} record?`)) return;

    setIsSaving(true);
    try {
      const res = await deleteDnsRecord(
        domainId,
        record.id || "",
        record.type,
        record.host,
        record.value
      );

      if (res.success) {
        toast.success("Record deleted");
        fetchData();
      } else {
        toast.error(res.error || "Failed to delete record");
      }
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivateDns = async () => {
    setIsSaving(true);
    try {
      const res = await activateDns(domainId);
      if (res.success) {
        toast.success("DNS Infrastructure Activated");
        fetchData();
      } else {
        toast.error(res.error || "Activation failed");
      }
    } catch {
      toast.error("An error occurred during activation");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !domainData) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-screen bg-white dark:bg-black">
        <Loader2 className="size-10 animate-spin text-zinc-300" />
        <p className="mt-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Loading Infrastructure...</p>
      </div>
    );
  }

  const domainName = domainData?.name || domainId.replace(/-/g, ".");

  return (
    <div className="flex flex-col flex-1 w-full bg-white dark:bg-black">
      {/* Sticky Module Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="px-6 md:px-12 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-5">
            <Link href="/dns-records">
              <button
                type="button"
                className="size-11 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
              >
                <ArrowLeft className="size-5" />
              </button>
            </Link>
            <div className="size-11 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-none">
              <Globe className="size-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                {domainName}
              </h1>
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest leading-none">
                DNS Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`h-9 gap-2 rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-medium uppercase tracking-widest px-4 shadow-none ${domainData?.isDnsActivated ? "text-emerald-500" : "text-amber-500"}`}
            >
              <ShieldAlert className={`size-3.5 ${domainData?.isDnsActivated ? "text-emerald-500" : "text-amber-500"}`} />
              {domainData?.isDnsActivated ? "Active" : "Inactive"}
            </Badge>
            <button
              type="button"
              onClick={fetchData}
              disabled={isLoading}
              className="h-10 px-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-10 px-6 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium text-[10px] uppercase tracking-widest shadow-none"
            >
              <Plus className="size-3.5 mr-2" /> Add Record
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 w-full bg-zinc-50/50 dark:bg-black p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-10">
        {/* Status Warning */}
        {!domainData?.isDnsActivated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-start gap-4"
          >
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0 border border-amber-200 dark:border-amber-800 shadow-none">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">
                Infrastructure Activation Required
              </h4>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-500/70 font-bold uppercase tracking-widest leading-relaxed">
                DNS services are currently idle. Manual activation is required
                to begin managing records for this domain.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleActivateDns}
              disabled={isSaving}
              className="mt-1 h-9 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-amber-600/20 shrink-0"
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin mr-2" />
              ) : null}
              Activate Now
            </Button>
          </motion.div>
        )}

        {/* Add Record Section */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onProvisionSubmit)}
                  className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-8"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-6">
                    <div className="flex items-center gap-2">
                      <Plus className="size-4 text-zinc-900 dark:text-zinc-100" />
                      <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                        Configure New Record
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      Discard
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                            Record Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-lg w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-[11px] font-medium uppercase tracking-widest px-4 shadow-none">
                                <SelectValue placeholder="Record Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="A" className="text-[11px] font-medium uppercase tracking-widest">A Record</SelectItem>
                              <SelectItem value="AAAA" className="text-[11px] font-medium uppercase tracking-widest">AAAA Record</SelectItem>
                              <SelectItem value="MX" className="text-[11px] font-medium uppercase tracking-widest">MX Record</SelectItem>
                              <SelectItem value="CNAME" className="text-[11px] font-medium uppercase tracking-widest">CNAME</SelectItem>
                              <SelectItem value="TXT" className="text-[11px] font-medium uppercase tracking-widest">TXT Record</SelectItem>
                              <SelectItem value="SRV" className="text-[11px] font-medium uppercase tracking-widest">SRV Record</SelectItem>
                              <SelectItem value="NS" className="text-[11px] font-medium uppercase tracking-widest">NS Record</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[9px] uppercase tracking-tighter font-medium" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem className="space-y-2 lg:col-span-1">
                          <FormLabel className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                            Name / Host
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="@ or subdomain"
                              {...field}
                              className="h-9 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-medium shadow-none"
                            />
                          </FormControl>
                          <FormMessage className="text-[9px] uppercase tracking-tighter font-medium" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem className="space-y-2 lg:col-span-1">
                          <FormLabel className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                            Value / Target
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="IP Address or Target"
                              {...field}
                              className="h-9 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-medium shadow-none"
                            />
                          </FormControl>
                          <FormMessage className="text-[9px] uppercase tracking-tighter font-medium" />
                        </FormItem>
                      )}
                    />

                    {["MX", "SRV"].includes(form.watch("type")) && (
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                              Priority
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="10"
                                {...field}
                                className="h-11 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-xs font-medium shadow-none"
                              />
                            </FormControl>
                            <FormMessage className="text-[9px] uppercase tracking-tighter font-medium" />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="ttl"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                            TTL (Time to Live)
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 w-full rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-[11px] font-medium uppercase tracking-widest px-4 shadow-none">
                                <SelectValue placeholder="TTL" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="7200" className="text-[11px] font-medium uppercase tracking-widest">2 Hours</SelectItem>
                              <SelectItem value="14400" className="text-[11px] font-medium uppercase tracking-widest">4 Hours</SelectItem>
                              <SelectItem value="43200" className="text-[11px] font-medium uppercase tracking-widest">12 Hours</SelectItem>
                              <SelectItem value="86400" className="text-[11px] font-medium uppercase tracking-widest">1 Day</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[9px] uppercase tracking-tighter font-medium" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="h-12 px-10 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : null}
                      Provision Record
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Records Table */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-none">
          <div className="px-8 h-16 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <Settings className="size-4 text-zinc-400" />
              <h3 className="text-[11px] font-medium uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                Active Zone Records
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest">
                Zone ID:{" "}
              </span>
              <span className="text-[9px] font-medium text-zinc-900 dark:text-zinc-50 uppercase tracking-widest monospaced">
                RC-{domainData?.orderId || "PENDING"}
              </span>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-8 py-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Type</th>
                      <th className="px-8 py-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Host</th>
                      <th className="px-8 py-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Value</th>
                      <th className="px-8 py-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400">TTL</th>
                      <th className="px-8 py-4 text-[10px] font-medium uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {records.map((record) => (
                      <tr
                        key={record.id || `${record.type}-${record.host}-${record.value}`}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors group"
                      >
                        <td className="px-8 py-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-bold text-[9px] rounded-md px-2 py-0.5 uppercase tracking-widest border shadow-none",
                              TYPE_COLORS[record.type] ||
                                "bg-zinc-50 text-zinc-600 border-zinc-100"
                            )}
                          >
                            {record.type}
                          </Badge>
                        </td>
                        <td className="px-8 py-4 text-xs font-medium text-zinc-900 dark:text-zinc-100">{record.host || "@"}</td>
                        <td className="px-8 py-4 text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-md">{record.value}</td>
                        <td className="px-8 py-4 text-[10px] font-medium text-zinc-400 uppercase">{record.ttl}s</td>
                        <td className="px-8 py-4 text-right">
                          <button
                            onClick={() => handleDeleteRecord(record)}
                            disabled={isSaving}
                            type="button"
                            className="p-2 text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Empty State */
              <div className="p-32 flex flex-col items-center justify-center text-center space-y-6">
                <div className="size-20 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 shadow-none">
                  <Globe className="size-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">
                    Zone is currently empty
                  </h4>
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                    No active DNS records found for this domain
                  </p>
                </div>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="rounded-lg h-10 px-6 font-medium text-[10px] uppercase tracking-widest shadow-none"
                >
                  Initialize First Record
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Help Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-medium text-xs">
              ?
            </div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-tight">
              Need help with propagation times? Check our{" "}
              <button
                type="button"
                className="underline underline-offset-4 text-zinc-900 dark:text-zinc-100"
              >
                DNS Infrastructure Guide
              </button>
            </p>
          </div>
          <div className="flex items-center gap-4 opacity-50 grayscale">
            <div className="h-4 w-12 bg-zinc-400 rounded" />
            <div className="h-4 w-16 bg-zinc-400 rounded" />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
