-- ============================================================
-- SEED DATA
-- 4 routes × 2 flights = 8 flights
-- Each flight: 8 first + 30 business + 138 economy = 176 seats
-- Routes: DEL↔BOM, DEL↔BLR
-- ============================================================

-- Helper function to generate seats for a flight
CREATE OR REPLACE FUNCTION seed_seats(p_flight_id uuid) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_row    int;
  v_col    text;
  v_cols   text[] := ARRAY['A','B','C','D','E','F'];
  v_cols4  text[] := ARRAY['A','B','C','D'];
BEGIN
  -- First class: rows 1-2, columns A-D (8 seats)
  FOR v_row IN 1..2 LOOP
    FOREACH v_col IN ARRAY v_cols4 LOOP
      INSERT INTO seats (flight_id, seat_number, class, extra_fee)
        VALUES (p_flight_id, v_row::text || v_col, 'first', 5000);
    END LOOP;
  END LOOP;

  -- Business: rows 3-7, columns A-F (30 seats)
  FOR v_row IN 3..7 LOOP
    FOREACH v_col IN ARRAY v_cols LOOP
      INSERT INTO seats (flight_id, seat_number, class, extra_fee)
        VALUES (p_flight_id, v_row::text || v_col, 'business', 2000);
    END LOOP;
  END LOOP;

  -- Economy: rows 8-30, columns A-F (138 seats)
  FOR v_row IN 8..30 LOOP
    FOREACH v_col IN ARRAY v_cols LOOP
      INSERT INTO seats (flight_id, seat_number, class, extra_fee)
        VALUES (p_flight_id, v_row::text || v_col, 'economy', 0);
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================================
-- INSERT FLIGHTS
-- ============================================================
DO $$
DECLARE
  f1 uuid; f2 uuid; f3 uuid; f4 uuid;
  f5 uuid; f6 uuid; f7 uuid; f8 uuid;
BEGIN
  -- Route 1: DEL → BOM (2 flights)
  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SK101', 'DEL', 'BOM',
      now() + interval '2 days 8 hours',
      now() + interval '2 days 10 hours 30 minutes',
      'Airbus A320', 4500)
    RETURNING id INTO f1;
  PERFORM seed_seats(f1);

  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SK103', 'DEL', 'BOM',
      now() + interval '3 days 14 hours',
      now() + interval '3 days 16 hours 30 minutes',
      'Boeing 737', 3800)
    RETURNING id INTO f2;
  PERFORM seed_seats(f2);

  -- Route 2: BOM → DEL (2 flights)
  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SK102', 'BOM', 'DEL',
      now() + interval '2 days 12 hours',
      now() + interval '2 days 14 hours 30 minutes',
      'Airbus A320', 4200)
    RETURNING id INTO f3;
  PERFORM seed_seats(f3);

  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SK104', 'BOM', 'DEL',
      now() + interval '4 days 9 hours',
      now() + interval '4 days 11 hours 30 minutes',
      'Boeing 737', 3600)
    RETURNING id INTO f4;
  PERFORM seed_seats(f4);

  -- Route 3: DEL → BLR (2 flights)
  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SK201', 'DEL', 'BLR',
      now() + interval '2 days 6 hours',
      now() + interval '2 days 9 hours',
      'Boeing 737', 5200)
    RETURNING id INTO f5;
  PERFORM seed_seats(f5);

  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SK203', 'DEL', 'BLR',
      now() + interval '5 days 16 hours',
      now() + interval '5 days 19 hours',
      'Airbus A321', 4800)
    RETURNING id INTO f6;
  PERFORM seed_seats(f6);

  -- Route 4: BLR → DEL (2 flights)
  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SK202', 'BLR', 'DEL',
      now() + interval '3 days 10 hours',
      now() + interval '3 days 13 hours',
      'Boeing 737', 5000)
    RETURNING id INTO f7;
  PERFORM seed_seats(f7);

  INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price)
    VALUES ('SK204', 'BLR', 'DEL',
      now() + interval '6 days 7 hours',
      now() + interval '6 days 10 hours',
      'Airbus A321', 4600)
    RETURNING id INTO f8;
  PERFORM seed_seats(f8);
END;
$$;

-- Drop the helper now that seeding is done
DROP FUNCTION IF EXISTS seed_seats(uuid);
