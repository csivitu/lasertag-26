DROP INDEX "account_issuer_accountId_uidx";--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "is_checked_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "checked_in_at" timestamp;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "name" text;--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_slot_id_idx" ON "bookings" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "bookings_team_code_idx" ON "bookings" USING btree ("team_code");--> statement-breakpoint
CREATE INDEX "bookings_qr_token_idx" ON "bookings" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_active_user_slot_idx" ON "bookings" USING btree ("user_id","slot_id") WHERE status IN ('reserved', 'confirmed');--> statement-breakpoint
CREATE INDEX "slots_start_time_idx" ON "slots" USING btree ("start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_single_user_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_members_team_code_idx" ON "team_members" USING btree ("team_code");--> statement-breakpoint
CREATE INDEX "teams_leader_id_idx" ON "teams" USING btree ("leader_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_providerId_accountId_uidx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_positive_capacity" CHECK ("slots"."capacity" >= 0);