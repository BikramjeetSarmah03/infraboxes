import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { OnboardingWizard } from "@/modules/onboarding/interface/components/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.isAccountSetuped) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <OnboardingWizard
        initialData={{
          name: session.user.name,
          phoneNumber: session.user.phoneNumber ?? undefined,
        }}
      />
    </div>
  );
}
