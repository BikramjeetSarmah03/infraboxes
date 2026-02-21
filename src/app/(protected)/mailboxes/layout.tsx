import type React from "react";

export default function MailboxesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/30 min-h-[calc(100vh-3.5rem)]">
      {children}
    </div>
  );
}
