-- ============================================================
-- Consolidated migration: create_booking_if_available function
-- This merges all previous migrations into one definitive version
-- that includes ALL booking columns:
--   - reference_number
--   - payment_screenshot_url
--   - source
--   - created_by
--
-- Run this in your Supabase SQL Editor to apply.
-- ============================================================

-- Ensure all required columns exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reference_number text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_screenshot_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_by uuid;

-- Update payment_method constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('card','gcash','paymaya','cash','bank_transfer', NULL));

-- Recreate the function with ALL columns
CREATE OR REPLACE FUNCTION create_booking_if_available(
  p_booking_data jsonb,
  p_capacity     int
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_property_id  uuid   := (p_booking_data->>'property_id')::uuid;
  v_checkin      date   := (p_booking_data->>'checkin')::date;
  v_checkout     date   := (p_booking_data->>'checkout')::date;
  v_time_slot    time   := (p_booking_data->>'time_slot')::time;
  v_cur          date;
  v_next_day     date;
  v_count        int;
  v_result       jsonb;
BEGIN
  -- ==========================================================
  -- BOARDING (hotel): lock + check each night in the range
  -- ==========================================================
  IF v_checkout IS NOT NULL THEN
    v_cur := v_checkin;
    WHILE v_cur < v_checkout LOOP
      PERFORM pg_advisory_xact_lock(
        hashtext(v_property_id::text || v_cur::text || 'night')
      );
      v_cur := v_cur + 1;
    END LOOP;

    v_cur := v_checkin;
    WHILE v_cur < v_checkout LOOP
      v_next_day := v_cur + 1;

      SELECT count(*) INTO v_count
        FROM bookings
       WHERE property_id = v_property_id
         AND is_deleted  = false
         AND status IN ('pending','confirmed','checked_in')
         AND checkout IS NOT NULL
         AND checkin  < v_next_day
         AND checkout > v_cur;

      IF v_count >= p_capacity THEN
        RAISE EXCEPTION 'SLOT_UNAVAILABLE:Date % is fully booked', v_cur
          USING errcode = 'P0001';
      END IF;

      v_cur := v_cur + 1;
    END LOOP;

  -- ==========================================================
  -- APPOINTMENT (grooming / vet): lock + check the time slot
  -- ==========================================================
  ELSIF v_time_slot IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(
      hashtext(v_property_id::text || v_checkin::text || v_time_slot::text)
    );

    SELECT count(*) INTO v_count
      FROM bookings
     WHERE property_id = v_property_id
       AND checkin     = v_checkin
       AND time_slot   = v_time_slot
       AND checkout    IS NULL
       AND is_deleted  = false
       AND status IN ('pending','confirmed','checked_in');

    IF v_count >= p_capacity THEN
      RAISE EXCEPTION 'SLOT_UNAVAILABLE:The % time slot on % is no longer available',
        v_time_slot, v_checkin
        USING errcode = 'P0001';
    END IF;
  END IF;

  -- ==========================================================
  -- INSERT (all columns including reference_number,
  --         payment_screenshot_url, source, created_by)
  -- ==========================================================
  INSERT INTO bookings (
    property_id, user_id, pet_id, service_id,
    checkin, checkout, time_slot,
    pet_name, pet_type, pet_breed, pet_age, pet_weight,
    special_requirements, med_cert_url, vaccine_record_url,
    service_name, service_type,
    owner_name, owner_email, owner_phone, emergency_contact,
    subtotal, service_fee, total_price,
    payment_method, reference_number, payment_screenshot_url,
    notes, source, created_by
  ) VALUES (
    v_property_id,
    (p_booking_data->>'user_id')::uuid,
    nullif(p_booking_data->>'pet_id', '')::uuid,
    nullif(p_booking_data->>'service_id', '')::uuid,
    v_checkin,
    v_checkout,
    v_time_slot,
    p_booking_data->>'pet_name',
    p_booking_data->>'pet_type',
    p_booking_data->>'pet_breed',
    p_booking_data->>'pet_age',
    p_booking_data->>'pet_weight',
    p_booking_data->>'special_requirements',
    p_booking_data->>'med_cert_url',
    p_booking_data->>'vaccine_record_url',
    p_booking_data->>'service_name',
    p_booking_data->>'service_type',
    p_booking_data->>'owner_name',
    p_booking_data->>'owner_email',
    p_booking_data->>'owner_phone',
    p_booking_data->>'emergency_contact',
    nullif(p_booking_data->>'subtotal',    '')::numeric,
    nullif(p_booking_data->>'service_fee', '')::numeric,
    nullif(p_booking_data->>'total_price', '')::numeric,
    p_booking_data->>'payment_method',
    p_booking_data->>'reference_number',
    p_booking_data->>'payment_screenshot_url',
    p_booking_data->>'notes',
    COALESCE(p_booking_data->>'source', 'web'),
    nullif(p_booking_data->>'created_by', '')::uuid
  )
  RETURNING to_jsonb(bookings.*) INTO v_result;

  RETURN v_result;
END;
$$;
