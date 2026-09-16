-- Backstop enforcing slot capacity at the database level: any INSERT or
-- slot_id/status UPDATE that would push a slot past capacity is rejected,
-- no matter which code path wrote it (bookings API, moves between slots,
-- admin tools, manual SQL). Cancelled bookings never count, and updates to
-- unrelated columns (qr_token, confirmation flags) do not fire it.
--
-- True concurrency is serialized one layer up by the atomic seat claim
-- (claimSlotSeat: UPDATE ... WHERE capacity > 0 ... RETURNING); a BEFORE
-- trigger alone cannot serialize concurrent snapshots, so this guard exists
-- to make overbooking impossible even if a writer bypasses the claim.
--
-- Violations raise with a SLOT_CAPACITY_EXCEEDED marker. The Neon HTTP
-- driver drops the human message but keeps code P0001 + `where` naming this
-- function on the error's `cause`, which the API's errorHandler maps to
-- HTTP 409, matching the application-level message.
--
-- Idempotent: safe to rerun on every deploy.
--
-- One-time backfill for the total_capacity column (new slots get it at
-- creation): total = remaining + currently active bookings.
ALTER TABLE slots ADD COLUMN IF NOT EXISTS total_capacity integer NOT NULL DEFAULT 0;

UPDATE slots
SET total_capacity = capacity + (
  SELECT count(*) FROM bookings
  WHERE bookings.slot_id = slots.id
    AND bookings.status IN ('reserved', 'confirmed')
)
WHERE total_capacity = 0;

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
$func$;

DROP TRIGGER IF EXISTS bookings_capacity_guard ON bookings;

CREATE TRIGGER bookings_capacity_guard
  BEFORE INSERT OR UPDATE OF slot_id, status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enforce_slot_capacity();
