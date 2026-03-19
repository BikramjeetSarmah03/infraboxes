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
import { MailboxCredentialsDialog } from "./mailbox-credentials-dialog";
import { Button } from "@/components/ui/button";

interface MailboxListProps {
  mailboxes: GoogleWorkspaceMailbox[];
}

function CredentialsButton({ mailbox }: { mailbox: GoogleWorkspaceMailbox }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="size-8 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        onClick={() => setIsOpen(true)}
      >
        <Key className="size-4" />
      </Button>
      
      <MailboxCredentialsDialog 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mailbox={mailbox}
      />
    </>
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
                <CredentialsButton mailbox={mailbox} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
