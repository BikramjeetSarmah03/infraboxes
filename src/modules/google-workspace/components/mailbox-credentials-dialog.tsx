"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MailboxCredentialsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mailbox: {
    email: string;
    password?: string | null;
  };
}

export function MailboxCredentialsDialog({
  isOpen,
  onClose,
  mailbox,
}: MailboxCredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 overflow-hidden rounded-3xl">
        <div className="p-6 pb-0">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-4 mx-auto">
              <ShieldCheck className="size-6" />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-zinc-900 dark:text-zinc-50 tracking-tight">
              Mailbox Credentials
            </DialogTitle>
            <DialogDescription className="text-center text-zinc-500 font-medium">
              Copy these credentials to sign in to your Google Workspace account.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
              Email Address
            </Label>
            <div className="relative group">
              <Input
                readOnly
                value={mailbox.email}
                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold pr-12 rounded-xl"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 size-10 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                onClick={() => copyToClipboard(mailbox.email)}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">
              Temporary Password
            </Label>
            <div className="relative group">
              <Input
                type={showPassword ? "text" : "password"}
                readOnly
                value={mailbox.password || "••••••••"}
                className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold pr-20 rounded-xl"
              />
              <div className="absolute right-1 top-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-10 transition-all",
                    copied ? "text-emerald-500" : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                  onClick={() => mailbox.password && copyToClipboard(mailbox.password)}
                  disabled={!mailbox.password}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
            {!mailbox.password && (
              <p className="text-[10px] text-zinc-400 font-bold italic">
                Password was not captured during auto-provisioning.
              </p>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-4 rounded-2xl">
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              <strong>Note:</strong> You will be asked to change this password on your first login at{" "}
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="font-black underline decoration-amber-500/30 hover:decoration-amber-500 transition-all"
              >
                gmail.com
              </a>.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            onClick={onClose}
            className="w-full h-12 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-900/10"
          >
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
