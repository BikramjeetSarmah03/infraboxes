import { createAuthClient } from "better-auth/react";
import { phoneNumber } from "better-auth/plugins/phone-number";
import type { auth } from "./auth-server";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [phoneNumber()],
});
