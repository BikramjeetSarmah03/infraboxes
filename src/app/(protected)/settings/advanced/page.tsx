import {
  AlertTriangle,
  RotateCcw,
  Settings2,
  Terminal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdvancedSettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Configuration Section */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
          <Settings2 className="size-4 text-zinc-500" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
            Advanced Configurations
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                API Access
              </p>
              <p className="text-xs text-zinc-500">
                Enable programmatic access to your infrastructure via our Public
                API.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="font-bold text-[10px] h-7 px-3 border-zinc-200 dark:border-zinc-800 uppercase tracking-wider"
            >
              Generate Key
            </Button>
          </div>
          <div className="h-px bg-zinc-100 dark:bg-zinc-900" />
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Debug Mode
              </p>
              <p className="text-xs text-zinc-500">
                Show detailed error logs and infrastructure latency metrics in
                dashboard.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="font-bold text-[10px] h-7 px-3 border-zinc-200 dark:border-zinc-800 uppercase tracking-wider"
            >
              Enable
            </Button>
          </div>
        </div>
      </section>

      {/* Experimental Features Section */}
      <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-2">
          <Terminal className="size-4 text-zinc-500" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
            Labs & Experiments
          </h3>
        </div>
        <div className="p-10 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto">
          <div className="size-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Terminal className="size-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
              Beta Access Required
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Experimental features are only available to users who have opted
              into the Beta testing program.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-bold text-[10px] h-8 px-4 border-zinc-200 dark:border-zinc-800 uppercase tracking-wider rounded-lg"
          >
            Join Beta Program
          </Button>
        </div>
      </section>

      {/* Danger Zone Section - Combined and Simplified */}
      <section className="bg-white dark:bg-zinc-950 border border-red-200/50 dark:border-red-900/20 rounded-2xl overflow-hidden shadow-none">
        <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-900/10 flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-500" />
          <h3 className="font-bold text-sm text-red-900 dark:text-red-400 tracking-tight">
            Danger Zone
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/20 dark:bg-red-900/10 transition-colors hover:bg-red-50/40 dark:hover:bg-red-900/20 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-900 dark:text-red-400">
                Delete Account Data
              </h4>
              <p className="text-xs text-red-700/70 dark:text-red-400/60 leading-relaxed">
                Permanently delete all your domains, mailboxes, and personal
                information. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="font-bold text-[10px] h-8 px-4 rounded-lg uppercase tracking-wider bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="size-3.5 mr-2" /> Delete All Data
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-900/10 transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-900/20 space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 tracking-tight">
                Clear Personal Information
              </h4>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/60 leading-relaxed">
                Clear your contact details and company information while keeping
                your account active.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-bold text-[10px] h-8 px-4 rounded-lg border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 uppercase tracking-wider"
            >
              <RotateCcw className="size-3.5 mr-2" /> Clear Personal Info
            </Button>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-900" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Purge Infrastructure Cache
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                Clear all DNS and Mailbox edge caches. This may cause temporary
                latency for your users.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-bold text-[10px] h-8 px-4 border-zinc-200 dark:border-zinc-800 uppercase tracking-wider rounded-lg shrink-0"
            >
              Purge Cache
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
