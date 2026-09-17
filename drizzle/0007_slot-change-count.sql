ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "slot_change_count" integer NOT NULL DEFAULT 0;
