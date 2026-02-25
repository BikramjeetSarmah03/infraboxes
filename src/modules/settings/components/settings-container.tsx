"use client";

import { Settings } from "lucide-react";
import { AccountInfoSection } from "./account-info-section";
import { PersonalDetailsSection } from "./personal-details-section";
import { UsageStatsSection } from "./usage-stats-section";

// Using a more structured interface based on what the DB returns
interface SettingsContainerProps {
  user: {
    id: string;
    email: string;
    createdAt: Date;
    name: string;
    companyName?: string | null;
    companyCategory?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zip?: string | null;
  };
}

export function SettingsContainer({ user }: SettingsContainerProps) {
  return (
    <div className="flex flex-col flex-1 w-full bg-white dark:bg-black">
      {/* Sticky Module Header - Connected Look */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="px-6 md:px-12 h-20 flex items-center justify-between max-w-375 mx-auto w-full">
          <div className="flex items-center gap-5">
            <div className="size-11 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-none">
              <Settings className="size-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                Platform Settings
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                Configuration Hub
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 md:px-12 py-12 max-w-375 mx-auto w-full space-y-10 flex-1 animate-in fade-in duration-500">
        <UsageStatsSection totalDomains={5} totalMailboxes={0} />

        <AccountInfoSection
          email={user.email}
          userId={user.id}
          createdAt={user.createdAt}
          status="active" // Could be derived from user context in future
          planType="starter"
        />

        <PersonalDetailsSection
          initialData={{
            name: user.name,
            companyName: user.companyName,
            companyCategory: user.companyCategory,
            phoneNumber: user.phoneNumber,
            address: user.address,
            city: user.city,
            state: user.state,
            country: user.country,
            zip: user.zip,
          }}
        />
      </div>
    </div>
  );
}
