-- Fix: Add payment_screenshot_url to the create_booking_if_available function
-- Run this in your Supabase SQL Editor to apply the fix

create or replace function create_booking_if_available(
  p_booking_data jsonb,
  p_capacity     int
)
returns jsonb
language plpgsql
as $$
declare
  v_property_id  uuid   := (p_booking_data->>'property_id')::uuid;
  v_checkin      date   := (p_booking_data->>'checkin')::date;
  v_checkout     date   := (p_booking_data->>'checkout')::date;
  v_time_slot    time   := (p_booking_data->>'time_slot')::time;
  v_cur          date;
  v_next_day     date;
  v_count        int;
  v_result       jsonb;
begin
  -- ==========================================================
  -- BOARDING (hotel): lock + check each night in the range
  -- ==========================================================
  if v_checkout is not null then
    v_cur := v_checkin;
    while v_cur < v_checkout loop
      perform pg_advisory_xact_lock(
        hashtext(v_property_id::text || v_cur::text || 'night')
      );
      v_cur := v_cur + 1;
    end loop;

    v_cur := v_checkin;
    while v_cur < v_checkout loop
      v_next_day := v_cur + 1;

      select count(*) into v_count
        from bookings
       where property_id = v_property_id
         and is_deleted  = false
         and status in ('pending','confirmed','checked_in')
         and checkout is not null
         and checkin  < v_next_day
         and checkout > v_cur;

      if v_count >= p_capacity then
        raise exception 'SLOT_UNAVAILABLE:Date % is fully booked', v_cur
          using errcode = 'P0001';
      end if;

      v_cur := v_cur + 1;
    end loop;

  -- ==========================================================
  -- APPOINTMENT (grooming / vet): lock + check the time slot
  -- ==========================================================
  elsif v_time_slot is not null then
    perform pg_advisory_xact_lock(
      hashtext(v_property_id::text || v_checkin::text || v_time_slot::text)
    );

    select count(*) into v_count
      from bookings
     where property_id = v_property_id
       and checkin     = v_checkin
       and time_slot   = v_time_slot
       and checkout    is null
       and is_deleted  = false
       and status in ('pending','confirmed','checked_in');

    if v_count >= p_capacity then
      raise exception 'SLOT_UNAVAILABLE:The % time slot on % is no longer available',
        v_time_slot, v_checkin
        using errcode = 'P0001';
    end if;
  end if;

  -- ==========================================================
  -- INSERT  (includes payment_screenshot_url)
  -- ==========================================================
  insert into bookings (
    property_id, user_id, pet_id, service_id,
    checkin, checkout, time_slot,
    pet_name, pet_type, pet_breed, pet_age, pet_weight,
    special_requirements, med_cert_url, vaccine_record_url,
    service_name, service_type,
    owner_name, owner_email, owner_phone, emergency_contact,
    subtotal, service_fee, total_price, payment_method, payment_screenshot_url, notes
  ) values (
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
    p_booking_data->>'payment_screenshot_url',
    p_booking_data->>'notes'
  )
  returning to_jsonb(bookings.*) into v_result;

  return v_result;
end;
$$;
