"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldMinus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteWorkspaceAccountsAction } from "../actions/gworkspace-actions";

interface ReduceLicensesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceOrderId: string;
  domainName: string;
  currentCount: number;
  activeMailboxes: number;
}

export function ReduceLicensesDialog({
  isOpen,
  onClose,
  workspaceOrderId,
  domainName,
  currentCount,
  activeMailboxes,
}: ReduceLicensesDialogProps) {
  const [count, setCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const maxReducible = Math.max(0, currentCount - activeMailboxes);

  const handleReduce = async () => {
    if (count < 1) {
      toast.error("Please reduce at least 1 license");
      return;
    }
    if (count > maxReducible) {
      toast.error(`You can only reduce up to ${maxReducible} license(s) without deleting active mailboxes.`);
      return;
    }

    try {
      setIsLoading(true);
      const res = await deleteWorkspaceAccountsAction(workspaceOrderId, count);
      if (res.success) {
        toast.success(`Successfully reduced ${count} license(s)`);
        onClose();
        setCount(1);
      } else {
        toast.error(res.error || "Failed to reduce licenses");
      }
    } catch (_err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-0 bg-white dark:bg-zinc-950">
        <div className="bg-linear-to-br from-red-600 to-rose-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <ShieldMinus className="size-32" />
          </div>
          <DialogHeader className="relative z-10 space-y-2">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 italic">
               Reduce Licenses
            </DialogTitle>
            <DialogDescription className="text-red-100 font-medium">
              Remove unused seats from your Google Workspace for <span className="font-bold underline underline-offset-4 decoration-2">{domainName}</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-4 rounded-2xl flex gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Important</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 font-medium leading-relaxed">
                You can only remove <span className="font-black underline">{maxReducible}</span> unused licenses. 
                Active mailboxes must be deleted first if you wish to reduce further.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="count" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Number of Licenses to Remove
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="size-12 rounded-xl border-zinc-200 dark:border-zinc-800 text-lg font-bold"
                onClick={() => setCount(Math.max(1, count - 1))}
              >
                -
              </Button>
              <Input
                id="count"
                type="number"
                min="1"
                max={maxReducible}
                value={count}
                onChange={(e) => setCount(Math.min(maxReducible, Math.max(0, Number.parseInt(e.target.value) || 0)))}
                className="text-center h-12 rounded-xl text-lg font-black border-zinc-200 dark:border-zinc-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="outline"
                size="icon"
                className="size-12 rounded-xl border-zinc-200 dark:border-zinc-800 text-lg font-bold"
                onClick={() => setCount(Math.min(maxReducible, count + 1))}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 pt-0">
          <Button
            onClick={handleReduce}
            disabled={isLoading || maxReducible === 0}
            className="w-full h-14 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-zinc-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Confirm Reduction
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
