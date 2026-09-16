ALTER TABLE "slots" ADD COLUMN "total_capacity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "slots" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "reg_number" text;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_one_active_per_user_idx" ON "bookings" USING btree ("user_id") WHERE status IN ('reserved', 'confirmed');