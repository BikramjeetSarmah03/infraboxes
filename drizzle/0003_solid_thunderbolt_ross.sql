CREATE TABLE "domain" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"orderId" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"isDnsActivated" boolean DEFAULT false NOT NULL,
	"expiryDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banReason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banExpires" timestamp;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;