"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Globe,
  Mail,
  Users,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Shield,
  Trash2,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createWorkspaceOrder,
  setupWorkspacePrimaryAdmin,
  addWorkspaceUserMailbox,
} from "../actions/gworkspace-actions";
import { getUserProfileForBilling } from "@/modules/domains/actions/domain-actions";
import { eq } from "drizzle-orm";
import { faker } from "@faker-js/faker";

type WizardStep =
  | "domain"
  | "plan"
  | "admin"
  | "users"
  | "review"
  | "processing"
  | "success";

interface UserDomain {
  id: string;
  name: string;
  status: string;
}

interface NewMailbox {
  username: string;
  firstName: string;
  lastName: string;
}

export function GoogleWorkspaceWizard({ domains }: { domains: UserDomain[] }) {
  const [step, setStep] = useState<WizardStep>("domain");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<UserDomain | null>(null);
  const [months, setMonths] = useState("12");
  const [noOfAccounts, setNoOfAccounts] = useState(3);

  // Admin Info
  const [adminInfo, setAdminInfo] = useState({
    username: "admin",
    firstName: "",
    lastName: "",
    alternateEmail: "",
  });

  // Additional Users Info
  const [userMailboxes, setUserMailboxes] = useState<NewMailbox[]>([]);

  // Progress tracking
  const [progress, setProgress] = useState<{
    order: "pending" | "loading" | "done" | "error";
    admin: "pending" | "loading" | "done" | "error";
    users: {
      total: number;
      done: number;
      status: "pending" | "loading" | "done" | "error";
    };
  }>({
    order: "pending",
    admin: "pending",
    users: { total: 0, done: 0, status: "pending" },
  });

  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    const prefill = async () => {
      const result = await getUserProfileForBilling();
      if (result.success && result.profile) {
        setAdminInfo((prev) => ({
          ...prev,
          firstName: result.profile?.name?.split(" ")[0] || "",
          lastName: result.profile?.name?.split(" ").slice(1).join(" ") || "",
          alternateEmail: result.profile?.email || "",
        }));
      }
    };
    prefill();
  }, []);

  const addUserRow = () => {
    if (userMailboxes.length + 1 < noOfAccounts) {
      setUserMailboxes([
        ...userMailboxes,
        { username: "", firstName: "", lastName: "" },
      ]);
    } else {
      toast.error(`You selected ${noOfAccounts} accounts in the plan.`);
    }
  };

  const removeUserRow = (index: number) => {
    setUserMailboxes(userMailboxes.filter((_, i) => i !== index));
  };

  const updateUserRow = (
    index: number,
    field: keyof NewMailbox,
    value: string,
  ) => {
    const newUsers = [...userMailboxes];
    newUsers[index] = { ...newUsers[index], [field]: value };
    setUserMailboxes(newUsers);
  };

  const startProvisioning = async () => {
    setStep("processing");
    setIsProcessing(true);
    setErrorStatus(null);

    // 1. Order Creation
    setProgress((p) => ({ ...p, order: "loading" }));
    const orderRes = await createWorkspaceOrder(
      selectedDomain!.id,
      parseInt(months),
      noOfAccounts,
    );

    if (!orderRes.success || !orderRes.workspaceOrderId) {
      setProgress((p) => ({ ...p, order: "error" }));
      setErrorStatus(orderRes.error || "Order placement failed");
      setIsProcessing(false);
      return;
    }
    const workspaceOrderId = orderRes.workspaceOrderId;
    setProgress((p) => ({ ...p, order: "done" }));

    // 2. Admin Setup
    setProgress((p) => ({ ...p, admin: "loading" }));
    const adminRes = await setupWorkspacePrimaryAdmin(
      workspaceOrderId,
      adminInfo.username,
      adminInfo.firstName,
      adminInfo.lastName,
      adminInfo.alternateEmail,
    );

    if (!adminRes.success) {
      setProgress((p) => ({ ...p, admin: "error" }));
      setErrorStatus(adminRes.error || "Admin setup failed");
      setIsProcessing(false);
      return;
    }
    setProgress((p) => ({ ...p, admin: "done" }));

    // 3. User Creation
    if (userMailboxes.length > 0) {
      setProgress((p) => ({
        ...p,
        users: { total: userMailboxes.length, done: 0, status: "loading" },
      }));

      let failCount = 0;
      for (let i = 0; i < userMailboxes.length; i++) {
        const user = userMailboxes[i];
        if (!user.username) continue;

        const userRes = await addWorkspaceUserMailbox(
          workspaceOrderId,
          user.username,
          user.firstName,
          user.lastName,
        );

        if (userRes.success) {
          setProgress((p) => ({
            ...p,
            users: { ...p.users, done: i + 1 },
          }));
        } else {
          failCount++;
        }
      }

      if (failCount === userMailboxes.length) {
        setProgress((p) => ({ ...p, users: { ...p.users, status: "error" } }));
      } else {
        setProgress((p) => ({ ...p, users: { ...p.users, status: "done" } }));
      }
    } else {
      setProgress((p) => ({
        ...p,
        users: { total: 0, done: 0, status: "done" },
      }));
    }

    setStep("success");
    toast.success("Workspace provisioning complete!");
  };

  const generateRandomUsers = () => {
    const remaining = noOfAccounts - 1 - userMailboxes.length;
    if (remaining <= 0) {
      toast.error("All licenses are already allocated.");
      return;
    }

    const newUsers: NewMailbox[] = [];
    for (let i = 0; i < remaining; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      newUsers.push({
        firstName,
        lastName,
        username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(
          /[^a-z.]/g,
          "",
        ),
      });
    }

    setUserMailboxes([...userMailboxes, ...newUsers]);
    toast.success(`Generated ${remaining} random users!`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 pb-32">
      {/* Stepper Header */}
      {step !== "success" && step !== "processing" && (
        <div className="flex items-center justify-center mb-12 space-x-4 md:space-x-8">
          {[
            { id: "domain", label: "Domain", icon: Globe },
            { id: "plan", label: "Plan", icon: Loader2 },
            { id: "admin", label: "Admin", icon: Shield },
            { id: "users", label: "Users", icon: Users },
            { id: "review", label: "Review", icon: CheckCircle2 },
          ].map((s, i, arr) => {
            const isActive = step === s.id;
            const currentIdx = arr.findIndex((item) => item.id === step);
            const isDone = i < currentIdx;
            const Icon = s.icon;

            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    "flex flex-col items-center space-y-2 relative transition-all duration-300",
                    isActive
                      ? "scale-110 opacity-100"
                      : isDone
                        ? "opacity-100"
                        : "opacity-40",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-xl",
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isActive
                          ? "bg-blue-600 border-blue-600 text-white shadow-blue-500/20"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      isActive ? "text-blue-600" : "text-zinc-500",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className={cn(
                      "w-8 md:w-16 h-0.5 mx-4 md:mx-6 rounded-full transition-colors duration-500",
                      isDone
                        ? "bg-emerald-500"
                        : "bg-zinc-200 dark:bg-zinc-800",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "domain" && (
          <motion.div
            key="domain"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Select a Domain
              </h1>
              <p className="text-zinc-500 font-medium">
                Which domain would you like to use for Google Workspace?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {domains.map((d) => (
                <Card
                  key={d.id}
                  className={cn(
                    "p-6 cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group",
                    selectedDomain?.id === d.id
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/10"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950",
                  )}
                  onClick={() => setSelectedDomain(d)}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div
                      className={cn(
                        "size-12 rounded-xl flex items-center justify-center transition-colors",
                        selectedDomain?.id === d.id
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50",
                      )}
                    >
                      <Globe className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                        {d.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="mt-1 text-[10px] font-bold uppercase tracking-widest"
                      >
                        {d.status}
                      </Badge>
                    </div>
                  </div>
                  {selectedDomain?.id === d.id && (
                    <div className="absolute top-0 right-0 p-3">
                      <CheckCircle2 className="size-6 text-blue-600" />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <Button
                disabled={!selectedDomain}
                onClick={() => setStep("plan")}
                className="h-14 px-12 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl hover:scale-105 transition-transform"
              >
                Proceed to Plan
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "plan" && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Configuration
              </h1>
              <p className="text-zinc-500 font-medium">
                Choose your workspace setup for{" "}
                <span className="text-zinc-900 dark:text-zinc-50 font-black">
                  {selectedDomain?.name}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none space-y-6">
                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                    Number of Accounts
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      className="size-12 rounded-xl text-lg font-bold"
                      onClick={() =>
                        setNoOfAccounts(Math.max(1, noOfAccounts - 1))
                      }
                    >
                      -
                    </Button>
                    <div className="flex-1 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center font-black text-xl">
                      {noOfAccounts}
                    </div>
                    <Button
                      variant="outline"
                      className="size-12 rounded-xl text-lg font-bold"
                      onClick={() => setNoOfAccounts(noOfAccounts + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold italic">
                    Each account includes a full mailbox, and shared space.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                    Subscription Period
                  </Label>
                  <Select value={months} onValueChange={setMonths}>
                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50 dark:bg-zinc-900">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" className="font-bold">
                        1 Month
                      </SelectItem>
                      <SelectItem value="12" className="font-bold">
                        12 Months (Recommended)
                      </SelectItem>
                      <SelectItem value="24" className="font-bold">
                        24 Months
                      </SelectItem>
                      <SelectItem value="36" className="font-bold">
                        36 Months
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <div className="bg-blue-600 rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl shadow-blue-500/20">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60">
                    Estimated Total
                  </span>
                  <div className="text-5xl font-black">Free</div>
                  <p className="text-xs font-medium opacity-80 leading-relaxed">
                    Pricing is fetched from your ResellerClub account. During
                    this beta, provisioning is direct via API.
                  </p>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>Selected Domain</span>
                    <span className="opacity-60">{selectedDomain?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>License Type</span>
                    <span className="opacity-60">Business Starter</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant="ghost"
                onClick={() => setStep("domain")}
                className="h-14 px-8 font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-zinc-900"
              >
                <ChevronLeft className="size-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("admin")}
                className="h-14 px-12 bg-blue-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-blue-700 transition-all"
              >
                Setup Admin Account
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "admin" && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Main Admin Account
              </h1>
              <p className="text-zinc-500 font-medium">
                This will be your primary super-admin account for the
                organization.
              </p>
            </div>

            <Card className="p-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                    Admin Email Address
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      value={adminInfo.username}
                      onChange={(e) =>
                        setAdminInfo({ ...adminInfo, username: e.target.value })
                      }
                      className="h-14 rounded-xl font-black text-lg bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-black transition-all"
                    />
                    <span className="text-xl font-black text-zinc-300">@</span>
                    <div className="h-14 flex items-center px-6 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 font-black text-lg">
                      {selectedDomain?.name}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                    First Name
                  </Label>
                  <Input
                    value={adminInfo.firstName}
                    onChange={(e) =>
                      setAdminInfo({ ...adminInfo, firstName: e.target.value })
                    }
                    placeholder="Enter first name"
                    className="h-12 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                    Last Name
                  </Label>
                  <Input
                    value={adminInfo.lastName}
                    onChange={(e) =>
                      setAdminInfo({ ...adminInfo, lastName: e.target.value })
                    }
                    placeholder="Enter last name"
                    className="h-12 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
                    Alternate Email (For Recovery)
                  </Label>
                  <Input
                    value={adminInfo.alternateEmail}
                    onChange={(e) =>
                      setAdminInfo({
                        ...adminInfo,
                        alternateEmail: e.target.value,
                      })
                    }
                    placeholder="Recovery email address"
                    className="h-12 rounded-xl font-bold bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant="ghost"
                onClick={() => setStep("plan")}
                className="h-14 px-8 font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-zinc-900"
              >
                <ChevronLeft className="size-4 mr-2" />
                Back
              </Button>
              <Button
                disabled={
                  !adminInfo.username ||
                  !adminInfo.firstName ||
                  !adminInfo.lastName ||
                  !adminInfo.alternateEmail
                }
                onClick={() => setStep("users")}
                className="h-14 px-12 bg-blue-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-blue-700 transition-all"
              >
                Add More Users ({noOfAccounts - 1} available)
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Additional Users
              </h1>
              <p className="text-zinc-500 font-medium">
                Add more mailboxes to your organization. You have{" "}
                <span className="text-zinc-900 dark:text-zinc-50 font-black">
                  {noOfAccounts - 1 - userMailboxes.length}
                </span>{" "}
                licenses left.
              </p>
            </div>

            <div className="space-y-4">
              {userMailboxes.map((user, idx) => (
                <Card
                  key={idx.toString()}
                  className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-zinc-400">
                          Username
                        </Label>
                        <Input
                          value={user.username}
                          onChange={(e) =>
                            updateUserRow(idx, "username", e.target.value)
                          }
                          className="h-10 bg-zinc-50 dark:bg-zinc-900 font-bold"
                          placeholder="j.doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-zinc-400">
                          First Name
                        </Label>
                        <Input
                          value={user.firstName}
                          onChange={(e) =>
                            updateUserRow(idx, "firstName", e.target.value)
                          }
                          className="h-10 bg-zinc-50 dark:bg-zinc-900 font-bold"
                          placeholder="First"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-zinc-400">
                          Last Name
                        </Label>
                        <Input
                          value={user.lastName}
                          onChange={(e) =>
                            updateUserRow(idx, "lastName", e.target.value)
                          }
                          className="h-10 bg-zinc-50 dark:bg-zinc-900 font-bold"
                          placeholder="Last"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-6 text-zinc-400 hover:text-red-500"
                      onClick={() => removeUserRow(idx)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {userMailboxes.length + 1 < noOfAccounts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={addUserRow}
                    className="h-16 border-dashed border-2 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-blue-500 hover:border-blue-500 transition-all font-bold uppercase tracking-widest text-[10px]"
                  >
                    + Add Empty Row
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateRandomUsers}
                    className="h-16 border-dashed border-2 border-blue-100 dark:border-blue-900/30 text-blue-400 hover:text-blue-600 hover:border-blue-400 transition-all font-bold uppercase tracking-widest text-[10px] gap-2"
                  >
                    <Wand2 className="size-4" />
                    Magic Fill ({noOfAccounts - 1 - userMailboxes.length} left)
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant="ghost"
                onClick={() => setStep("admin")}
                className="h-14 px-8 font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-zinc-900"
              >
                <ChevronLeft className="size-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("review")}
                className="h-14 px-12 bg-blue-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-blue-700 transition-all"
              >
                Review Configuration
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Ready to Provision
              </h1>
              <p className="text-zinc-500 font-medium">
                Please review everything before we start the setup process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <Card className="md:col-span-8 p-8 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Mailbox Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/40">
                      <div className="flex items-center gap-3">
                        <Shield className="size-5 text-blue-600" />
                        <div>
                          <p className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                            {adminInfo.username}@{selectedDomain?.name}
                          </p>
                          <p className="text-[10px] uppercase font-bold text-zinc-500">
                            Super Admin • {adminInfo.firstName}{" "}
                            {adminInfo.lastName}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 text-white border-0 text-[9px] uppercase font-black">
                        Admin
                      </Badge>
                    </div>

                    {userMailboxes.map((user, i) => (
                      <div
                        key={i.toString()}
                        className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="size-5 text-zinc-400" />
                          <div>
                            <p className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                              {user.username}@{selectedDomain?.name}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-zinc-500">
                              User Account • {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-black text-zinc-400 border-zinc-200"
                        >
                          User
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <div className="md:col-span-4 space-y-6">
                <div className="p-8 bg-zinc-900 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 rounded-2xl shadow-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-8 leading-none">
                    Order Summary
                  </h3>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Selected Plan
                      </span>
                      <span className="text-white dark:text-zinc-900 font-black">
                        Business Starter
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Duration
                      </span>
                      <span className="text-white dark:text-zinc-900 font-black">
                        {months} Months
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Total Accounts
                      </span>
                      <span className="text-white dark:text-zinc-900 font-black">
                        {noOfAccounts} Licensed Users
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={startProvisioning}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-500/20 font-black uppercase tracking-widest text-xs"
                >
                  Confirm & Provision
                  <ChevronRight className="size-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-12 py-12"
          >
            <div className="relative">
              <div className="size-32 rounded-full border-4 border-zinc-100 dark:border-zinc-900 border-t-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="size-10 text-blue-600 animate-pulse" />
              </div>
            </div>

            <div className="w-full max-w-sm space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  Setup in Progress
                </h2>
                <p className="text-sm font-medium text-zinc-500">
                  Please do not refresh the page.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                    {progress.order === "done" ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : progress.order === "loading" ? (
                      <Loader2 className="size-5 text-blue-500 animate-spin" />
                    ) : progress.order === "error" ? (
                      <AlertCircle className="size-5 text-red-500" />
                    ) : (
                      <div className="size-5 rounded-full border-2 border-zinc-200" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-black uppercase tracking-widest",
                        progress.order === "loading"
                          ? "text-blue-600"
                          : "text-zinc-500",
                      )}
                    >
                      Ordering Workspace
                    </span>
                  </div>
                  {progress.order === "done" && (
                    <Badge className="bg-emerald-50 text-emerald-600 text-[8px] border-emerald-100">
                      DONE
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                    {progress.admin === "done" ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : progress.admin === "loading" ? (
                      <Loader2 className="size-5 text-blue-500 animate-spin" />
                    ) : progress.admin === "error" ? (
                      <AlertCircle className="size-5 text-red-500" />
                    ) : (
                      <div className="size-5 rounded-full border-2 border-zinc-200" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-black uppercase tracking-widest",
                        progress.admin === "loading"
                          ? "text-blue-600"
                          : "text-zinc-500",
                      )}
                    >
                      Configuring Admin
                    </span>
                  </div>
                  {progress.admin === "done" && (
                    <Badge className="bg-emerald-50 text-emerald-600 text-[8px] border-emerald-100">
                      DONE
                    </Badge>
                  )}
                </div>

                {progress.users.total > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-3">
                      {progress.users.status === "done" ? (
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      ) : progress.users.status === "loading" ? (
                        <Loader2 className="size-5 text-blue-500 animate-spin" />
                      ) : progress.users.status === "error" ? (
                        <AlertCircle className="size-5 text-red-500" />
                      ) : (
                        <div className="size-5 rounded-full border-2 border-zinc-200" />
                      )}
                      <span
                        className={cn(
                          "text-xs font-black uppercase tracking-widest",
                          progress.users.status === "loading"
                            ? "text-blue-600"
                            : "text-zinc-500",
                        )}
                      >
                        Adding Users ({progress.users.done}/
                        {progress.users.total})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {errorStatus && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-start gap-3">
                  <AlertCircle className="size-5 shrink-0" />
                  <p className="text-xs font-bold font-mono uppercase">
                    {errorStatus}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 py-12 text-center"
          >
            <div className="size-24 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
              <CheckCircle2 className="size-12" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Setup Complete!
              </h1>
              <p className="text-zinc-500 font-medium max-w-sm mx-auto">
                Your Google Workspace accounts have been provisioned. It may
                take 15-30 minutes for DNS records to propagate.
              </p>
            </div>

            <Card className="w-full max-w-md p-6 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-left space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Next Steps
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Login to{" "}
                    <span className="font-bold underline cursor-pointer">
                      google.com/a/{selectedDomain?.name}
                    </span>{" "}
                    with your new admin account.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Wait for DNS propagation. Your MX records have been
                    auto-configured.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Complete the Google setup wizard to verify ownership and
                    activate mail.
                  </p>
                </li>
              </ul>
            </Card>

            <Button
              onClick={() => window.location.reload()}
              className="h-14 px-12 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black uppercase text-xs tracking-[0.2em] rounded-2xl"
            >
              Go to Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
