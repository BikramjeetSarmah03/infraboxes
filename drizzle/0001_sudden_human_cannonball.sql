ALTER TABLE "user" ADD COLUMN "scheduledForDeletion" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deletionScheduledAt" timestamp;