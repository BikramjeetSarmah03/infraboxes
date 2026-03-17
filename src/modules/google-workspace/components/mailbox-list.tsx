"use client";

import type { GoogleWorkspaceMailbox } from "../gworkspace-types";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { User, Mail, Shield, Key, Copy, Check } from "lucide-react";
import { useState } from "react";
import { getMailboxCredentials } from "../actions/gworkspace-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

interface MailboxListProps {
  mailboxes: GoogleWorkspaceMailbox[];
}

function CredentialsButton({ mailboxId, email }: { mailboxId: string; email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCredentials = async () => {
    setLoading(true);
    const result = await getMailboxCredentials(mailboxId);
    if (result.success && result.credentials) {
      setCredentials(result.credentials);
    } else {
      toast.error(result.error || "Failed to load credentials");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (!credentials) return;
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open && !credentials) fetchCredentials();
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
          <Key className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Mailbox Credentials</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Email Address</span>
            <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
              <span className="text-sm font-medium flex-1">{email}</span>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Password</span>
            <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
              {loading ? (
                <span className="text-sm text-zinc-400 animate-pulse italic">Loading...</span>
              ) : (
                <>
                  <span className="text-sm font-mono flex-1">{credentials?.password || "••••••••"}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 text-zinc-400 hover:text-blue-500"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 text-center italic">
            Note: These are the credentials from account creation. If the user changed their password in Google, these may be outdated.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MailboxList({ mailboxes }: MailboxListProps) {
  if (!mailboxes || mailboxes.length === 0) {
    return (
      <div className="py-12 text-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <Mail className="size-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
        <p className="text-sm font-bold text-zinc-500">No mailboxes created yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
          <TableRow>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Email Address</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Name</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400">Role</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 text-center">Status</TableHead>
            <TableHead className="font-bold text-[10px] uppercase tracking-widest text-zinc-400 text-right">Access</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mailboxes.map((mailbox) => (
            <TableRow key={mailbox.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
              <TableCell className="font-bold text-zinc-900 dark:text-zinc-100 py-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
                    <Mail className="size-4" />
                  </div>
                  {mailbox.email}
                </div>
              </TableCell>
              <TableCell className="text-sm font-medium text-zinc-500">
                {mailbox.firstName} {mailbox.lastName}
              </TableCell>
              <TableCell>
                {mailbox.role === "admin" ? (
                  <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50 shadow-none font-bold text-[10px] uppercase gap-1">
                    <Shield className="size-3" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-zinc-500 border-zinc-200 dark:border-zinc-800 shadow-none font-bold text-[10px] uppercase gap-1">
                    <User className="size-3" />
                    User
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge 
                  className={
                    mailbox.status === "active" 
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50" 
                      : "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50"
                  }
                  variant="outline"
                >
                  {mailbox.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <CredentialsButton mailboxId={mailbox.id} email={mailbox.email} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
