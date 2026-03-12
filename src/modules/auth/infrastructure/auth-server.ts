import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins/phone-number";
import { admin } from "better-auth/plugins/admin";
import { db } from "@/shared/infrastructure/database/db-client";
import * as schema from "@/shared/infrastructure/database/schemas";

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
  plugins: [phoneNumber(), admin()],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      isAccountSetuped: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      companyName: {
        type: "string",
        required: false,
      },
      companyCategory: {
        type: "string",
        required: false,
      },
      address: {
        type: "string",
        required: false,
      },
      country: {
        type: "string",
        required: false,
      },
      state: {
        type: "string",
        required: false,
      },
      city: {
        type: "string",
        required: false,
      },
      zip: {
        type: "string",
        required: false,
      },
    },
  },
});
