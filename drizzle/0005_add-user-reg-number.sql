-- Custom SQL migration file, put your code below! --
-- user.reg_number existed in the schema and the old live DB but was never
-- captured in a migration, so fresh migrates lost the column. Backfill it.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "reg_number" text;