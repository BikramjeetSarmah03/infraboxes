import { DangerZoneSection } from "@/modules/settings/components/danger-zone-section";

export default function AdvancedSettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Configuration Section */}
      {/* <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none">
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
      </section> */}

      {/* Experimental Features Section */}
      {/* <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-none">
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
      </section> */}

      {/* Danger Zone Section - Combined and Simplified */}
      <DangerZoneSection />
    </div>
  );
}
