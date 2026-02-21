import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/infrastructure/auth-server";
import { LogoutButton } from "@/modules/auth/interface/components/logout-button";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  if (!session.user.isAccountSetuped) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 rounded-2xl border bg-white p-12 shadow-sm dark:border-zinc-800 dark:bg-black">
        <div className="flex w-full items-center justify-between">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={80}
            height={16}
            priority
          />
          <LogoutButton />
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative size-20 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
            {session?.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold uppercase text-zinc-400">
                {session?.user.name?.charAt(0) ?? "U"}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, {session?.user.name}!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              You are securely logged in as {session?.user.email}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
            <h3 className="font-medium">User Status</h3>
            <p className="text-sm text-zinc-500">Active and authenticated</p>
          </div>
          <div className="rounded-xl border p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
            <h3 className="font-medium">Recent Activity</h3>
            <p className="text-sm text-zinc-500">Last login: Just now</p>
          </div>
        </div>
      </main>
    </div>
  );
}
