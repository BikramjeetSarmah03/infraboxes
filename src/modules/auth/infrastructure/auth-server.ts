import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/shared/infrastructure/database/db-client";
import * as schema from "@/shared/infrastructure/database/schemas";
import { phoneNumber } from "better-auth/plugins/phone-number";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  plugins: [phoneNumber()],
  emailAndPassword: {
    enabled: true,
  },
});
