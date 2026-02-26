"use client";

import { AlertTriangle, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/modules/auth/infrastructure/auth-client";
import {
  clearPersonalInformation,
  scheduleAccountDeletion,
} from "../actions/user-actions";

export function DangerZoneSection() {
  const [isClearing, startClearing] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const router = useRouter();

  const handleClearInformation = () => {
    startClearing(async () => {
      const result = await clearPersonalInformation();
      if (result.success) {
        toast.success("Personal information cleared successfully.");
      } else {
        toast.error(result.error || "Failed to clear information.");
      }
    });
  };

  const handleScheduleDeletion = () => {
    startDeleting(async () => {
      const result = await scheduleAccountDeletion();
      if (result.success) {
        toast.success("Account scheduled for deletion in 30 days.");
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/auth/login");
            },
          },
        });
      } else {
        toast.error(result.error || "Failed to schedule deletion.");
      }
    });
  };

  return (
    <section className="bg-white dark:bg-zinc-950 border border-red-200/50 dark:border-red-900/20 rounded-2xl overflow-hidden shadow-none">
      <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 flex items-center gap-2">
        <AlertTriangle className="size-4 text-red-500" />
        <h3 className="font-bold text-sm text-red-900 dark:text-red-400 tracking-tight">
          Danger Zone
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Soft Delete Account */}
        <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/20 dark:bg-red-900/10 transition-colors hover:bg-red-50/40 dark:hover:bg-red-900/20 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-900 dark:text-red-400">
              Schedule Account Deletion
            </h4>
            <p className="text-xs text-red-700/70 dark:text-red-400/60 leading-relaxed">
              Schedule your account and all associated data for deletion. Your
              account will be permanently deleted after 30 days. You can cancel
              this anytime by logging back in.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting || isClearing}
                className="font-bold text-[10px] h-8 px-4 rounded-lg uppercase tracking-wider bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5 mr-2" />
                    Schedule Deletion
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be signed out immediately. The account and all
                  associated domains and mailboxes will be permanently erased
                  after 30 days. You can cancel this process simply by logging
                  back in within the next 30 days.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleScheduleDeletion}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, schedule deletion
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Clear Personal Information */}
        <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-900/10 transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-900/20 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 tracking-tight">
              Clear Personal & Company Information
            </h4>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/60 leading-relaxed">
              Remove all your contact details and company profile data from our
              records. Your authentication account will remain fully active.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isClearing || isDeleting}
                className="font-bold text-[10px] h-8 px-4 rounded-lg border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 uppercase tracking-wider w-full sm:w-auto"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="size-3.5 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="size-3.5 mr-2" />
                    Clear Information
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Personal Information?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear your personal and company
                  information? This will reset all your contact details, but
                  your account will remain fully functional.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearInformation}>
                  Yes, clear information
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </section>
  );
}
