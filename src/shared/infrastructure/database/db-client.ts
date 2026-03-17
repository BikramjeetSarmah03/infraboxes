import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

/**
 * In Next.js dev mode, the module is re-evaluated on every hot reload.
 * This can create multiple connection pools. Using a global variable
 * ensures we reuse the same pool.
 */
declare global {
  // eslint-disable-next-line no-var
  var postgresClient: ReturnType<typeof postgres> | undefined;
}

const client = globalThis.postgresClient ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalThis.postgresClient = client;
}

export const db = drizzle(client, { schema });

