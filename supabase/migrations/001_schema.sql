-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FLIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS flights (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no     text        NOT NULL,
  origin        text        NOT NULL,
  destination   text        NOT NULL,
  departs_at    timestamptz NOT NULL,
  arrives_at    timestamptz NOT NULL,
  aircraft_type text        NOT NULL DEFAULT 'Boeing 737',
  status        text        NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled','delayed','cancelled','completed')),
  base_price    numeric     NOT NULL CHECK (base_price > 0)
);

-- ============================================================
-- SEATS
-- ============================================================
CREATE TABLE IF NOT EXISTS seats (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id     uuid        NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  seat_number   text        NOT NULL,
  class         text        NOT NULL CHECK (class IN ('economy','business','first')),
  is_available  boolean     NOT NULL DEFAULT true,
  extra_fee     numeric     NOT NULL DEFAULT 0 CHECK (extra_fee >= 0),
  UNIQUE (flight_id, seat_number)
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id     uuid        NOT NULL REFERENCES flights(id),
  seat_id       uuid        NOT NULL REFERENCES seats(id),
  status        text        NOT NULL DEFAULT 'confirmed'
                            CHECK (status IN ('confirmed','rescheduled','cancelled')),
  booked_at     timestamptz NOT NULL DEFAULT now(),
  total_price   numeric     NOT NULL CHECK (total_price >= 0),
  pnr_code      text        NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8))
);

-- ============================================================
-- PASSENGERS
-- ============================================================
CREATE TABLE IF NOT EXISTS passengers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name     text        NOT NULL,
  passport_no   text        NOT NULL,
  nationality   text        NOT NULL,
  dob           date        NOT NULL
);

-- ============================================================
-- RESCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS reschedules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_flight_id   uuid        NOT NULL REFERENCES flights(id),
  new_flight_id   uuid        NOT NULL REFERENCES flights(id),
  requested_at    timestamptz NOT NULL DEFAULT now(),
  fee_charged     numeric     NOT NULL DEFAULT 0 CHECK (fee_charged >= 0)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- FLIGHTS — public read, no writes from client
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flights_public_read" ON flights FOR SELECT USING (true);

-- SEATS — public read, no writes from client
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seats_public_read" ON seats FOR SELECT USING (true);

-- BOOKINGS — users access only their own
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_owner_all" ON bookings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PASSENGERS — users access via their bookings
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passengers_owner_all" ON passengers
  FOR ALL USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  )
  WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );

-- RESCHEDULES — users access via their bookings
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reschedules_owner_all" ON reschedules
  FOR ALL USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  )
  WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_flights_route ON flights(origin, destination, departs_at);
CREATE INDEX IF NOT EXISTS idx_seats_flight ON seats(flight_id, is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_passengers_booking ON passengers(booking_id);
