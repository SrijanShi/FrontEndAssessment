-- ============================================================
-- TRIGGER: enforce_cancellation_window
-- DB-level guard: blocks UPDATE of bookings.status to 'cancelled'
-- if the flight departs within 2 hours. This is a second line of
-- defence — the RPC also checks this, but the trigger prevents
-- any direct SQL bypass.
-- ============================================================
CREATE OR REPLACE FUNCTION check_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_departs_at timestamptz;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT f.departs_at INTO v_departs_at
      FROM flights f
      JOIN bookings b ON b.flight_id = f.id
      WHERE b.id = NEW.id;

    IF v_departs_at - now() < interval '2 hours' THEN
      RAISE EXCEPTION
        'DB constraint: cancellation not allowed within 2 hours of departure (flight departs at %)',
        v_departs_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_cancellation_window ON bookings;
CREATE TRIGGER enforce_cancellation_window
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_cancellation_window();
