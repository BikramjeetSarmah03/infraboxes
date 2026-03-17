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
import { Loader2, ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import { addWorkspaceLicensesAction } from "../actions/gworkspace-actions";

interface AddLicensesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceOrderId: string;
  domainName: string;
}

export function AddLicensesDialog({
  isOpen,
  onClose,
  workspaceOrderId,
  domainName,
}: AddLicensesDialogProps) {
  const [count, setCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (count < 1) {
      toast.error("Please add at least 1 license");
      return;
    }

    try {
      setIsLoading(true);
      const res = await addWorkspaceLicensesAction(workspaceOrderId, count);
      if (res.success) {
        toast.success(`Successfully added ${count} license(s)`);
        onClose();
        setCount(1);
      } else {
        toast.error(res.error || "Failed to add licenses");
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
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <ShieldPlus className="size-32" />
          </div>
          <DialogHeader className="relative z-10 space-y-2">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 italic">
               Buy Extra Mailboxes
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium">
              Add more seats to your Google Workspace for <span className="font-bold underline underline-offset-4 decoration-2">{domainName}</span>.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <Label htmlFor="count" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Number of Additional Seats
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
                value={count}
                onChange={(e) => setCount(Number.parseInt(e.target.value) || 1)}
                className="text-center h-12 rounded-xl text-lg font-black border-zinc-200 dark:border-zinc-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                variant="outline"
                size="icon"
                className="size-12 rounded-xl border-zinc-200 dark:border-zinc-800 text-lg font-bold"
                onClick={() => setCount(count + 1)}
              >
                +
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest text-center">
              Estimated Total
            </p>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300 text-center mt-1">
              {count} Seat(s)
            </p>
          </div>
        </div>

        <DialogFooter className="p-8 pt-0">
          <Button
            onClick={handleAdd}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-zinc-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Order Licenses
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
