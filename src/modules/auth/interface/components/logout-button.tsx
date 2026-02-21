"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "../../infrastructure/auth-client";

interface LogoutButtonProps extends React.ComponentProps<typeof Button> {}

export function LogoutButton({ className, ...props }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
          router.refresh();
        },
      },
    });
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleLogout}
      disabled={loading}
      {...props}
    >
      <LogOut className="size-4" />
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
