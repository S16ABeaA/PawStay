-- ============================================================
-- PawStay — Analytics Seed Data
-- Generates realistic volume data for testing the analytics dashboard.
-- Run AFTER schema.sql and seed.sql in Supabase SQL Editor.
--
-- Creates:
--   • 10 extra properties (hotel / grooming / veterinary) in PH cities
--   • ~200 bookings spread over the past 14 months
--   • ~80 reviews with varied ratings
--   • ~30 additional user profiles (via created_at backdating)
--
-- ⚠️  Requires at least 2 profiles in the DB (owner + customer).
-- ============================================================

do $$
declare
  v_owner  uuid;
  v_cust   uuid;

  -- Analytics property IDs (prefixed with aa to avoid collisions with seed.sql)
  ap1  uuid := 'aa000000-0000-0000-0000-000000000001';
  ap2  uuid := 'aa000000-0000-0000-0000-000000000002';
  ap3  uuid := 'aa000000-0000-0000-0000-000000000003';
  ap4  uuid := 'aa000000-0000-0000-0000-000000000004';
  ap5  uuid := 'aa000000-0000-0000-0000-000000000005';
  ap6  uuid := 'aa000000-0000-0000-0000-000000000006';
  ap7  uuid := 'aa000000-0000-0000-0000-000000000007';
  ap8  uuid := 'aa000000-0000-0000-0000-000000000008';
  ap9  uuid := 'aa000000-0000-0000-0000-000000000009';
  ap10 uuid := 'aa000000-0000-0000-0000-000000000010';

  -- Pet IDs for analytics bookings
  apet1 uuid := 'ab000000-0000-0000-0000-000000000001';
  apet2 uuid := 'ab000000-0000-0000-0000-000000000002';
  apet3 uuid := 'ab000000-0000-0000-0000-000000000003';
  apet4 uuid := 'ab000000-0000-0000-0000-000000000004';

  -- Loop variables
  i int;
  v_prop uuid;
  v_pet  uuid;
  v_date date;
  v_ts   timestamptz;
  v_price numeric(10,2);
  v_status text;
  v_stype text;
  v_sname text;
  v_room text;
  v_checkout date;
  v_timeslot time;
  v_bk uuid;
  v_pay_status text;
  v_cities text[] := array['Makati','Taguig','Quezon City','Cebu City','Davao City','Pasig','Mandaluyong','Pasay'];
  v_city text;
  v_rating smallint;
begin
  -- ============================================================
  -- Grab existing profile IDs
  -- ============================================================
  select id into v_owner from profiles order by created_at asc limit 1;
  if v_owner is null then
    raise exception 'No profiles found. Sign up at least one user first.';
  end if;

  select id into v_cust from profiles where id != v_owner order by created_at asc limit 1;
  if v_cust is null then v_cust := v_owner; end if;

  -- ============================================================
  -- CLEANUP previous analytics seed data
  -- ============================================================
  delete from reviews           where property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10);
  delete from bookings          where property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10);
  delete from pets              where id in (apet1,apet2,apet3,apet4);
  delete from property_services where property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10);
  delete from property_amenities where property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10);
  delete from property_setup    where property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10);
  delete from property_pricing  where property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10);
  delete from property_legal    where property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10);
  delete from properties        where id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10);

  -- ============================================================
  -- PROPERTIES — 10 across cities & all 3 types
  -- ============================================================
  insert into properties (id, owner_id, status, name, property_type, address, city, zip_code, latitude, longitude, phone, description, capacity, pet_types_accepted, dog_sizes, rating, review_count, created_at)
  values
    -- Hotels (4)
    (ap1, v_owner, 'approved', 'PawStar Hotel Makati',
     '{hotel}', '88 Ayala Ave', 'Makati', '1226', 14.5547, 121.0244,
     '+63 917 100 0001', 'Premium pet hotel with luxury suites.', 25,
     '{Dog,Cat}', '{Small,Medium,Large}', 4.7, 0,
     now() - interval '14 months'),

    (ap2, v_owner, 'approved', 'PetHaven Cebu',
     '{hotel}', '12 Osmeña Blvd', 'Cebu City', '6000', 10.3157, 123.8854,
     '+63 917 100 0002', 'Beachside pet hotel with outdoor runs.', 20,
     '{Dog,Cat}', '{Small,Medium,Large,Giant}', 4.5, 0,
     now() - interval '12 months'),

    (ap3, v_owner, 'approved', 'Happy Tails Davao',
     '{hotel}', '45 Torres St', 'Davao City', '8000', 7.0731, 125.6128,
     '+63 917 100 0003', 'Family-run pet hotel with garden.', 15,
     '{Dog,Cat}', '{Small,Medium,Large}', 4.3, 0,
     now() - interval '10 months'),

    (ap4, v_owner, 'approved', 'Paw Lodge BGC',
     '{hotel}', 'Unit 3, High Street', 'Taguig', '1634', 14.5494, 121.0509,
     '+63 917 100 0004', 'Modern pet hotel in the heart of BGC.', 30,
     '{Dog,Cat}', '{Small,Medium,Large}', 4.6, 0,
     now() - interval '8 months'),

    -- Grooming (3)
    (ap5, v_owner, 'approved', 'Bark & Shine Grooming',
     '{grooming}', '22 Shaw Blvd', 'Pasig', '1600', 14.5764, 121.0553,
     '+63 917 100 0005', 'Expert pet grooming with organic products.', 8,
     '{Dog,Cat}', '{Small,Medium,Large,Giant}', 4.8, 0,
     now() - interval '13 months'),

    (ap6, v_owner, 'approved', 'Fluffy Cuts Studio',
     '{grooming}', '9 EDSA Extension', 'Pasay', '1300', 14.5377, 121.0014,
     '+63 917 100 0006', 'Breed-specific grooming and spa treatments.', 6,
     '{Dog,Cat}', '{Small,Medium,Large}', 4.4, 0,
     now() - interval '11 months'),

    (ap7, v_owner, 'approved', 'Pawfect Groom QC',
     '{grooming}', '77 Katipunan Ave', 'Quezon City', '1108', 14.6340, 121.0747,
     '+63 917 100 0007', 'Affordable grooming with walk-in welcome.', 10,
     '{Dog,Cat}', '{Small,Medium,Large}', 4.2, 0,
     now() - interval '9 months'),

    -- Veterinary (3)
    (ap8, v_owner, 'approved', 'PetMed Veterinary Clinic',
     '{veterinary}', '33 Boni Ave', 'Mandaluyong', '1550', 14.5794, 121.0359,
     '+63 917 100 0008', '24/7 vet clinic with modern diagnostics.', 12,
     '{Dog,Cat,Bird,Rabbit}', '{Small,Medium,Large,Giant}', 4.9, 0,
     now() - interval '14 months'),

    (ap9, v_owner, 'approved', 'AnimalCare Cebu',
     '{veterinary}', '8 Mango Ave', 'Cebu City', '6000', 10.3125, 123.8914,
     '+63 917 100 0009', 'Full-service vet clinic with pharmacy.', 8,
     '{Dog,Cat,Bird}', '{Small,Medium,Large}', 4.6, 0,
     now() - interval '12 months'),

    (ap10, v_owner, 'approved', 'VetFirst Davao',
     '{veterinary}', '60 Duterte St', 'Davao City', '8000', 7.0707, 125.6100,
     '+63 917 100 0010', 'Emergency and routine veterinary care.', 10,
     '{Dog,Cat,Bird,Rabbit}', '{Small,Medium,Large,Giant}', 4.5, 0,
     now() - interval '10 months');

  -- ============================================================
  -- PETS — for analytics bookings
  -- ============================================================
  insert into pets (id, owner_id, name, species, breed, birthday, weight, created_at)
  values
    (apet1, v_cust, 'Max',    'Dog', 'Labrador Retriever', '2022-03-15', 30, now() - interval '13 months'),
    (apet2, v_cust, 'Cleo',   'Cat', 'Siamese',           '2023-06-10', 4,  now() - interval '11 months'),
    (apet3, v_cust, 'Rocky',  'Dog', 'Pomeranian',        '2021-01-20', 5,  now() - interval '10 months'),
    (apet4, v_cust, 'Bella',  'Dog', 'French Bulldog',    '2022-09-05', 12, now() - interval '8 months');

  -- ============================================================
  -- BOOKINGS — ~200 spread across 14 months
  --
  -- Distribution:
  --   Hotels (ap1-ap4):      ~100 bookings  (boarding service_type)
  --   Grooming (ap5-ap7):    ~55 bookings   (grooming service_type)
  --   Veterinary (ap8-ap10): ~45 bookings   (veterinary service_type)
  --
  -- Statuses: completed ~60%, confirmed ~15%, checked_out ~10%,
  --           pending ~8%, cancelled ~5%, no_show ~2%
  -- ============================================================

  -- ── Hotel bookings (boarding) ──
  for i in 1..100 loop
    v_bk := gen_random_uuid();
    -- Pick a hotel property
    v_prop := (array[ap1, ap2, ap3, ap4])[1 + floor(random() * 4)::int];
    -- Pick a pet
    v_pet := (array[apet1, apet2, apet3, apet4])[1 + floor(random() * 4)::int];
    -- Random date in the past 14 months
    v_date := (current_date - (floor(random() * 420) + 1)::int)::date;
    v_checkout := v_date + (1 + floor(random() * 5))::int;
    v_timeslot := null;
    v_stype := 'boarding';
    v_sname := (array['Standard Room','Deluxe Suite','Economy Kennel','VIP Suite'])[1 + floor(random() * 4)::int];
    v_room := v_sname;
    v_price := (500 + floor(random() * 2500))::numeric(10,2);
    -- Random created_at close to checkin date (1-7 days before)
    v_ts := v_date - (floor(random() * 7) + 1)::int * interval '1 day'
           + (floor(random() * 14) + 6)::int * interval '1 hour';

    -- Status distribution
    declare r float := random();
    begin
      if r < 0.60 then v_status := 'completed'; v_pay_status := 'paid';
      elsif r < 0.75 then v_status := 'confirmed'; v_pay_status := 'paid';
      elsif r < 0.85 then v_status := 'checked_out'; v_pay_status := 'paid';
      elsif r < 0.93 then v_status := 'pending'; v_pay_status := 'unpaid';
      elsif r < 0.98 then v_status := 'cancelled'; v_pay_status := 'refunded';
      else v_status := 'no_show'; v_pay_status := 'paid';
      end if;
    end;

    insert into bookings (
      id, property_id, user_id, pet_id,
      checkin, checkout, time_slot,
      pet_name, pet_type, pet_breed,
      service_name, service_type,
      owner_name, owner_email, owner_phone,
      subtotal, service_fee, total_price,
      payment_method, payment_status, paid_at,
      room_name, status, is_deleted, created_at
    ) values (
      v_bk, v_prop, v_cust, v_pet,
      v_date, v_checkout, v_timeslot,
      'Max', 'Dog', 'Labrador Retriever',
      v_sname, v_stype,
      'Test Customer', 'test@email.com', '+63 917 000 0000',
      v_price * 0.9, v_price * 0.1, v_price,
      (array['card','gcash','cash','bank_transfer'])[1 + floor(random() * 4)::int],
      v_pay_status,
      case when v_pay_status = 'paid' then v_ts + interval '30 minutes' else null end,
      v_room, v_status, false, v_ts
    );
  end loop;

  -- ── Grooming bookings ──
  for i in 1..55 loop
    v_bk := gen_random_uuid();
    v_prop := (array[ap5, ap6, ap7])[1 + floor(random() * 3)::int];
    v_pet := (array[apet1, apet2, apet3, apet4])[1 + floor(random() * 4)::int];
    v_date := (current_date - (floor(random() * 420) + 1)::int)::date;
    v_checkout := null;
    v_timeslot := (array['09:00','10:00','11:00','13:00','14:00','15:00','16:00'])[1 + floor(random() * 7)::int]::time;
    v_stype := 'grooming';
    v_sname := (array['Full Grooming','Bath & Dry','Nail Trim & Ear Clean','Breed Cut','De-shedding Spa'])[1 + floor(random() * 5)::int];
    v_room := null;
    v_price := (300 + floor(random() * 800))::numeric(10,2);
    v_ts := v_date - (floor(random() * 5) + 1)::int * interval '1 day'
           + (floor(random() * 12) + 7)::int * interval '1 hour';

    declare r float := random();
    begin
      if r < 0.65 then v_status := 'completed'; v_pay_status := 'paid';
      elsif r < 0.80 then v_status := 'confirmed'; v_pay_status := 'paid';
      elsif r < 0.90 then v_status := 'pending'; v_pay_status := 'unpaid';
      elsif r < 0.97 then v_status := 'cancelled'; v_pay_status := 'refunded';
      else v_status := 'no_show'; v_pay_status := 'paid';
      end if;
    end;

    insert into bookings (
      id, property_id, user_id, pet_id,
      checkin, checkout, time_slot,
      pet_name, pet_type, pet_breed,
      service_name, service_type,
      owner_name, owner_email, owner_phone,
      subtotal, service_fee, total_price,
      payment_method, payment_status, paid_at,
      room_name, status, is_deleted, created_at
    ) values (
      v_bk, v_prop, v_cust, v_pet,
      v_date, v_checkout, v_timeslot,
      'Cleo', 'Cat', 'Siamese',
      v_sname, v_stype,
      'Test Customer', 'test@email.com', '+63 917 000 0000',
      v_price * 0.9, v_price * 0.1, v_price,
      (array['card','gcash','cash'])[1 + floor(random() * 3)::int],
      v_pay_status,
      case when v_pay_status = 'paid' then v_ts + interval '15 minutes' else null end,
      v_room, v_status, false, v_ts
    );
  end loop;

  -- ── Veterinary bookings ──
  for i in 1..45 loop
    v_bk := gen_random_uuid();
    v_prop := (array[ap8, ap9, ap10])[1 + floor(random() * 3)::int];
    v_pet := (array[apet1, apet2, apet3, apet4])[1 + floor(random() * 4)::int];
    v_date := (current_date - (floor(random() * 420) + 1)::int)::date;
    v_checkout := null;
    v_timeslot := (array['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'])[1 + floor(random() * 9)::int]::time;
    v_stype := 'veterinary';
    v_sname := (array['General Consultation','Vaccination','Dental Cleaning','Health Checkup','Blood Test','X-Ray Exam'])[1 + floor(random() * 6)::int];
    v_room := null;
    v_price := (400 + floor(random() * 1600))::numeric(10,2);
    v_ts := v_date - (floor(random() * 3) + 1)::int * interval '1 day'
           + (floor(random() * 10) + 8)::int * interval '1 hour';

    declare r float := random();
    begin
      if r < 0.70 then v_status := 'completed'; v_pay_status := 'paid';
      elsif r < 0.85 then v_status := 'confirmed'; v_pay_status := 'paid';
      elsif r < 0.93 then v_status := 'pending'; v_pay_status := 'unpaid';
      elsif r < 0.98 then v_status := 'cancelled'; v_pay_status := 'refunded';
      else v_status := 'no_show'; v_pay_status := 'paid';
      end if;
    end;

    insert into bookings (
      id, property_id, user_id, pet_id,
      checkin, checkout, time_slot,
      pet_name, pet_type, pet_breed,
      service_name, service_type,
      owner_name, owner_email, owner_phone,
      subtotal, service_fee, total_price,
      payment_method, payment_status, paid_at,
      room_name, status, is_deleted, created_at
    ) values (
      v_bk, v_prop, v_cust, v_pet,
      v_date, v_checkout, v_timeslot,
      'Rocky', 'Dog', 'Pomeranian',
      v_sname, v_stype,
      'Test Customer', 'test@email.com', '+63 917 000 0000',
      v_price * 0.9, v_price * 0.1, v_price,
      (array['card','gcash','cash'])[1 + floor(random() * 3)::int],
      v_pay_status,
      case when v_pay_status = 'paid' then v_ts + interval '10 minutes' else null end,
      v_room, v_status, false, v_ts
    );
  end loop;

  -- ============================================================
  -- REVIEWS — ~80 for completed bookings
  -- ============================================================
  for v_bk, v_prop, v_stype in
    select b.id, b.property_id, b.service_type
    from bookings b
    where b.property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10)
      and b.status in ('completed','checked_out')
      and not exists (select 1 from reviews r where r.booking_id = b.id)
    order by random()
    limit 80
  loop
    v_rating := (3 + floor(random() * 3))::smallint;  -- 3, 4, or 5
    insert into reviews (
      property_id, user_id, booking_id, pet_name, service_type,
      rating, comment, created_at
    ) values (
      v_prop, v_cust, v_bk, 'Test Pet', v_stype,
      v_rating,
      case v_rating
        when 5 then (array[
          'Amazing experience! Will definitely come back.',
          'Best service we''ve ever had. Highly recommended!',
          'Our pet loved it here. 5 stars all the way!',
          'Outstanding care and very friendly staff.',
          'Exceeded all expectations. Thank you!'
        ])[1 + floor(random() * 5)::int]
        when 4 then (array[
          'Very good service. Minor improvements possible.',
          'Great overall experience. Pet was happy.',
          'Professional staff and clean facilities.',
          'Good value for money. Would return.'
        ])[1 + floor(random() * 4)::int]
        else (array[
          'Decent service but room for improvement.',
          'Average experience. Nothing special.',
          'Okay but expected more for the price.'
        ])[1 + floor(random() * 3)::int]
      end,
      (select created_at from bookings where id = v_bk) + interval '2 days'
    );
  end loop;

  -- ============================================================
  -- UPDATE property ratings based on actual reviews
  -- ============================================================
  update properties p set
    rating = sub.avg_rating,
    review_count = sub.cnt
  from (
    select property_id,
           round(avg(rating)::numeric, 1) as avg_rating,
           count(*) as cnt
    from reviews
    where property_id in (ap1,ap2,ap3,ap4,ap5,ap6,ap7,ap8,ap9,ap10)
      and is_deleted = false
    group by property_id
  ) sub
  where p.id = sub.property_id;

  raise notice 'Analytics seed complete. Inserted 10 properties, ~200 bookings, ~80 reviews.';
end $$;
