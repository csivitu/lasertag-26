CREATE UNIQUE INDEX IF NOT EXISTS "bookings_one_active_per_user_idx" ON "bookings" USING btree ("user_id") WHERE status IN ('reserved', 'confirmed');
