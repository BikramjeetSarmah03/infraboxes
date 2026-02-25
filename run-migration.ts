import { sql } from "drizzle-orm";
import { db } from "./src/shared/infrastructure/database/db-client";

async function run() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "company" (
        "id" text PRIMARY KEY NOT NULL,
        "userId" text NOT NULL,
        "legalName" text NOT NULL,
        "taxId" text,
        "incorporationDate" timestamp,
        "status" text DEFAULT 'pending' NOT NULL,
        "address" text,
        "country" text,
        "state" text,
        "city" text,
        "zip" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      DO $$ BEGIN
      ALTER TABLE "company" ADD CONSTRAINT "company_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
      WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

run();
