-- ============================================================
-- RPC: reserve_seat
-- Atomically locks a seat and creates a booking + passenger record.
-- Uses SELECT ... FOR UPDATE to prevent double-booking race conditions.
-- SECURITY DEFINER runs as the function owner (bypasses RLS for writes).
-- ============================================================
CREATE OR REPLACE FUNCTION reserve_seat(
  p_flight_id   uuid,
  p_seat_id     uuid,
  p_user_id     uuid,
  p_passenger   jsonb,
  p_total_price numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id uuid;
  v_pnr        text;
BEGIN
  -- Verify the caller is the authenticated user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock the seat row — prevents concurrent reservations
  PERFORM id FROM seats
    WHERE id = p_seat_id
      AND flight_id = p_flight_id
      AND is_available = true
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat is no longer available';
  END IF;

  -- Mark seat as unavailable
  UPDATE seats
    SET is_available = false
    WHERE id = p_seat_id;

  -- Create booking record
  INSERT INTO bookings (user_id, flight_id, seat_id, total_price)
    VALUES (p_user_id, p_flight_id, p_seat_id, p_total_price)
    RETURNING id, pnr_code
    INTO v_booking_id, v_pnr;

  -- Create passenger record
  INSERT INTO passengers (booking_id, full_name, passport_no, nationality, dob)
    VALUES (
      v_booking_id,
      p_passenger->>'full_name',
      p_passenger->>'passport_no',
      p_passenger->>'nationality',
      (p_passenger->>'dob')::date
    );

  RETURN jsonb_build_object(
    'booking_id', v_booking_id,
    'pnr_code',   v_pnr
  );
END;
$$;

-- ============================================================
-- RPC: cancel_booking
-- Atomically cancels a booking and frees the seat.
-- Enforces 2-hour departure window at application level too
-- (the trigger in 003_triggers.sql enforces it at DB level).
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id uuid,
  p_user_id    uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seat_id    uuid;
  v_departs_at timestamptz;
  v_status     text;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT b.seat_id, f.departs_at, b.status
    INTO v_seat_id, v_departs_at, v_status
    FROM bookings b
    JOIN flights  f ON f.id = b.flight_id
    WHERE b.id = p_booking_id
      AND b.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking is already cancelled';
  END IF;

  IF v_departs_at - now() < interval '2 hours' THEN
    RAISE EXCEPTION 'Cannot cancel within 2 hours of departure';
  END IF;

  -- Update booking status
  UPDATE bookings
    SET status = 'cancelled'
    WHERE id = p_booking_id;

  -- Free the seat
  UPDATE seats
    SET is_available = true
    WHERE id = v_seat_id;
END;
$$;

-- ============================================================
-- RPC: reschedule_booking
-- Atomically reschedules a booking to a new flight + seat.
-- Frees the old seat, locks the new seat, records the reschedule.
-- ============================================================
CREATE OR REPLACE FUNCTION reschedule_booking(
  p_booking_id     uuid,
  p_user_id        uuid,
  p_new_flight_id  uuid,
  p_new_seat_id    uuid,
  p_fee_charged    numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_seat_id   uuid;
  v_old_flight_id uuid;
  v_status        text;
  v_departs_at    timestamptz;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT b.seat_id, b.flight_id, b.status, f.departs_at
    INTO v_old_seat_id, v_old_flight_id, v_status, v_departs_at
    FROM bookings b
    JOIN flights  f ON f.id = b.flight_id
    WHERE b.id = p_booking_id
      AND b.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot reschedule a cancelled booking';
  END IF;

  IF v_departs_at - now() < interval '2 hours' THEN
    RAISE EXCEPTION 'Cannot reschedule within 2 hours of departure';
  END IF;

  -- Lock and verify new seat availability
  PERFORM id FROM seats
    WHERE id = p_new_seat_id
      AND flight_id = p_new_flight_id
      AND is_available = true
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'New seat is not available';
  END IF;

  -- Free old seat
  UPDATE seats SET is_available = true  WHERE id = v_old_seat_id;

  -- Lock new seat
  UPDATE seats SET is_available = false WHERE id = p_new_seat_id;

  -- Update booking
  UPDATE bookings
    SET flight_id   = p_new_flight_id,
        seat_id     = p_new_seat_id,
        status      = 'rescheduled',
        total_price = total_price + p_fee_charged
    WHERE id = p_booking_id;

  -- Record reschedule
  INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
    VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, p_fee_charged);
END;
$$;
