-- Custom SQL migration file, put your code below! --
-- Folds apps/api/src/scripts/capacity-guard.sql into the journal so a fresh
-- `drizzle-kit migrate` alone produces a complete DB (total_capacity column,
-- overbooking guard trigger). Every statement is idempotent, so this is a
-- safe no-op on databases where apply-capacity-guard.ts already ran.
-- (Kept in sync with apps/api/src/scripts/capacity-guard.sql.)
ALTER TABLE slots ADD COLUMN IF NOT EXISTS total_capacity integer NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE slots
SET total_capacity = capacity + (
  SELECT count(*) FROM bookings
  WHERE bookings.slot_id = slots.id
    AND bookings.status IN ('reserved', 'confirmed')
)
WHERE total_capacity = 0;--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_slot_capacity()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
DECLARE
  active_count integer;
  slot_total integer;
BEGIN
  IF NEW.status IN ('reserved', 'confirmed') THEN
    SELECT total_capacity INTO slot_total FROM slots WHERE id = NEW.slot_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'SLOT_NOT_FOUND: slot % does not exist', NEW.slot_id;
    END IF;
    SELECT count(*) INTO active_count
    FROM bookings
    WHERE slot_id = NEW.slot_id
      AND id IS DISTINCT FROM NEW.id
      AND status IN ('reserved', 'confirmed');
    IF active_count >= slot_total THEN
      RAISE EXCEPTION 'SLOT_CAPACITY_EXCEEDED: slot % is full (total %)', NEW.slot_id, slot_total;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$;--> statement-breakpoint
DROP TRIGGER IF EXISTS bookings_capacity_guard ON bookings;--> statement-breakpoint
CREATE TRIGGER bookings_capacity_guard
  BEFORE INSERT OR UPDATE OF slot_id, status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_slot_capacity();
