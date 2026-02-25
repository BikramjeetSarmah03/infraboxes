import type React from "react";
import { SettingsSidebar } from "./settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row flex-1 bg-white dark:bg-black">
      {/* Secondary Sidebar - Sticky on Desktop */}
      <SettingsSidebar />

      {/* Main Settings Content - Scrollable with distinct background */}
      <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
