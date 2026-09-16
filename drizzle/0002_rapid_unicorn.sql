CREATE TABLE IF NOT EXISTS "verified_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reg_number" text,
	"email" text,
	"name" text,
	"source" text DEFAULT 'import' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verified_participants_has_identifier" CHECK (reg_number IS NOT NULL OR email IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verified_participants_reg_number_uidx" ON "verified_participants" USING btree ("reg_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "verified_participants_email_uidx" ON "verified_participants" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verified_participants_created_at_idx" ON "verified_participants" USING btree ("created_at");
