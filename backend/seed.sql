-- ============================================================
-- PawStay — Complete Sample Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================
--
-- ⚠️  IMPORTANT: You need at least 4 users signed up in auth.users
--     so that profiles exist. The seed picks the first 4 profiles:
--       owner   = property owner / proprietor
--       cust1   = customer 1
--       cust2   = customer 2
--       admin1  = admin / superadmin
--
--     If you only have 1 user, all roles will be the same user.
--     SELECT id, email FROM profiles LIMIT 10;
-- ============================================================

do $$
declare
  owner  uuid;
  cust1  uuid;
  cust2  uuid;
  admin1 uuid;

  -- Property IDs (fixed so child tables can reference them)
  p1  uuid := 'a1000000-0000-0000-0000-000000000001';
  p2  uuid := 'a1000000-0000-0000-0000-000000000002';
  p3  uuid := 'a1000000-0000-0000-0000-000000000003';
  p4  uuid := 'a1000000-0000-0000-0000-000000000004';
  p5  uuid := 'a1000000-0000-0000-0000-000000000005';
  p6  uuid := 'a1000000-0000-0000-0000-000000000006';
  p7  uuid := 'a1000000-0000-0000-0000-000000000007';
  p8  uuid := 'a1000000-0000-0000-0000-000000000008';
  p9  uuid := 'a1000000-0000-0000-0000-000000000009';
  p10 uuid := 'a1000000-0000-0000-0000-000000000010';
  p11 uuid := 'a1000000-0000-0000-0000-000000000011';
  p12 uuid := 'a1000000-0000-0000-0000-000000000012';
  p13 uuid := 'a1000000-0000-0000-0000-000000000013';
  p14 uuid := 'a1000000-0000-0000-0000-000000000014';
  p15 uuid := 'a1000000-0000-0000-0000-000000000015';

  -- Pet IDs
  pet1 uuid := 'b1000000-0000-0000-0000-000000000001';
  pet2 uuid := 'b1000000-0000-0000-0000-000000000002';
  pet3 uuid := 'b1000000-0000-0000-0000-000000000003';
  pet4 uuid := 'b1000000-0000-0000-0000-000000000004';
  pet5 uuid := 'b1000000-0000-0000-0000-000000000005';
  pet6 uuid := 'b1000000-0000-0000-0000-000000000006';
  pet7 uuid := 'b1000000-0000-0000-0000-000000000007';
  pet8 uuid := 'b1000000-0000-0000-0000-000000000008';

  -- Booking IDs
  bk1  uuid := 'c1000000-0000-0000-0000-000000000001';
  bk2  uuid := 'c1000000-0000-0000-0000-000000000002';
  bk3  uuid := 'c1000000-0000-0000-0000-000000000003';
  bk4  uuid := 'c1000000-0000-0000-0000-000000000004';
  bk5  uuid := 'c1000000-0000-0000-0000-000000000005';
  bk6  uuid := 'c1000000-0000-0000-0000-000000000006';
  bk7  uuid := 'c1000000-0000-0000-0000-000000000007';
  bk8  uuid := 'c1000000-0000-0000-0000-000000000008';
  bk9  uuid := 'c1000000-0000-0000-0000-000000000009';
  bk10 uuid := 'c1000000-0000-0000-0000-000000000010';
  bk11 uuid := 'c1000000-0000-0000-0000-000000000011';
  bk12 uuid := 'c1000000-0000-0000-0000-000000000012';
  bk13 uuid := 'c1000000-0000-0000-0000-000000000013';
  bk14 uuid := 'c1000000-0000-0000-0000-000000000014';
  bk15 uuid := 'c1000000-0000-0000-0000-000000000015';

  -- Review IDs
  rv1  uuid := 'd1000000-0000-0000-0000-000000000001';
  rv2  uuid := 'd1000000-0000-0000-0000-000000000002';
  rv3  uuid := 'd1000000-0000-0000-0000-000000000003';
  rv4  uuid := 'd1000000-0000-0000-0000-000000000004';
  rv5  uuid := 'd1000000-0000-0000-0000-000000000005';
  rv6  uuid := 'd1000000-0000-0000-0000-000000000006';
  rv7  uuid := 'd1000000-0000-0000-0000-000000000007';
  rv8  uuid := 'd1000000-0000-0000-0000-000000000008';
  rv9  uuid := 'd1000000-0000-0000-0000-000000000009';
  rv10 uuid := 'd1000000-0000-0000-0000-000000000010';

  -- Support Ticket IDs
  tk1  uuid := 'e1000000-0000-0000-0000-000000000001';
  tk2  uuid := 'e1000000-0000-0000-0000-000000000002';
  tk3  uuid := 'e1000000-0000-0000-0000-000000000003';
  tk4  uuid := 'e1000000-0000-0000-0000-000000000004';

  -- Transaction IDs
  tx1  uuid := 'f1000000-0000-0000-0000-000000000001';
  tx2  uuid := 'f1000000-0000-0000-0000-000000000002';
  tx3  uuid := 'f1000000-0000-0000-0000-000000000003';
  tx4  uuid := 'f1000000-0000-0000-0000-000000000004';
  tx5  uuid := 'f1000000-0000-0000-0000-000000000005';
  tx6  uuid := 'f1000000-0000-0000-0000-000000000006';
  tx7  uuid := 'f1000000-0000-0000-0000-000000000007';
  tx8  uuid := 'f1000000-0000-0000-0000-000000000008';
  tx9  uuid := 'f1000000-0000-0000-0000-000000000009';
  tx10 uuid := 'f1000000-0000-0000-0000-000000000010';

  -- Service IDs (we'll capture them from inserts)
  svc_p1_boarding uuid;
  svc_p2_grooming uuid;
  svc_p3_consult  uuid;
  svc_p4_boarding uuid;
  svc_p6_vip      uuid;

begin
  -- ============================================================
  -- Grab profile IDs (need at least 1 user signed up)
  -- ============================================================
  select id into owner from profiles order by created_at asc limit 1;
  if owner is null then
    raise exception 'No profile found. Sign up first, then run this seed.';
  end if;

  -- Try to get additional users; fall back to owner if not enough
  select id into cust1 from profiles where id != owner order by created_at asc limit 1;
  if cust1 is null then cust1 := owner; end if;

  select id into cust2 from profiles where id not in (owner, cust1) order by created_at asc limit 1;
  if cust2 is null then cust2 := cust1; end if;

  select id into admin1 from profiles where id not in (owner, cust1, cust2) order by created_at asc limit 1;
  if admin1 is null then admin1 := owner; end if;

  -- Set roles
  update profiles set role = 'proprietor' where id = owner;
  update profiles set role = 'customer'   where id in (cust1, cust2) and id != owner;
  update profiles set role = 'admin'      where id = admin1 and id != owner;

  -- ============================================================
  -- CLEANUP  (delete previous seed data so script is re-runnable)
  -- Order matters: delete children before parents
  -- ============================================================
  delete from notifications     where related_id in (bk1,bk2,bk3,bk4,bk5,bk6,bk7,bk8,bk9,bk10,bk11,bk12,bk13,bk14,bk15,rv1,rv2,rv3,rv4,rv5,rv6,rv7,rv8,rv9,rv10,tk1,tk2,tk3,tk4,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from ticket_messages   where ticket_id  in (tk1,tk2,tk3,tk4);
  delete from support_tickets   where id         in (tk1,tk2,tk3,tk4);
  delete from payouts           where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from transactions      where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from favorites         where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12)
                                   or user_id in (owner, cust1, cust2);
  delete from reviews           where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from pet_service_history where pet_id    in (pet1,pet2,pet3,pet4,pet5,pet6,pet7,pet8);
  delete from bookings          where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from pets              where id          in (pet1,pet2,pet3,pet4,pet5,pet6,pet7,pet8);
  delete from property_services where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from property_legal    where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from property_pricing  where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from property_amenities where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from property_setup    where property_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from properties        where id          in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12);
  delete from amenities; -- will be re-inserted

  -- ============================================================
  -- PROPERTIES  (12 listings across PH cities)
  -- ============================================================
  insert into properties (id, owner_id, status, name, property_type, address, city, zip_code, latitude, longitude, phone, website, description, capacity, pet_types_accepted, dog_sizes, facilities_amenities, images, cover_image, rating, review_count)
  values
    -- 1. Hotel in Makati
    (p1, owner, 'approved',
     'PawPalace Makati',
     '{hotel}',
     '123 Ayala Avenue, Legazpi Village', 'Makati', '1229',
     14.5547, 121.0244,
     '+63 917 123 4567', 'https://pawpalace.ph',
     'Luxury pet hotel in the heart of Makati. Air-conditioned suites, 24/7 CCTV monitoring, and a dedicated play area for your fur babies. Perfect for business travelers who need premium care for their pets.',
     30,
     '{Dog,Cat}', '{Small,Medium,Large}',
     '{Air Conditioning,CCTV Monitoring,Play Area,Grooming Station,Swimming Pool,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1601758228041-f3b2795255f1,https://images.unsplash.com/photo-1548199973-03cce0bbc87b,https://images.unsplash.com/photo-1587300003388-59208cc962cb}',
     'https://images.unsplash.com/photo-1601758228041-f3b2795255f1',
     4.8, 124),

    -- 2. Grooming in BGC
    (p2, owner, 'approved',
     'Fur & Fresh Grooming Studio',
     '{grooming}',
     'Unit 5, High Street South Corporate Plaza', 'Taguig', '1634',
     14.5494, 121.0509,
     '+63 918 234 5678', null,
     'Premium grooming studio in BGC. We specialize in breed-specific cuts, spa treatments, and organic shampoos. Walk-ins welcome! Our groomers are internationally certified.',
     null,
     '{Dog,Cat}', '{Small,Medium,Large,Giant}',
     '{Air Conditioning,Grooming Station,Waiting Lounge,Parking}',
     '{https://images.unsplash.com/photo-1516734212186-a967f81ad0d7,https://images.unsplash.com/photo-1625794084867-8ddd239946b1}',
     'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7',
     4.6, 89),

    -- 3. Veterinary in Quezon City
    (p3, owner, 'approved',
     'VetCare QC Animal Clinic',
     '{veterinary}',
     '45 Tomas Morato Avenue', 'Quezon City', '1103',
     14.6340, 121.0347,
     '+63 919 345 6789', 'https://vetcareqc.com',
     'Full-service veterinary clinic with modern diagnostic equipment. Emergency services available 24/7. Our team of licensed veterinarians provides compassionate care for dogs, cats, and exotic pets.',
     null,
     '{Dog,Cat,Bird,Rabbit}', '{Small,Medium,Large,Giant}',
     '{Air Conditioning,X-Ray,Laboratory,Surgery Room,Pharmacy,Emergency Room,Parking}',
     '{https://images.unsplash.com/photo-1629909613654-28e377c37b09,https://images.unsplash.com/photo-1612531386530-97d24dae0606,https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def}',
     'https://images.unsplash.com/photo-1629909613654-28e377c37b09',
     4.9, 203),

    -- 4. Hotel + Grooming combo in Pasig
    (p4, owner, 'approved',
     'Happy Tails Pet Resort & Spa',
     '{hotel,grooming}',
     '88 Ortigas Avenue Extension', 'Pasig', '1600',
     14.5876, 121.0614,
     '+63 920 456 7890', 'https://happytails.ph',
     'Full-service pet resort combining hotel boarding with professional grooming. Spacious rooms, daily playtime, webcam access for pet parents, and a full grooming menu. Your pet deserves a vacation too!',
     50,
     '{Dog,Cat}', '{Small,Medium,Large}',
     '{Air Conditioning,CCTV Monitoring,Play Area,Grooming Station,Webcam Access,Outdoor Space,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1450778869180-e20bdf9ba668,https://images.unsplash.com/photo-1583511655857-d19b40a7a54e,https://images.unsplash.com/photo-1548199973-03cce0bbc87b}',
     'https://images.unsplash.com/photo-1450778869180-e20bdf9ba668',
     4.7, 156),

    -- 5. Hotel + Veterinary in Cebu
    (p5, owner, 'approved',
     'Island Paws Pet Hotel & Clinic',
     '{hotel,veterinary}',
     '12 Mango Avenue, Capitol Site', 'Cebu City', '6000',
     10.3157, 123.8854,
     '+63 921 567 8901', 'https://islandpaws.ph',
     'Cebu''s premier pet hotel with an in-house veterinary clinic. Your pets get daily health checks during their stay. We offer boarding, check-ups, vaccinations, and emergency care — all under one roof.',
     25,
     '{Dog,Cat,Rabbit}', '{Small,Medium,Large}',
     '{Air Conditioning,CCTV Monitoring,Veterinary Clinic,Play Area,Garden,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd,https://images.unsplash.com/photo-1587300003388-59208cc962cb}',
     'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd',
     4.5, 78),

    -- 6. All-in-one in Manila
    (p6, owner, 'approved',
     'Pet Central Manila',
     '{hotel,grooming,veterinary}',
     '567 España Boulevard, Sampaloc', 'Manila', '1008',
     14.6091, 120.9893,
     '+63 922 678 9012', 'https://petcentral.ph',
     'The complete pet care destination in Manila. Boarding suites, grooming salon, and veterinary clinic all in one location. We also have a pet supply shop on-site. Open 7 days a week!',
     40,
     '{Dog,Cat,Bird,Rabbit}', '{Small,Medium,Large,Giant}',
     '{Air Conditioning,CCTV Monitoring,Play Area,Grooming Station,Veterinary Clinic,Pet Shop,Parking,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1548199973-03cce0bbc87b,https://images.unsplash.com/photo-1583337130417-13104dec14a6,https://images.unsplash.com/photo-1629909615184-74f495363b67}',
     'https://images.unsplash.com/photo-1548199973-03cce0bbc87b',
     4.4, 201),

    -- 7. Grooming in Davao
    (p7, owner, 'approved',
     'Bark & Bubbles Davao',
     '{grooming}',
     '23 Torres Street, Poblacion District', 'Davao City', '8000',
     7.0731, 125.6128,
     '+63 923 789 0123', null,
     'Davao''s favorite pet grooming salon. We offer full grooming, flea treatment, teeth cleaning, and nail trimming. Special packages for regular customers. Cat grooming specialists on staff!',
     null,
     '{Dog,Cat}', '{Small,Medium,Large}',
     '{Air Conditioning,Grooming Station,Waiting Lounge}',
     '{https://images.unsplash.com/photo-1625794084867-8ddd239946b1,https://images.unsplash.com/photo-1516734212186-a967f81ad0d7}',
     'https://images.unsplash.com/photo-1625794084867-8ddd239946b1',
     4.3, 67),

    -- 8. Hotel in Tagaytay
    (p8, owner, 'approved',
     'Cool Paws Tagaytay',
     '{hotel}',
     '88 Aguinaldo Highway, Mahogany Market Area', 'Tagaytay', '4120',
     14.1153, 120.9621,
     '+63 924 890 1234', 'https://coolpaws.ph',
     'Pet boarding with a view! Nestled in cool Tagaytay, our facility offers spacious outdoor play areas surrounded by nature. Perfect for pets who love the outdoors. Cool climate means happy pets!',
     20,
     '{Dog,Cat}', '{Small,Medium,Large,Giant}',
     '{Outdoor Space,Play Area,CCTV Monitoring,Garden,Hiking Trail,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1587300003388-59208cc962cb,https://images.unsplash.com/photo-1601758228041-f3b2795255f1}',
     'https://images.unsplash.com/photo-1587300003388-59208cc962cb',
     4.7, 92),

    -- 9. Grooming + Veterinary in Antipolo
    (p9, owner, 'approved',
     'PetWell Antipolo',
     '{grooming,veterinary}',
     '10 Sumulong Highway, Masinag', 'Antipolo', '1870',
     14.5886, 121.1215,
     '+63 925 901 2345', null,
     'Combined grooming and veterinary services in Antipolo. Get your pet groomed and have their annual check-up in one visit! We offer vaccination packages, dental cleaning, and breed-specific grooming.',
     null,
     '{Dog,Cat,Rabbit}', '{Small,Medium,Large}',
     '{Air Conditioning,Grooming Station,Veterinary Clinic,Laboratory,Parking}',
     '{https://images.unsplash.com/photo-1629909613654-28e377c37b09,https://images.unsplash.com/photo-1625794084867-8ddd239946b1}',
     'https://images.unsplash.com/photo-1629909613654-28e377c37b09',
     4.6, 45),

    -- 10. Hotel in Baguio
    (p10, owner, 'approved',
     'Pine Paws Baguio',
     '{hotel}',
     '15 Session Road', 'Baguio', '2600',
     16.4023, 120.5960,
     '+63 926 012 3456', null,
     'Cool mountain boarding for your furry friends! Located along Session Road, our pet hotel offers heated rooms during cold months, daily walks in Burnham Park, and homemade pet meals. A true mountain retreat.',
     15,
     '{Dog,Cat}', '{Small,Medium,Large}',
     '{Heated Rooms,Play Area,Garden,Daily Walks,Homemade Meals,CCTV Monitoring}',
     '{https://images.unsplash.com/photo-1601758228041-f3b2795255f1,https://images.unsplash.com/photo-1583511655857-d19b40a7a54e}',
     'https://images.unsplash.com/photo-1601758228041-f3b2795255f1',
     4.8, 58),

    -- 11. Veterinary in Iloilo
    (p11, owner, 'approved',
     'Ilonggo Pet Clinic',
     '{veterinary}',
     '78 Delgado Street, City Proper', 'Iloilo City', '5000',
     10.6920, 122.5644,
     '+63 927 123 4560', null,
     'Trusted veterinary clinic in Iloilo City since 2018. We handle routine check-ups, vaccinations, surgeries, and emergency cases. Exotic pet care available. Affordable rates for Ilonggo pet parents!',
     null,
     '{Dog,Cat,Bird,Rabbit}', '{Small,Medium,Large,Giant}',
     '{Air Conditioning,X-Ray,Laboratory,Surgery Room,Pharmacy,Parking}',
     '{https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def,https://images.unsplash.com/photo-1629909613654-28e377c37b09}',
     'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def',
     4.5, 112),

    -- 12. Hotel + Grooming in Paranaque
    (p12, owner, 'approved',
     'SouthPaw Pet Lounge',
     '{hotel,grooming}',
     '33 Dr. A. Santos Avenue, Sucat', 'Parañaque', '1700',
     14.4793, 121.0198,
     '+63 928 234 5670', 'https://southpaw.ph',
     'Modern pet lounge near the airport. Ideal for pet parents who travel frequently! We offer overnight boarding, daycare, and a full-service grooming salon. Shuttle service available from NAIA terminals.',
     35,
     '{Dog,Cat}', '{Small,Medium,Large}',
     '{Air Conditioning,CCTV Monitoring,Grooming Station,Play Area,Airport Shuttle,Webcam Access,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1450778869180-e20bdf9ba668,https://images.unsplash.com/photo-1583337130417-13104dec14a6}',
     'https://images.unsplash.com/photo-1450778869180-e20bdf9ba668',
     4.4, 73);


  -- ============================================================
  -- PROPERTY SETUP  (policies, hours, health for each property)
  -- ============================================================
  insert into property_setup (property_id, policies, operating_hours, cancellation_policy, health_safety, emergency_contact, nearest_vet_hospital)
  values
    (p1,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Aggressive dogs require a muzzle during check-in","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Proof of vaccination required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"07:00","dailyCloseTime":"22:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":false,"checkInCutoff":"20:00","pickupStart":"07:00","pickupEnd":"22:00"}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱300","noShow":"₱500"}'::jsonb,
     '{Vaccination Required,Anti-Rabies Certificate,Regular Sanitization,Individual Kennels}',
     '+63 917 123 4567',
     'Makati Veterinary Clinic - 5 min away'),

    (p2,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Aggressive pets must be accompanied by owner","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":false,"weeklyHours":{"Monday":{"open":"09:00","close":"19:00"},"Tuesday":{"open":"09:00","close":"19:00"},"Wednesday":{"open":"09:00","close":"19:00"},"Thursday":{"open":"09:00","close":"19:00"},"Friday":{"open":"09:00","close":"20:00"},"Saturday":{"open":"08:00","close":"20:00"},"Sunday":{"open":"10:00","close":"17:00"}},"weekendAvailability":true,"holidayAvailability":false,"appointmentOnly":"walk-ins"}'::jsonb,
     '{"freeCancellation":"12hours","lateFee":"₱150","noShow":"₱300"}'::jsonb,
     '{Regular Sanitization,Sterilized Tools,Hypoallergenic Products Available}',
     '+63 918 234 5678',
     'BGC Animal Clinic - 3 min away'),

    (p3,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Sedation available for aggressive pets","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"08:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":true,"appointmentOnly":"both"}'::jsonb,
     '{"freeCancellation":"6hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Licensed Veterinarians,Sterile Surgery Room,Modern Diagnostic Equipment,24/7 Emergency Line}',
     '+63 919 345 6789',
     'On-site veterinary facility'),

    (p4,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Assessment required before boarding","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Updated vaccination card required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"06:00","dailyCloseTime":"21:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":false,"checkInCutoff":"19:00","pickupStart":"06:00","pickupEnd":"21:00"}'::jsonb,
     '{"freeCancellation":"48hours","lateFee":"₱250","noShow":"₱600"}'::jsonb,
     '{Vaccination Required,Daily Health Check,CCTV 24/7,Fire Extinguishers,First Aid Kit}',
     '+63 920 456 7890',
     'Pasig Veterinary Hospital - 10 min away'),

    (p5,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Behavioral assessment on arrival","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"We can vaccinate on-site"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"07:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":true,"checkInCutoff":"18:00","pickupStart":"07:00","pickupEnd":"20:00"}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Licensed Vet On-Site,Daily Health Monitoring,Vaccination Required,Sanitized Rooms}',
     '+63 921 567 8901',
     'On-site veterinary clinic'),

    (p6,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Temperament test required","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Vaccination available at our clinic"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"07:00","dailyCloseTime":"21:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":true,"checkInCutoff":"19:00","pickupStart":"07:00","pickupEnd":"21:00"}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱300","noShow":"₱500"}'::jsonb,
     '{Licensed Vet On-Site,24/7 CCTV,Fire Safety,Regular Sanitization,Individual Rooms}',
     '+63 922 678 9012',
     'On-site veterinary clinic'),

    (p7,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Muzzle required for biters","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":false,"weeklyHours":{"Monday":{"open":"08:00","close":"18:00"},"Tuesday":{"open":"08:00","close":"18:00"},"Wednesday":{"open":"08:00","close":"18:00"},"Thursday":{"open":"08:00","close":"18:00"},"Friday":{"open":"08:00","close":"19:00"},"Saturday":{"open":"08:00","close":"19:00"},"Sunday":{"open":"09:00","close":"16:00"}},"weekendAvailability":true,"holidayAvailability":false,"appointmentOnly":"walk-ins"}'::jsonb,
     '{"freeCancellation":"6hours","lateFee":"₱100","noShow":"₱200"}'::jsonb,
     '{Sterilized Tools,Hypoallergenic Shampoo,Clean Facility}',
     '+63 923 789 0123',
     'Davao Veterinary Hospital - 8 min away'),

    (p8,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Temperament assessment on check-in","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Anti-rabies required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"06:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":false,"checkInCutoff":"18:00","pickupStart":"06:00","pickupEnd":"20:00"}'::jsonb,
     '{"freeCancellation":"48hours","lateFee":"₱200","noShow":"₱500"}'::jsonb,
     '{Vaccination Required,Daily Walks,Cool Climate Facility,Fenced Outdoor Area}',
     '+63 924 890 1234',
     'Tagaytay Animal Hospital - 15 min away'),

    (p9,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Owner must be present during grooming","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Vaccination available on-site"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"08:00","dailyCloseTime":"18:00","weekendAvailability":true,"holidayAvailability":false,"emergencyServices":false,"appointmentOnly":"appointments"}'::jsonb,
     '{"freeCancellation":"12hours","lateFee":"₱150","noShow":"₱300"}'::jsonb,
     '{Licensed Vet,Sterilized Tools,Clean Environment,First Aid Kit}',
     '+63 925 901 2345',
     'On-site veterinary services'),

    (p10,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Assessment required","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Vaccination card required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"07:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":false,"checkInCutoff":"18:00","pickupStart":"07:00","pickupEnd":"20:00"}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Vaccination Required,Heated Rooms,Daily Health Check,Secure Fencing}',
     '+63 926 012 3456',
     'Baguio General Hospital Vet Section - 10 min away'),

    (p11,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Sedation available","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"08:00","dailyCloseTime":"19:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":true,"appointmentOnly":"both"}'::jsonb,
     '{"freeCancellation":"6hours","lateFee":"₱150","noShow":"₱300"}'::jsonb,
     '{Licensed Veterinarians,Sterile Surgery Room,X-Ray Machine,In-House Laboratory}',
     '+63 927 123 4560',
     'On-site veterinary facility'),

    (p12,
     '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Assessment during check-in","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Vaccination record required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"06:00","dailyCloseTime":"22:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":false,"checkInCutoff":"20:00","pickupStart":"06:00","pickupEnd":"22:00"}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱250","noShow":"₱500"}'::jsonb,
     '{Vaccination Required,24/7 CCTV,Airport Proximity,Clean Facility,Fire Safety}',
     '+63 928 234 5670',
     'Parañaque Veterinary Clinic - 7 min away');


  -- ============================================================
  -- AMENITIES + PROPERTY_AMENITIES
  -- ============================================================
  insert into amenities (amenity, category, service_types)
  values
    ('Air Conditioning','facility',  '{hotel,grooming,veterinary}'),
    ('CCTV Monitoring','facility',   '{hotel,grooming,veterinary}'),
    ('Play Area','facility',         '{hotel}'),
    ('Grooming Station','facility',  '{hotel,grooming}'),
    ('Swimming Pool','facility',     '{hotel}'),
    ('Pick-up & Drop-off','service', '{hotel,grooming,veterinary}'),
    ('Waiting Lounge','facility',    '{grooming,veterinary}'),
    ('Parking','facility',           '{hotel,grooming,veterinary}'),
    ('X-Ray','medical',              '{veterinary}'),
    ('Laboratory','medical',         '{veterinary}'),
    ('Surgery Room','medical',       '{veterinary}'),
    ('Pharmacy','medical',           '{veterinary}'),
    ('Emergency Room','medical',     '{veterinary}'),
    ('Webcam Access','service',      '{hotel}'),
    ('Outdoor Space','facility',     '{hotel}'),
    ('Garden','facility',            '{hotel}'),
    ('Veterinary Clinic','medical',  '{hotel,veterinary}'),
    ('Pet Shop','service',           '{hotel,grooming,veterinary}'),
    ('Hiking Trail','facility',      '{hotel}'),
    ('Heated Rooms','facility',      '{hotel}'),
    ('Daily Walks','service',        '{hotel}'),
    ('Homemade Meals','service',     '{hotel}'),
    ('Airport Shuttle','service',    '{hotel}')
  on conflict (amenity) do nothing;

  -- Map amenities to properties
  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p1::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','CCTV Monitoring','Play Area','Grooming Station','Swimming Pool','Pick-up & Drop-off'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p2::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','Grooming Station','Waiting Lounge','Parking'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p3::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','X-Ray','Laboratory','Surgery Room','Pharmacy','Emergency Room','Parking'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p4::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','CCTV Monitoring','Play Area','Grooming Station','Webcam Access','Outdoor Space','Pick-up & Drop-off'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p5::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','CCTV Monitoring','Veterinary Clinic','Play Area','Garden','Pick-up & Drop-off'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p6::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','CCTV Monitoring','Play Area','Grooming Station','Veterinary Clinic','Pet Shop','Parking','Pick-up & Drop-off'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p7::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','Grooming Station','Waiting Lounge'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p8::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Outdoor Space','Play Area','CCTV Monitoring','Garden','Hiking Trail','Pick-up & Drop-off'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p9::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','Grooming Station','Veterinary Clinic','Laboratory','Parking'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p10::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Heated Rooms','Play Area','Garden','Daily Walks','Homemade Meals','CCTV Monitoring'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p11::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','X-Ray','Laboratory','Surgery Room','Pharmacy','Parking'
  ]);

  insert into property_amenities (property_id, amenity_id)
  select v.property_id, a.id
  from (values (p12::uuid)) as v(property_id)
  join amenities a on a.amenity = any(array[
    'Air Conditioning','CCTV Monitoring','Grooming Station','Play Area','Airport Shuttle','Webcam Access','Pick-up & Drop-off'
  ]);


  -- ============================================================
  -- PROPERTY PRICING
  -- ============================================================
  insert into property_pricing (property_id, base_services, pet_size_pricing, add_ons, vet_fees, fees_charges, payment_options, pricing_notes)
  values
    -- 1. PawPalace Makati (Hotel)
    (p1,
     '[{"name":"Overnight Stay","priceType":"Fixed price","price":"800","duration":"24h"},{"name":"Daycare","priceType":"Fixed price","price":"400","duration":"12h"}]'::jsonb,
     '{"small":"600","medium":"800","large":"1000","giant":"1200","cats":"500"}'::jsonb,
     '[{"name":"Extra Playtime (1hr)","price":"150","type":"One-time"},{"name":"Premium Meal","price":"200","type":"Per day"},{"name":"Webcam Access","price":"100","type":"Per stay"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱500","latePickup":"₱150/hr","cleaningFee":"₱300"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card","Bank Transfer"],"refundPolicy":"Full refund if cancelled 24hrs before check-in"}'::jsonb,
     'Holiday rates may apply during peak season (December, Holy Week).'),

    -- 2. Fur & Fresh (Grooming)
    (p2,
     '[{"name":"Basic Bath","priceType":"Starts at","price":"350","duration":"1h"},{"name":"Full Grooming","priceType":"Starts at","price":"600","duration":"2h"},{"name":"Breed Cut","priceType":"Starts at","price":"800","duration":"2.5h"}]'::jsonb,
     '{"small":"350","medium":"500","large":"700","giant":"900","cats":"400"}'::jsonb,
     '[{"name":"Flea Treatment","price":"250","type":"One-time"},{"name":"Teeth Cleaning","price":"200","type":"One-time"},{"name":"Nail Art","price":"150","type":"One-time"},{"name":"De-shedding","price":"300","type":"One-time"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"5%","taxes":"Included","noShow":"₱300"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash"],"refundPolicy":"No refund for completed services"}'::jsonb,
     'Prices vary by breed and coat condition. Long-haired breeds may incur additional charges.'),

    -- 3. VetCare QC (Veterinary)
    (p3,
     '[{"name":"General Consultation","priceType":"Fixed price","price":"500","duration":"30min"},{"name":"Vaccination","priceType":"Starts at","price":"300","duration":"15min"},{"name":"Emergency Visit","priceType":"Starts at","price":"1500","duration":"varies"}]'::jsonb,
     '{}'::jsonb,
     '[{"name":"Blood Test","price":"800","type":"One-time"},{"name":"Urinalysis","price":"500","type":"One-time"},{"name":"X-Ray","price":"1200","type":"One-time"}]'::jsonb,
     '{"generalConsult":"500","vaccination":"300","dental":"1500","surgery":"5000","emergency":"2000","spayNeuter":"3500","deworming":"250"}'::jsonb,
     '{"serviceFee":"0%","taxes":"Included"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash","Card"],"refundPolicy":"No refund for completed consultations"}'::jsonb,
     'Emergency services available 24/7 with additional after-hours fee.'),

    -- 4. Happy Tails (Hotel + Grooming)
    (p4,
     '[{"name":"Standard Boarding","priceType":"Fixed price","price":"600","duration":"24h"},{"name":"Deluxe Suite","priceType":"Fixed price","price":"1000","duration":"24h"},{"name":"Full Grooming","priceType":"Starts at","price":"500","duration":"2h"},{"name":"Bath & Blow Dry","priceType":"Starts at","price":"300","duration":"1h"}]'::jsonb,
     '{"small":"500","medium":"600","large":"800","giant":"1000","cats":"450"}'::jsonb,
     '[{"name":"Webcam Access","price":"50","type":"Per day"},{"name":"Extra Walk","price":"100","type":"Per day"},{"name":"Grooming Add-on","price":"200","type":"One-time"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱600","latePickup":"₱100/hr","cleaningFee":"₱200"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card"],"refundPolicy":"Full refund if cancelled 48hrs before check-in"}'::jsonb,
     'Bundle discount: 10% off grooming when combined with 3+ night boarding.'),

    -- 5. Island Paws Cebu (Hotel + Vet)
    (p5,
     '[{"name":"Standard Room","priceType":"Fixed price","price":"500","duration":"24h"},{"name":"Premium Room","priceType":"Fixed price","price":"800","duration":"24h"},{"name":"Consultation","priceType":"Fixed price","price":"400","duration":"30min"}]'::jsonb,
     '{"small":"400","medium":"500","large":"700","cats":"350"}'::jsonb,
     '[{"name":"Daily Health Check","price":"100","type":"Per day"},{"name":"Vaccination","price":"300","type":"One-time"}]'::jsonb,
     '{"generalConsult":"400","vaccination":"300","deworming":"200","dental":"1200"}'::jsonb,
     '{"serviceFee":"8%","taxes":"Included","noShow":"₱400","latePickup":"₱100/hr"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash"],"refundPolicy":"Full refund if cancelled 24hrs before check-in"}'::jsonb,
     'Boarding guests receive free daily health monitoring by our resident vet.'),

    -- 6. Pet Central Manila (All-in-one)
    (p6,
     '[{"name":"Economy Room","priceType":"Fixed price","price":"450","duration":"24h"},{"name":"Standard Room","priceType":"Fixed price","price":"700","duration":"24h"},{"name":"VIP Suite","priceType":"Fixed price","price":"1200","duration":"24h"},{"name":"Full Grooming","priceType":"Starts at","price":"500","duration":"2h"},{"name":"Consultation","priceType":"Fixed price","price":"500","duration":"30min"}]'::jsonb,
     '{"small":"400","medium":"550","large":"750","giant":"950","cats":"400","exotic":"600"}'::jsonb,
     '[{"name":"Premium Meal Plan","price":"150","type":"Per day"},{"name":"Playtime Session","price":"100","type":"Per day"},{"name":"Shuttle Service","price":"300","type":"One-time"}]'::jsonb,
     '{"generalConsult":"500","vaccination":"350","emergency":"2000","dental":"1500","spayNeuter":"4000"}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱500","latePickup":"₱150/hr","cleaningFee":"₱250","holidaySurcharge":"15%"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card","Bank Transfer"],"refundPolicy":"Full refund 24hrs before, 50% within 24hrs"}'::jsonb,
     'Multi-service discount: Book grooming + boarding and get 15% off total.'),

    -- 7. Bark & Bubbles Davao (Grooming)
    (p7,
     '[{"name":"Basic Bath","priceType":"Starts at","price":"250","duration":"45min"},{"name":"Full Grooming","priceType":"Starts at","price":"450","duration":"1.5h"},{"name":"Spa Package","priceType":"Starts at","price":"700","duration":"2h"}]'::jsonb,
     '{"small":"250","medium":"400","large":"550","giant":"700","cats":"300"}'::jsonb,
     '[{"name":"Flea & Tick Treatment","price":"200","type":"One-time"},{"name":"Teeth Brushing","price":"100","type":"One-time"},{"name":"Ear Cleaning","price":"80","type":"One-time"},{"name":"Paw Balm","price":"50","type":"One-time"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"5%","taxes":"Included","noShow":"₱200"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash"],"refundPolicy":"No refund for completed services"}'::jsonb,
     'Loyalty card: Every 10th grooming session is free!'),

    -- 8. Cool Paws Tagaytay (Hotel)
    (p8,
     '[{"name":"Garden View Room","priceType":"Fixed price","price":"700","duration":"24h"},{"name":"Premium Cabin","priceType":"Fixed price","price":"1100","duration":"24h"},{"name":"Daycare","priceType":"Fixed price","price":"350","duration":"12h"}]'::jsonb,
     '{"small":"500","medium":"700","large":"900","giant":"1100","cats":"450"}'::jsonb,
     '[{"name":"Nature Walk","price":"100","type":"Per day"},{"name":"Premium Organic Meal","price":"180","type":"Per day"},{"name":"Photo Update Package","price":"50","type":"Per day"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱500","latePickup":"₱120/hr"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card"],"refundPolicy":"Full refund if cancelled 48hrs before check-in"}'::jsonb,
     'Weekend rates +₱100/night. Long-stay discount: 7+ nights get 10% off.'),

    -- 9. PetWell Antipolo (Grooming + Vet)
    (p9,
     '[{"name":"Bath & Dry","priceType":"Starts at","price":"300","duration":"1h"},{"name":"Full Grooming","priceType":"Starts at","price":"550","duration":"2h"},{"name":"Vet Consultation","priceType":"Fixed price","price":"450","duration":"30min"}]'::jsonb,
     '{"small":"300","medium":"450","large":"600","cats":"350"}'::jsonb,
     '[{"name":"Vaccination","price":"300","type":"One-time"},{"name":"Deworming","price":"200","type":"One-time"},{"name":"Flea Treatment","price":"250","type":"One-time"}]'::jsonb,
     '{"generalConsult":"450","vaccination":"300","deworming":"200","dental":"1200"}'::jsonb,
     '{"serviceFee":"5%","taxes":"Included","noShow":"₱300"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash"],"refundPolicy":"No refund for completed services"}'::jsonb,
     'Combo discount: Grooming + consultation = ₱100 off.'),

    -- 10. Pine Paws Baguio (Hotel)
    (p10,
     '[{"name":"Cozy Room","priceType":"Fixed price","price":"600","duration":"24h"},{"name":"Mountain Suite","priceType":"Fixed price","price":"950","duration":"24h"}]'::jsonb,
     '{"small":"500","medium":"600","large":"800","cats":"400"}'::jsonb,
     '[{"name":"Burnham Park Walk","price":"100","type":"Per day"},{"name":"Homemade Meal","price":"120","type":"Per day"},{"name":"Sweater Rental","price":"50","type":"Per stay"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱400","latePickup":"₱100/hr"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash"],"refundPolicy":"Full refund if cancelled 24hrs before check-in"}'::jsonb,
     'Peak season (Dec-Feb) rates +₱200/night. Panagbenga Festival week fully booked early.'),

    -- 11. Ilonggo Pet Clinic (Veterinary)
    (p11,
     '[{"name":"General Consultation","priceType":"Fixed price","price":"400","duration":"30min"},{"name":"Vaccination Package","priceType":"Starts at","price":"250","duration":"15min"},{"name":"Surgery","priceType":"Starts at","price":"3000","duration":"varies"}]'::jsonb,
     '{}'::jsonb,
     '[{"name":"Blood Work","price":"700","type":"One-time"},{"name":"X-Ray","price":"1000","type":"One-time"},{"name":"Ultrasound","price":"1500","type":"One-time"}]'::jsonb,
     '{"generalConsult":"400","vaccination":"250","dental":"1200","surgery":"3000","emergency":"1500","spayNeuter":"3000","deworming":"200"}'::jsonb,
     '{"serviceFee":"0%","taxes":"Included"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash"],"refundPolicy":"No refund for completed consultations"}'::jsonb,
     'Senior pet (7+ years) wellness package available at ₱1,500.'),

    -- 12. SouthPaw Pet Lounge (Hotel + Grooming)
    (p12,
     '[{"name":"Standard Room","priceType":"Fixed price","price":"650","duration":"24h"},{"name":"Airport Suite","priceType":"Fixed price","price":"1000","duration":"24h"},{"name":"Grooming Package","priceType":"Starts at","price":"500","duration":"2h"}]'::jsonb,
     '{"small":"500","medium":"650","large":"850","cats":"450"}'::jsonb,
     '[{"name":"Airport Shuttle","price":"500","type":"One-time"},{"name":"Webcam Access","price":"50","type":"Per day"},{"name":"Extra Bath","price":"200","type":"One-time"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱500","latePickup":"₱150/hr","cleaningFee":"₱200"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card","Bank Transfer"],"refundPolicy":"Full refund if cancelled 24hrs before check-in"}'::jsonb,
     'Free airport shuttle for 5+ night bookings. Early check-in available upon request.');


  -- ============================================================
  -- PROPERTY LEGAL  (documents & legal agreements per property)
  -- ============================================================
  insert into property_legal (property_id, legal_entity_type, contracting_party, contracting_party_address, lgu_permits, legal_agreements)
  values
    (p1, 'business',
     '{"firstName":"Maria","middleName":"Santos","lastName":"Reyes","email":"maria@pawpalace.ph","phone":"9171234567","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"123 Ayala Avenue","addressLine2":"Legazpi Village","city":"Makati","postalCode":"1229"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p1-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p2, 'business',
     '{"firstName":"Carlos","middleName":"","lastName":"Tan","email":"carlos@furandfresh.ph","phone":"9182345678","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"High Street South Corporate Plaza","addressLine2":"Unit 5","city":"Taguig","postalCode":"1634"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p2-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p3, 'business',
     '{"firstName":"Elena","middleName":"Cruz","lastName":"Garcia","email":"elena@vetcareqc.com","phone":"9193456789","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"45 Tomas Morato Avenue","addressLine2":"","city":"Quezon City","postalCode":"1103"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p3-lgu-permit.pdf,https://storage.pawstay.ph/legal/p3-bai-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p4, 'business',
     '{"firstName":"Jose","middleName":"Lim","lastName":"Santos","email":"jose@happytails.ph","phone":"9204567890","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"88 Ortigas Avenue Extension","addressLine2":"","city":"Pasig","postalCode":"1600"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p4-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p5, 'business',
     '{"firstName":"Anna","middleName":"","lastName":"Villanueva","email":"anna@islandpaws.ph","phone":"9215678901","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"12 Mango Avenue","addressLine2":"Capitol Site","city":"Cebu City","postalCode":"6000"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p5-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p6, 'business',
     '{"firstName":"Ricardo","middleName":"De Leon","lastName":"Mendoza","email":"ricardo@petcentral.ph","phone":"9226789012","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"567 España Boulevard","addressLine2":"Sampaloc","city":"Manila","postalCode":"1008"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p6-lgu-permit.pdf,https://storage.pawstay.ph/legal/p6-bai-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p7, 'individual',
     '{"firstName":"Fatima","middleName":"","lastName":"Abdullah","email":"fatima.grooming@gmail.com","phone":"9237890123","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"23 Torres Street","addressLine2":"Poblacion District","city":"Davao City","postalCode":"8000"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p7-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p8, 'business',
     '{"firstName":"Miguel","middleName":"","lastName":"Bautista","email":"miguel@coolpaws.ph","phone":"9248901234","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"88 Aguinaldo Highway","addressLine2":"Mahogany Market Area","city":"Tagaytay","postalCode":"4120"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p8-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p9, 'individual',
     '{"firstName":"Grace","middleName":"Ramos","lastName":"Dela Cruz","email":"grace.petwell@gmail.com","phone":"9259012345","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"10 Sumulong Highway","addressLine2":"Masinag","city":"Antipolo","postalCode":"1870"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p9-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p10, 'business',
     '{"firstName":"Daniel","middleName":"","lastName":"Dominguez","email":"daniel@pinepaws.ph","phone":"9260123456","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"15 Session Road","addressLine2":"","city":"Baguio","postalCode":"2600"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p10-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p11, 'business',
     '{"firstName":"Patricia","middleName":"","lastName":"Gonzales","email":"patricia@ilonggopet.ph","phone":"9271234560","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"78 Delgado Street","addressLine2":"City Proper","city":"Iloilo City","postalCode":"5000"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p11-lgu-permit.pdf,https://storage.pawstay.ph/legal/p11-bai-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),

    (p12, 'business',
     '{"firstName":"Roberto","middleName":"","lastName":"Cruz","email":"roberto@southpaw.ph","phone":"9282345670","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"33 Dr. A. Santos Avenue","addressLine2":"Sucat","city":"Parañaque","postalCode":"1700"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p12-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb);


  -- ============================================================
  -- PROPERTY SERVICES  (service catalogue items)
  -- ============================================================
  insert into property_services (property_id, name, description, price, category)
  values
    -- PawPalace Makati (Hotel)
    (p1, 'Overnight Boarding',      'Standard air-conditioned room with bedding',       800,  'Boarding'),
    (p1, 'Daycare',                 'Half-day supervised play and care',                400,  'Daycare'),
    (p1, 'Pick-up Service',         'Pet pick-up within Makati area',                   300,  'Transport'),

    -- Fur & Fresh (Grooming)
    (p2, 'Basic Bath & Blow Dry',   'Shampoo, conditioner, blow dry, ear cleaning',     350,  'Grooming'),
    (p2, 'Full Grooming Package',   'Bath, haircut, nail trim, ear cleaning, perfume',  600,  'Grooming'),
    (p2, 'Breed-Specific Cut',      'Professional breed-standard haircut',              800,  'Grooming'),
    (p2, 'Flea & Tick Treatment',   'Medicated bath with flea/tick shampoo',            250,  'Grooming'),

    -- VetCare QC (Veterinary)
    (p3, 'General Consultation',    'Physical exam with licensed veterinarian',          500,  'Veterinary'),
    (p3, 'Vaccination (5-in-1)',    'Core vaccine for dogs',                             300,  'Veterinary'),
    (p3, 'Anti-Rabies Vaccine',     'Annual rabies vaccination',                         250,  'Veterinary'),
    (p3, 'Dental Cleaning',         'Ultrasonic dental scaling under sedation',         1500,  'Veterinary'),
    (p3, 'Spay/Neuter Surgery',     'Sterilization surgery with anesthesia',            3500,  'Veterinary'),

    -- Happy Tails (Hotel + Grooming)
    (p4, 'Standard Boarding',       'Comfortable room with daily feeding',               600,  'Boarding'),
    (p4, 'Deluxe Suite Boarding',   'Spacious suite with premium bedding and toys',     1000,  'Boarding'),
    (p4, 'Full Grooming',           'Complete grooming with breed cut',                  500,  'Grooming'),
    (p4, 'Bath & Blow Dry',         'Quick bath service',                                300,  'Grooming'),

    -- Island Paws Cebu (Hotel + Vet)
    (p5, 'Standard Room Boarding',  'Clean room with garden view',                       500,  'Boarding'),
    (p5, 'Premium Room Boarding',   'Large room with personal play area',                800,  'Boarding'),
    (p5, 'Vet Consultation',        'Check-up with licensed vet',                        400,  'Veterinary'),
    (p5, 'Vaccination',             'Standard vaccination package',                      300,  'Veterinary'),

    -- Pet Central Manila (All-in-one)
    (p6, 'Economy Boarding',        'Basic room with regular feeding schedule',           450,  'Boarding'),
    (p6, 'Standard Boarding',       'Comfortable room with play sessions',                700,  'Boarding'),
    (p6, 'VIP Suite',               'Premium suite with webcam and premium meals',       1200,  'Boarding'),
    (p6, 'Full Grooming',           'Head-to-tail grooming service',                      500,  'Grooming'),
    (p6, 'Vet Consultation',        'General health check-up',                            500,  'Veterinary'),

    -- Bark & Bubbles Davao (Grooming)
    (p7, 'Basic Bath',              'Shampoo, rinse, blow dry',                           250,  'Grooming'),
    (p7, 'Full Grooming',           'Bath, haircut, nails, ears, perfume',                450,  'Grooming'),
    (p7, 'Spa Package',             'Full grooming + massage + paw treatment',            700,  'Grooming'),

    -- Cool Paws Tagaytay (Hotel)
    (p8, 'Garden View Room',        'Room overlooking the garden with fresh mountain air', 700,  'Boarding'),
    (p8, 'Premium Cabin',           'Heated cabin for extra comfort during cold nights',  1100,  'Boarding'),
    (p8, 'Daycare',                 'Half-day care with outdoor activities',               350,  'Daycare'),

    -- PetWell Antipolo (Grooming + Vet)
    (p9, 'Bath & Dry',              'Standard bath with blow dry',                        300,  'Grooming'),
    (p9, 'Full Grooming',           'Complete grooming service',                          550,  'Grooming'),
    (p9, 'Vet Consultation',        'General check-up and assessment',                    450,  'Veterinary'),
    
    -- Pine Paws Baguio (Hotel)
    (p10, 'Cozy Room',              'Warm room with heating for cold Baguio nights',      600,  'Boarding'),
    (p10, 'Mountain Suite',         'Premium heated suite with mountain ambiance',         950,  'Boarding'),

    -- Ilonggo Pet Clinic (Veterinary)
    (p11, 'General Consultation',   'Complete physical examination',                      400,  'Veterinary'),
    (p11, 'Vaccination Package',    'Core vaccines for dogs and cats',                    250,  'Veterinary'),
    (p11, 'Emergency Visit',        'Urgent care and stabilization',                     1500,  'Veterinary'),

    -- SouthPaw Pet Lounge (Hotel + Grooming)
    (p12, 'Standard Room',          'Comfortable room near airport',                      650,  'Boarding'),
    (p12, 'Airport Suite',          'Premium room with shuttle included for 5+ nights',  1000,  'Boarding'),
    (p12, 'Grooming Package',       'Full grooming while your pet boards',                500,  'Grooming');

  -- Capture some service IDs for bookings
  select id into svc_p1_boarding from property_services where property_id = p1 and name = 'Overnight Boarding' limit 1;
  select id into svc_p2_grooming from property_services where property_id = p2 and name = 'Full Grooming Package' limit 1;
  select id into svc_p3_consult  from property_services where property_id = p3 and name = 'General Consultation' limit 1;
  select id into svc_p4_boarding from property_services where property_id = p4 and name = 'Standard Boarding' limit 1;
  select id into svc_p6_vip      from property_services where property_id = p6 and name = 'VIP Suite' limit 1;

  -- ============================================================
  -- PETS  (user pet profiles)
  -- ============================================================
  insert into pets (id, owner_id, name, species, breed, age, weight, photo_url, notes)
  values
    -- Customer 1's pets
    (pet1, cust1, 'Brownie',    'Dog', 'Golden Retriever',  3.0, 28.5,
     'https://images.unsplash.com/photo-1633722715463-d30f4f325e24',
     'Friendly and loves water. Allergic to chicken.'),
    (pet2, cust1, 'Mochi',      'Cat', 'Scottish Fold',     2.0,  4.2,
     'https://images.unsplash.com/photo-1574158622682-e40e69881006',
     'Indoor cat, can be shy around other animals.'),
    (pet3, cust1, 'Thor',       'Dog', 'Siberian Husky',    4.5, 25.0,
     'https://images.unsplash.com/photo-1605568427561-40dd23c2acea',
     'Very energetic. Needs lots of exercise. Loves cold weather.'),
    (pet4, cust1, 'Kiwi',       'Bird', 'Cockatiel',        1.5,  0.1,
     null,
     'Talks a lot! Needs special seed mix.'),

    -- Customer 2's pets
    (pet5, cust2, 'Luna',       'Dog', 'Shih Tzu',          5.0,  6.5,
     'https://images.unsplash.com/photo-1587300003388-59208cc962cb',
     'Senior-ish dog, very calm. Requires dental care.'),
    (pet6, cust2, 'Biscuit',    'Dog', 'Beagle',            2.0, 12.0,
     'https://images.unsplash.com/photo-1505628346881-b72b27e84530',
     'Very curious, loves treats. No food allergies.'),
    (pet7, cust2, 'Whiskers',   'Cat', 'Persian',           6.0,  5.0,
     'https://images.unsplash.com/photo-1573865526739-10659fec78a5',
     'Long-haired, needs regular grooming. Hates car rides.'),
    (pet8, cust2, 'Coco',       'Rabbit', 'Holland Lop',    1.0,  1.8,
     null,
     'Very friendly. Needs hay-based diet.');


  -- ============================================================
  -- BOOKINGS  (15 bookings across various properties & statuses)
  -- ============================================================
  insert into bookings (id, property_id, user_id, pet_id, service_id, checkin, checkout, time_slot, pet_name, pet_type, pet_breed, pet_age, pet_weight, special_requirements, service_name, service_type, owner_name, owner_email, owner_phone, emergency_contact, subtotal, service_fee, total_price, payment_method, payment_status, paid_at, room_name, status, notes)
  values
    -- bk1: Completed hotel stay at PawPalace Makati
    (bk1, p1, cust1, pet1, svc_p1_boarding,
     '2025-12-15', '2025-12-18', null,
     'Brownie', 'Dog', 'Golden Retriever', '3 years', '28.5 kg',
     'Allergic to chicken — please use fish-based meals',
     'Overnight Boarding', 'boarding',
     'Customer One', 'customer1@email.com', '+63 917 111 1111', '+63 918 999 9999',
     2400.00, 240.00, 2640.00,
     'gcash', 'paid', '2025-12-15 08:00:00+08',
     'Standard Room', 'completed',
     '3-night stay. Dog was very well behaved.'),

    -- bk2: Completed grooming at Fur & Fresh
    (bk2, p2, cust1, pet2, svc_p2_grooming,
     '2025-12-20', null, '10:00',
     'Mochi', 'Cat', 'Scottish Fold', '2 years', '4.2 kg',
     'Very shy, please handle gently',
     'Full Grooming Package', 'grooming',
     'Customer One', 'customer1@email.com', '+63 917 111 1111', '+63 918 999 9999',
     600.00, 30.00, 630.00,
     'cash', 'paid', '2025-12-20 10:00:00+08',
     null, 'completed',
     'Cat grooming — extra gentle handling requested.'),

    -- bk3: Completed vet visit at VetCare QC
    (bk3, p3, cust2, pet5, svc_p3_consult,
     '2025-12-22', null, '14:00',
     'Luna', 'Dog', 'Shih Tzu', '5 years', '6.5 kg',
     'Annual check-up and dental assessment',
     'General Consultation', 'veterinary',
     'Customer Two', 'customer2@email.com', '+63 919 222 2222', '+63 920 888 8888',
     500.00, 0.00, 500.00,
     'card', 'paid', '2025-12-22 14:00:00+08',
     null, 'completed',
     'Routine annual check-up. Vet recommended dental cleaning.'),

    -- bk4: Completed boarding at Happy Tails
    (bk4, p4, cust2, pet6, svc_p4_boarding,
     '2026-01-02', '2026-01-05', null,
     'Biscuit', 'Dog', 'Beagle', '2 years', '12 kg',
     'Loves treats — limit to 3/day please',
     'Standard Boarding', 'boarding',
     'Customer Two', 'customer2@email.com', '+63 919 222 2222', '+63 920 888 8888',
     1800.00, 180.00, 1980.00,
     'gcash', 'paid', '2026-01-02 06:30:00+08',
     'Standard Room', 'completed',
     '3-night boarding over New Year.'),

    -- bk5: Confirmed upcoming booking at PawPalace
    (bk5, p1, cust2, pet5, svc_p1_boarding,
     '2026-02-14', '2026-02-16', null,
     'Luna', 'Dog', 'Shih Tzu', '5 years', '6.5 kg',
     'Needs medication at 8am and 8pm',
     'Overnight Boarding', 'boarding',
     'Customer Two', 'customer2@email.com', '+63 919 222 2222', '+63 920 888 8888',
     1600.00, 160.00, 1760.00,
     'card', 'paid', '2026-02-10 10:00:00+08',
     'Standard Room', 'confirmed',
     'Valentine''s weekend stay. Please administer medication.'),

    -- bk6: Pending grooming appointment at Bark & Bubbles
    (bk6, p7, cust1, pet1, null,
     '2026-02-20', null, '09:00',
     'Brownie', 'Dog', 'Golden Retriever', '3 years', '28.5 kg',
     'Full bath with de-shedding treatment',
     'Full Grooming', 'grooming',
     'Customer One', 'customer1@email.com', '+63 917 111 1111', '+63 918 999 9999',
     550.00, 27.50, 577.50,
     null, 'unpaid', null,
     null, 'pending',
     null),

    -- bk7: Confirmed vet appointment at VetCare QC
    (bk7, p3, cust1, pet3, svc_p3_consult,
     '2026-02-25', null, '11:00',
     'Thor', 'Dog', 'Siberian Husky', '4.5 years', '25 kg',
     'Annual vaccination and check-up',
     'General Consultation', 'veterinary',
     'Customer One', 'customer1@email.com', '+63 917 111 1111', '+63 918 999 9999',
     500.00, 0.00, 500.00,
     'gcash', 'paid', '2026-02-20 15:00:00+08',
     null, 'confirmed',
     'Annual 5-in-1 vaccination due.'),

    -- bk8: Checked-in at Cool Paws Tagaytay
    (bk8, p8, cust1, pet1, null,
     '2026-02-10', '2026-02-13', null,
     'Brownie', 'Dog', 'Golden Retriever', '3 years', '28.5 kg',
     'Loves outdoor activities',
     'Garden View Room', 'boarding',
     'Customer One', 'customer1@email.com', '+63 917 111 1111', '+63 918 999 9999',
     2100.00, 210.00, 2310.00,
     'card', 'paid', '2026-02-09 14:00:00+08',
     'Garden View Room', 'checked_in',
     'Currently staying. Enjoying the cool Tagaytay weather!'),

    -- bk9: Completed VIP stay at Pet Central
    (bk9, p6, cust2, pet7, svc_p6_vip,
     '2025-11-20', '2025-11-23', null,
     'Whiskers', 'Cat', 'Persian', '6 years', '5 kg',
     'Long-haired cat — brush daily. Indoor only.',
     'VIP Suite', 'boarding',
     'Customer Two', 'customer2@email.com', '+63 919 222 2222', '+63 920 888 8888',
     3600.00, 360.00, 3960.00,
     'bank_transfer', 'paid', '2025-11-19 10:00:00+08',
     'VIP Suite', 'completed',
     '3-night VIP stay with daily grooming add-on.'),

    -- bk10: Cancelled booking
    (bk10, p10, cust1, pet3, null,
     '2026-01-10', '2026-01-13', null,
     'Thor', 'Dog', 'Siberian Husky', '4.5 years', '25 kg',
     'Loves cold weather — perfect for Baguio',
     'Mountain Suite', 'boarding',
     'Customer One', 'customer1@email.com', '+63 917 111 1111', '+63 918 999 9999',
     2850.00, 285.00, 3135.00,
     'gcash', 'refunded', null,
     'Mountain Suite', 'cancelled',
     null),

    -- bk11: Completed grooming at PetWell Antipolo
    (bk11, p9, cust2, pet5, null,
     '2026-01-15', null, '10:00',
     'Luna', 'Dog', 'Shih Tzu', '5 years', '6.5 kg',
     'Regular grooming + vet consultation combo',
     'Full Grooming', 'grooming',
     'Customer Two', 'customer2@email.com', '+63 919 222 2222', '+63 920 888 8888',
     550.00, 27.50, 577.50,
     'cash', 'paid', '2026-01-15 10:00:00+08',
     null, 'completed',
     'Combo grooming + vet visit. Luna was a good girl.'),

    -- bk12: Completed boarding at SouthPaw
    (bk12, p12, cust1, pet2, null,
     '2025-12-28', '2025-12-30', null,
     'Mochi', 'Cat', 'Scottish Fold', '2 years', '4.2 kg',
     'Keep in quiet area away from dogs',
     'Standard Room', 'boarding',
     'Customer One', 'customer1@email.com', '+63 917 111 1111', '+63 918 999 9999',
     1300.00, 130.00, 1430.00,
     'gcash', 'paid', '2025-12-27 16:00:00+08',
     'Standard Room', 'completed',
     'Pre-New Year boarding while owner traveled.'),

    -- bk13: No-show booking
    (bk13, p2, cust2, pet6, svc_p2_grooming,
     '2026-01-08', null, '14:00',
     'Biscuit', 'Dog', 'Beagle', '2 years', '12 kg',
     null,
     'Full Grooming Package', 'grooming',
     'Customer Two', 'customer2@email.com', '+63 919 222 2222', '+63 920 888 8888',
     600.00, 30.00, 630.00,
     'gcash', 'paid', '2026-01-07 09:00:00+08',
     null, 'no_show',
     'Customer did not show up for appointment.'),

    -- bk14: Completed vet visit for rabbit
    (bk14, p11, cust2, pet8, null,
     '2026-01-20', null, '09:00',
     'Coco', 'Rabbit', 'Holland Lop', '1 year', '1.8 kg',
     'First vet visit — rabbit wellness check',
     'General Consultation', 'veterinary',
     'Customer Two', 'customer2@email.com', '+63 919 222 2222', '+63 920 888 8888',
     400.00, 0.00, 400.00,
     'cash', 'paid', '2026-01-20 09:00:00+08',
     null, 'completed',
     'Rabbit wellness check. Healthy overall, slight overgrown nails trimmed.'),

    -- bk15: Pending future booking at Island Paws Cebu
    (bk15, p5, cust1, pet1, null,
     '2026-03-01', '2026-03-04', null,
     'Brownie', 'Dog', 'Golden Retriever', '3 years', '28.5 kg',
     'Allergic to chicken',
     'Premium Room Boarding', 'boarding',
     'Customer One', 'customer1@email.com', '+63 917 111 1111', '+63 918 999 9999',
     2400.00, 192.00, 2592.00,
     null, 'unpaid', null,
     'Premium Room', 'pending',
     'Cebu vacation — requesting fish-based meals.');


  -- ============================================================
  -- PET SERVICE HISTORY  (grooming/vet records)
  -- ============================================================
  insert into pet_service_history (pet_id, booking_id, service_type, service_name, performed_at, notes)
  values
    (pet2, bk2,  'grooming',    'Full Grooming Package',       '2025-12-20', 'Full bath, brush, nail trim. Cat was cooperative.'),
    (pet5, bk3,  'checkup',     'Annual Health Check-up',      '2025-12-22', 'Overall healthy. Mild tartar buildup — dental cleaning recommended in 3 months.'),
    (pet1, bk1,  'grooming',    'Complimentary Bath on Checkout', '2025-12-18', 'Quick bath before checkout at PawPalace.'),
    (pet6, bk4,  'grooming',    'Basic Bath During Stay',      '2026-01-04', 'Mid-stay bath at Happy Tails.'),
    (pet7, bk9,  'grooming',    'Daily Brushing',              '2025-11-21', 'Persian cat daily coat maintenance during VIP stay.'),
    (pet7, bk9,  'grooming',    'Daily Brushing',              '2025-11-22', 'Continued daily coat care.'),
    (pet5, bk11, 'grooming',    'Full Grooming',               '2026-01-15', 'Complete grooming at PetWell Antipolo. Looks great!'),
    (pet5, bk11, 'checkup',     'General Check-up',            '2026-01-15', 'Quick health assessment as part of combo package. All good.'),
    (pet8, bk14, 'checkup',     'Rabbit Wellness Check',       '2026-01-20', 'Weight normal, teeth good, nails trimmed. Next visit in 6 months.'),
    (pet1, null, 'vaccination', 'Anti-Rabies Vaccine',         '2025-06-15', 'Annual rabies vaccination. Next due: June 2026.'),
    (pet1, null, 'vaccination', '5-in-1 Vaccine',              '2025-06-15', 'DHPP vaccine booster. Next due: June 2026.'),
    (pet3, null, 'vaccination', 'Anti-Rabies Vaccine',         '2025-08-10', 'Annual rabies vaccination. Next due: August 2026.'),
    (pet5, null, 'dental',      'Dental Cleaning',             '2025-09-05', 'Ultrasonic scaling at local vet. Teeth in good condition after cleaning.'),
    (pet6, null, 'vaccination', 'Anti-Rabies Vaccine',         '2025-07-20', 'Annual rabies shot. Next due: July 2026.');


  -- ============================================================
  -- REVIEWS  (10 reviews with some owner replies)
  -- ============================================================
  insert into reviews (id, property_id, user_id, booking_id, pet_name, service_type, rating, comment, reply, replied_at)
  values
    (rv1, p1, cust1, bk1, 'Brownie', 'boarding', 5,
     'Absolutely fantastic! Brownie was so happy when we picked him up. The staff sent us daily photo updates and his room was spotless. Will definitely book again!',
     'Thank you so much! We loved having Brownie. He was such a good boy! See you next time! 🐾',
     '2025-12-19 10:00:00+08'),

    (rv2, p2, cust1, bk2, 'Mochi', 'grooming', 4,
     'Mochi looked beautiful after the grooming session. The groomers were patient with her since she is quite shy. Only reason for 4 stars is the 15-minute wait past our appointment time.',
     'Thank you for your feedback! We apologize for the wait. We''ll work on keeping to schedule. Mochi was a pleasure to groom!',
     '2025-12-21 09:00:00+08'),

    (rv3, p3, cust2, bk3, 'Luna', 'veterinary', 5,
     'Dr. Garcia was incredibly thorough and gentle with Luna. She explained everything clearly and didn''t push unnecessary treatments. The clinic is clean and modern. Highly recommend!',
     null, null),

    (rv4, p4, cust2, bk4, 'Biscuit', 'boarding', 5,
     'Happy Tails lived up to its name! Biscuit had an amazing time. The webcam was a great feature — we could check on him anytime. Staff followed our treat limit instructions perfectly.',
     'We''re thrilled Biscuit enjoyed his stay! He was such a playful guest. The webcam is everyone''s favorite feature! 😊',
     '2026-01-06 08:30:00+08'),

    (rv5, p6, cust2, bk9, 'Whiskers', 'boarding', 4,
     'The VIP Suite was impressive — very spacious and clean. Whiskers seemed comfortable, which is rare for her in new environments. Daily grooming was a nice touch. Slightly pricey but worth it for the peace of mind.',
     null, null),

    (rv6, p9, cust2, bk11, 'Luna', 'grooming', 5,
     'Love the combo deal! Got Luna groomed and had her check-up in one visit. Super convenient. The staff at PetWell are friendly and professional. Luna looked amazing after!',
     'Thank you! We designed the combo package for busy pet parents like you. Luna is always a joy to work with! 💛',
     '2026-01-16 11:00:00+08'),

    (rv7, p12, cust1, bk12, 'Mochi', 'boarding', 4,
     'Convenient location near the airport. Room was clean and Mochi was well taken care of. The shuttle service is a great perk. Only wish they had a separate section for cats — Mochi was a bit stressed hearing dogs.',
     'Thanks for the honest review! We are actually planning a dedicated cat wing opening Q2 2026. Hope to see you and Mochi again!',
     '2025-12-31 14:00:00+08'),

    (rv8, p11, cust2, bk14, 'Coco', 'veterinary', 5,
     'So happy to find a vet clinic in Iloilo that handles rabbits! Dr. Gonzales was knowledgeable and gentle. Coco was calm throughout. Very affordable too.',
     null, null),

    (rv9, p2, cust2, bk13, 'Biscuit', 'grooming', 2,
     'Booked and paid but couldn''t make it due to an emergency. Was charged a no-show fee which I understand, but wish there was more flexibility for first-time incidents.',
     'We''re sorry about the situation. Our no-show policy is in place to protect our groomers'' time, but we understand emergencies happen. Please contact us directly and we''ll work something out for your next visit.',
     '2026-01-09 10:00:00+08'),

    (rv10, p8, cust1, null, null, 'boarding', 5,
     'Best pet hotel experience ever! The Tagaytay air was perfect for our dog. Beautiful garden, friendly staff, and the nature walks were a huge bonus. Already planning our next visit!',
     'We''re so glad you and your fur baby loved it here! Tagaytay weather is always a hit with our guests. Can''t wait to have you back! 🏔️🐕',
     '2026-02-11 08:00:00+08');


  -- ============================================================
  -- FAVORITES  (user wishlists)
  -- ============================================================
  insert into favorites (user_id, property_id)
  values
    (cust1, p1),   -- Customer 1 favorites PawPalace Makati
    (cust1, p4),   -- Customer 1 favorites Happy Tails
    (cust1, p8),   -- Customer 1 favorites Cool Paws Tagaytay
    (cust1, p10),  -- Customer 1 favorites Pine Paws Baguio
    (cust1, p5),   -- Customer 1 favorites Island Paws Cebu
    (cust2, p1),   -- Customer 2 favorites PawPalace Makati
    (cust2, p3),   -- Customer 2 favorites VetCare QC
    (cust2, p6),   -- Customer 2 favorites Pet Central Manila
    (cust2, p9),   -- Customer 2 favorites PetWell Antipolo
    (cust2, p11),  -- Customer 2 favorites Ilonggo Pet Clinic
    (cust2, p12)   -- Customer 2 favorites SouthPaw
  on conflict (user_id, property_id) do nothing;


  -- ============================================================
  -- TRANSACTIONS  (payment ledger)
  -- ============================================================
  insert into transactions (id, booking_id, property_id, user_id, transaction_type, amount, platform_fee, net_amount, status, payment_method, reference_id)
  values
    (tx1,  bk1,  p1,  cust1, 'booking', 2640.00, 264.00, 2376.00, 'completed', 'gcash',         'GCASH-20251215-001'),
    (tx2,  bk2,  p2,  cust1, 'booking',  630.00,  31.50,  598.50, 'completed', 'cash',          'CASH-20251220-001'),
    (tx3,  bk3,  p3,  cust2, 'booking',  500.00,  25.00,  475.00, 'completed', 'card',          'CARD-20251222-001'),
    (tx4,  bk4,  p4,  cust2, 'booking', 1980.00, 198.00, 1782.00, 'completed', 'gcash',         'GCASH-20260102-001'),
    (tx5,  bk5,  p1,  cust2, 'booking', 1760.00, 176.00, 1584.00, 'completed', 'card',          'CARD-20260210-001'),
    (tx6,  bk9,  p6,  cust2, 'booking', 3960.00, 396.00, 3564.00, 'completed', 'bank_transfer', 'BT-20251119-001'),
    (tx7,  bk10, p10, cust1, 'refund',  3135.00,   0.00, 3135.00, 'completed', 'gcash',         'GCASH-REFUND-20260111-001'),
    (tx8,  bk12, p12, cust1, 'booking', 1430.00, 143.00, 1287.00, 'completed', 'gcash',         'GCASH-20251227-001'),
    (tx9,  bk13, p2,  cust2, 'booking',  630.00,  31.50,  598.50, 'completed', 'gcash',         'GCASH-20260107-001'),
    (tx10, bk14, p11, cust2, 'booking',  400.00,  20.00,  380.00, 'completed', 'cash',          'CASH-20260120-001');


  -- ============================================================
  -- PAYOUTS  (property owner payouts)
  -- ============================================================
  insert into payouts (property_id, owner_id, amount, status, payout_method, reference_id, period_start, period_end, processed_at)
  values
    (p1,  owner, 3960.00, 'completed',  'gcash',         'PAYOUT-P1-202512',  '2025-12-01', '2025-12-31', '2026-01-05 10:00:00+08'),
    (p2,  owner, 1197.00, 'completed',  'gcash',         'PAYOUT-P2-202512',  '2025-12-01', '2025-12-31', '2026-01-05 10:00:00+08'),
    (p3,  owner,  475.00, 'completed',  'bank_transfer', 'PAYOUT-P3-202512',  '2025-12-01', '2025-12-31', '2026-01-05 10:00:00+08'),
    (p4,  owner, 1782.00, 'completed',  'gcash',         'PAYOUT-P4-202601',  '2026-01-01', '2026-01-31', '2026-02-05 10:00:00+08'),
    (p6,  owner, 3564.00, 'completed',  'bank_transfer', 'PAYOUT-P6-202511',  '2025-11-01', '2025-11-30', '2025-12-05 10:00:00+08'),
    (p12, owner, 1287.00, 'completed',  'gcash',         'PAYOUT-P12-202512', '2025-12-01', '2025-12-31', '2026-01-05 10:00:00+08'),
    (p1,  owner, 1584.00, 'scheduled',  'gcash',         null,                '2026-02-01', '2026-02-28', null),
    (p8,  owner, 2100.00, 'processing', 'bank_transfer', null,                '2026-02-01', '2026-02-28', null);


  -- ============================================================
  -- SUPPORT TICKETS  (4 tickets with various statuses)
  -- ============================================================
  insert into support_tickets (id, ticket_number, user_id, subject, user_type, priority, status)
  values
    (tk1, 'TKT-0001', cust1, 'Refund not received for cancelled Baguio booking',     'Customer', 'High',   'Resolved'),
    (tk2, 'TKT-0002', cust2, 'Unable to leave a review for completed booking',        'Customer', 'Medium', 'In Progress'),
    (tk3, 'TKT-0003', owner, 'How to update property operating hours?',               'Property', 'Low',    'Closed'),
    (tk4, 'TKT-0004', cust2, 'Charged no-show fee but had an emergency',              'Customer', 'High',   'Open');


  -- ============================================================
  -- TICKET MESSAGES  (conversation threads)
  -- ============================================================
  insert into ticket_messages (ticket_id, sender_id, message, is_staff)
  values
    -- Ticket 1: Refund inquiry (Resolved)
    (tk1, cust1,  'Hi, I cancelled my booking at Pine Paws Baguio (Booking #' || bk10 || ') on Jan 10 but I still haven''t received the refund to my GCash. It''s been 2 weeks. Can you help?', false),
    (tk1, admin1, 'Hello! Thank you for reaching out. Let me check the status of your refund right away. Can you confirm the GCash number linked to your booking?', true),
    (tk1, cust1,  'Sure, it''s 0917-111-1111. Thank you!', false),
    (tk1, admin1, 'I''ve confirmed with our finance team — the refund of ₱3,135.00 was processed on Jan 11 with reference GCASH-REFUND-20260111-001. Sometimes it takes 3-5 business days to reflect. Please check your GCash transaction history. If you still don''t see it by tomorrow, let us know!', true),
    (tk1, cust1,  'Found it! It was there all along, I missed it in my history. Thank you so much for the quick help!', false),
    (tk1, admin1, 'Glad we could help! Marking this as resolved. Don''t hesitate to reach out if you need anything else. 😊', true),

    -- Ticket 2: Review issue (In Progress)
    (tk2, cust2,  'I completed a booking at Happy Tails (Booking #' || bk4 || ') but when I try to leave a review, the button is not clickable. I can see the review section but it''s greyed out. Using Chrome on Android.', false),
    (tk2, admin1, 'Thank you for reporting this! We''re aware of a display issue on some Android browsers. Our dev team is looking into it. In the meantime, could you try using the PawStay app or a desktop browser? I''ll update you once the fix is deployed.', true),
    (tk2, cust2,  'I tried on desktop and it works now! But would be nice to have it fixed on mobile too.', false),

    -- Ticket 3: Property owner help (Closed)
    (tk3, owner,  'How do I change my property''s operating hours? I want to extend weekend hours for the holidays.', false),
    (tk3, admin1, 'Hi! You can update operating hours by going to your Property Dashboard > Settings > Operating Hours. Click "Edit Hours" and you can set different hours for each day of the week. Don''t forget to toggle "Holiday Availability" if you want to stay open during holidays!', true),
    (tk3, owner,  'Got it, thanks! I found the settings. Updated successfully.', false),

    -- Ticket 4: No-show fee dispute (Open)
    (tk4, cust2,  'I was charged a no-show fee of ₱300 for my grooming appointment at Fur & Fresh on Jan 8 (Booking #' || bk13 || '). I had a family emergency and couldn''t make it. I tried calling but no one answered. Is there any way to get this waived? It''s my first time being a no-show.', false);


  -- ============================================================
  -- NOTIFICATIONS  (sample notification feed)
  -- ============================================================
  insert into notifications (user_id, title, message, type, related_id, related_type, is_read, created_at)
  values
    -- Customer 1 notifications
    (cust1, 'Booking Confirmed',
     'Your booking at PawPalace Makati for Dec 15-18 has been confirmed! Brownie is going to love it.',
     'booking', bk1, 'booking', true, '2025-12-14 10:00:00+08'),

    (cust1, 'Check-out Complete',
     'Brownie has been checked out from PawPalace Makati. We hope he had a great stay! Don''t forget to leave a review.',
     'booking', bk1, 'booking', true, '2025-12-18 12:00:00+08'),

    (cust1, 'Grooming Complete',
     'Mochi''s grooming session at Fur & Fresh is complete! She looks fabulous. 🐱',
     'booking', bk2, 'booking', true, '2025-12-20 11:30:00+08'),

    (cust1, 'Refund Processed',
     'Your refund of ₱3,135.00 for the cancelled Pine Paws Baguio booking has been processed to your GCash account.',
     'payment', bk10, 'booking', true, '2026-01-11 10:00:00+08'),

    (cust1, 'New Review Reply',
     'PawPalace Makati replied to your review: "Thank you so much! We loved having Brownie..."',
     'review', rv1, 'review', true, '2025-12-19 10:00:00+08'),

    (cust1, 'Booking Checked In',
     'Brownie has been checked in at Cool Paws Tagaytay. Enjoy the mountain air! 🏔️',
     'booking', bk8, 'booking', false, '2026-02-10 07:30:00+08'),

    (cust1, 'Upcoming Booking Reminder',
     'Reminder: Brownie''s grooming appointment at Bark & Bubbles Davao is on Feb 20 at 9:00 AM.',
     'booking', bk6, 'booking', false, '2026-02-18 08:00:00+08'),

    (cust1, 'Support Ticket Resolved',
     'Your support ticket TKT-0001 regarding the Baguio refund has been resolved.',
     'support', tk1, 'ticket', true, '2026-01-12 10:00:00+08'),

    -- Customer 2 notifications
    (cust2, 'Booking Confirmed',
     'Your vet appointment at VetCare QC for Luna on Dec 22 at 2:00 PM has been confirmed.',
     'booking', bk3, 'booking', true, '2025-12-21 09:00:00+08'),

    (cust2, 'Booking Confirmed',
     'Your boarding reservation at Happy Tails for Biscuit (Jan 2-5) is confirmed!',
     'booking', bk4, 'booking', true, '2025-12-30 14:00:00+08'),

    (cust2, 'Check-out Complete',
     'Biscuit has been checked out from Happy Tails Pet Resort & Spa. Hope he had a blast!',
     'booking', bk4, 'booking', true, '2026-01-05 11:00:00+08'),

    (cust2, 'No-Show Notice',
     'You missed your grooming appointment at Fur & Fresh on Jan 8. A no-show fee of ₱300 has been applied.',
     'booking', bk13, 'booking', true, '2026-01-08 15:00:00+08'),

    (cust2, 'Booking Confirmed',
     'Your booking at PawPalace Makati for Luna (Feb 14-16) has been confirmed. Happy Valentine''s! 💕',
     'booking', bk5, 'booking', false, '2026-02-10 10:30:00+08'),

    (cust2, 'New Review Reply',
     'Happy Tails Pet Resort replied to your review: "We''re thrilled Biscuit enjoyed his stay!"',
     'review', rv4, 'review', true, '2026-01-06 08:30:00+08'),

    (cust2, 'Support Ticket Update',
     'An agent replied to your ticket TKT-0002 about the review button issue.',
     'support', tk2, 'ticket', false, '2026-02-08 11:00:00+08'),

    -- Property owner notifications
    (owner, 'New Booking Received',
     'New booking from Customer One at PawPalace Makati for Dec 15-18. Pet: Brownie (Golden Retriever).',
     'booking', bk1, 'booking', true, '2025-12-13 15:00:00+08'),

    (owner, 'New Booking Received',
     'New booking from Customer Two at Happy Tails for Jan 2-5. Pet: Biscuit (Beagle).',
     'booking', bk4, 'booking', true, '2025-12-28 10:00:00+08'),

    (owner, 'New Review',
     'Customer One left a 5-star review for PawPalace Makati: "Absolutely fantastic!"',
     'review', rv1, 'review', true, '2025-12-19 08:00:00+08'),

    (owner, 'New Review',
     'Customer Two left a 4-star review for Happy Tails: "Happy Tails lived up to its name!"',
     'review', rv4, 'review', true, '2026-01-06 07:00:00+08'),

    (owner, 'Payout Completed',
     'Your payout of ₱3,960.00 for PawPalace Makati (December 2025) has been deposited to your GCash.',
     'payment', p1, 'property', true, '2026-01-05 10:00:00+08'),

    (owner, 'Payout Completed',
     'Your payout of ₱1,782.00 for Happy Tails (January 2026) has been deposited to your GCash.',
     'payment', p4, 'property', true, '2026-02-05 10:00:00+08'),

    (owner, 'New Booking Received',
     'New booking from Customer Two at PawPalace Makati for Feb 14-16. Pet: Luna (Shih Tzu).',
     'booking', bk5, 'booking', false, '2026-02-10 10:30:00+08'),

    (owner, 'Property Approved',
     'Your property "PawPalace Makati" has been approved and is now live on PawStay!',
     'system', p1, 'property', true, '2025-11-01 09:00:00+08');


  raise notice 'Seed complete — 12 properties with all related data (setup, pricing, legal, services, pets, bookings, reviews, favorites, transactions, payouts, tickets, notifications) inserted successfully!';
end $$;


-- ============================================================
-- PawStay — Extra Seed Data for Filter Testing
-- Run AFTER seed.sql in Supabase SQL Editor
-- ============================================================
-- Adds 15 more properties (p13–p27) with wide variety:
--   • All 3 service types + combos
--   • Ratings from 3.2 to 5.0
--   • Prices from ₱150 to ₱2500
--   • Different cities across PH
--   • Dog-only, Cat-only, exotic-only, and multi-pet
--   • Different amenity combos
-- ============================================================

do $$
declare
  owner uuid;

  p13 uuid := 'a1000000-0000-0000-0000-000000000013';
  p14 uuid := 'a1000000-0000-0000-0000-000000000014';
  p15 uuid := 'a1000000-0000-0000-0000-000000000015';
  p16 uuid := 'a1000000-0000-0000-0000-000000000016';
  p17 uuid := 'a1000000-0000-0000-0000-000000000017';
  p18 uuid := 'a1000000-0000-0000-0000-000000000018';
  p19 uuid := 'a1000000-0000-0000-0000-000000000019';
  p20 uuid := 'a1000000-0000-0000-0000-000000000020';
  p21 uuid := 'a1000000-0000-0000-0000-000000000021';
  p22 uuid := 'a1000000-0000-0000-0000-000000000022';
  p23 uuid := 'a1000000-0000-0000-0000-000000000023';
  p24 uuid := 'a1000000-0000-0000-0000-000000000024';
  p25 uuid := 'a1000000-0000-0000-0000-000000000025';
  p26 uuid := 'a1000000-0000-0000-0000-000000000026';
  p27 uuid := 'a1000000-0000-0000-0000-000000000027';

begin
  -- Get owner
  select id into owner from profiles where role = 'proprietor' order by created_at asc limit 1;
  if owner is null then
    select id into owner from profiles order by created_at asc limit 1;
  end if;

  -- ============================================================
  -- CLEANUP extra properties (re-runnable)
  -- ============================================================
  delete from property_services  where property_id in (p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27);
  delete from property_legal     where property_id in (p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27);
  delete from property_pricing   where property_id in (p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27);
  delete from property_amenities where property_id in (p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27);
  delete from property_setup     where property_id in (p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27);
  delete from properties         where id          in (p13,p14,p15,p16,p17,p18,p19,p20,p21,p22,p23,p24,p25,p26,p27);

  -- ============================================================
  -- PROPERTIES (15 new listings — diverse for filter testing)
  -- ============================================================
  insert into properties (id, owner_id, status, name, property_type, address, city, zip_code, latitude, longitude, phone, website, description, capacity, pet_types_accepted, dog_sizes, facilities_amenities, images, cover_image, rating, review_count)
  values
    -- 13. Budget hotel in Caloocan (LOW rating, LOW price, Dog only)
    (p13, owner, 'approved',
     'Bantay Paws Budget Inn',
     '{hotel}',
     '55 Rizal Avenue Extension', 'Caloocan', '1400',
     14.6572, 120.9645,
     '+63 929 111 2222', null,
     'Affordable pet boarding for budget-conscious pet parents. Basic but clean rooms. Great for short overnight stays.',
     10,
     '{Dog}', '{Small,Medium}',
     '{CCTV Monitoring}',
     '{https://images.unsplash.com/photo-1587300003388-59208cc962cb}',
     'https://images.unsplash.com/photo-1587300003388-59208cc962cb',
     3.2, 15),

    -- 14. Premium grooming in Makati (HIGH rating, HIGH price)
    (p14, owner, 'approved',
     'Luxe Paws Grooming Lounge',
     '{grooming}',
     '7F Greenbelt 5, Ayala Center', 'Makati', '1224',
     14.5510, 121.0196,
     '+63 929 222 3333', 'https://luxepaws.ph',
     'Ultra-premium grooming for discerning pet parents. Japanese grooming techniques, organic products, and breed-specialist stylists. By appointment only.',
     null,
     '{Dog,Cat}', '{Small,Medium,Large,Giant}',
     '{Air Conditioning,Grooming Station,Waiting Lounge,Parking}',
     '{https://images.unsplash.com/photo-1516734212186-a967f81ad0d7,https://images.unsplash.com/photo-1625794084867-8ddd239946b1}',
     'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7',
     5.0, 42),

    -- 15. Cat-only hotel in QC (niche filter test)
    (p15, owner, 'approved',
     'Meow Manor Cat Hotel',
     '{hotel}',
     '12 Katipunan Avenue, Loyola Heights', 'Quezon City', '1108',
     14.6382, 121.0764,
     '+63 929 333 4444', 'https://meowmanor.ph',
     'Exclusively for cats! Spacious cat condos, climbing walls, and a serene environment free from barking dogs. Cat behavior specialist on staff.',
     20,
     '{Cat}', '{}',
     '{Air Conditioning,CCTV Monitoring,Play Area,Webcam Access}',
     '{https://images.unsplash.com/photo-1574158622682-e40e69881006,https://images.unsplash.com/photo-1573865526739-10659fec78a5}',
     'https://images.unsplash.com/photo-1574158622682-e40e69881006',
     4.9, 87),

    -- 16. Vet clinic in Makati (same city as p1, p14 — location filter test)
    (p16, owner, 'approved',
     'MakatiVet 24/7 Animal Hospital',
     '{veterinary}',
     '200 Gil Puyat Avenue, Salcedo Village', 'Makati', '1227',
     14.5606, 121.0200,
     '+63 929 444 5555', 'https://makativet247.com',
     '24/7 emergency veterinary hospital with state-of-the-art ICU, digital X-ray, and in-house blood lab. Board-certified surgeons available.',
     null,
     '{Dog,Cat,Bird,Rabbit}', '{Small,Medium,Large,Giant}',
     '{Air Conditioning,X-Ray,Laboratory,Surgery Room,Pharmacy,Emergency Room,Parking}',
     '{https://images.unsplash.com/photo-1629909613654-28e377c37b09,https://images.unsplash.com/photo-1612531386530-97d24dae0606}',
     'https://images.unsplash.com/photo-1629909613654-28e377c37b09',
     4.7, 310),

    -- 17. Cheap grooming in Mandaluyong (LOW price grooming)
    (p17, owner, 'approved',
     'QuickClip Pet Salon',
     '{grooming}',
     '3F SM Megamall Building A', 'Mandaluyong', '1550',
     14.5860, 121.0565,
     '+63 929 555 6666', null,
     'Fast and affordable grooming inside SM Megamall. Walk-ins welcome. Perfect for a quick bath or nail trim while you shop!',
     null,
     '{Dog,Cat}', '{Small,Medium}',
     '{Air Conditioning,Grooming Station}',
     '{https://images.unsplash.com/photo-1625794084867-8ddd239946b1}',
     'https://images.unsplash.com/photo-1625794084867-8ddd239946b1',
     3.8, 230),

    -- 18. Luxury hotel in Subic (HIGH price, unique location)
    (p18, owner, 'approved',
     'Subic Bay Pet Resort & Spa',
     '{hotel,grooming}',
     'Lot 5, Waterfront Road, SBFZ', 'Subic Bay', '2222',
     14.7943, 120.2522,
     '+63 929 666 7777', 'https://subicpetresort.ph',
     'Beachside pet resort with infinity pool for dogs, private cabanas, and personal attendants. The ultimate luxury pet vacation destination.',
     15,
     '{Dog}', '{Small,Medium,Large,Giant}',
     '{Swimming Pool,Outdoor Space,Play Area,Grooming Station,CCTV Monitoring,Pick-up & Drop-off,Garden}',
     '{https://images.unsplash.com/photo-1601758228041-f3b2795255f1,https://images.unsplash.com/photo-1548199973-03cce0bbc87b}',
     'https://images.unsplash.com/photo-1601758228041-f3b2795255f1',
     4.6, 34),

    -- 19. All-in-one in Cebu (same city as p5 — multi-result test)
    (p19, owner, 'approved',
     'Cebu Pet Haven',
     '{hotel,grooming,veterinary}',
     '88 Archbishop Reyes Avenue, Banilad', 'Cebu City', '6000',
     10.3275, 123.9056,
     '+63 929 777 8888', 'https://cebupethaven.ph',
     'Full-service pet care center in Cebu. Boarding, grooming, and vet clinic under one roof. Emergency services available nights and weekends.',
     35,
     '{Dog,Cat,Rabbit}', '{Small,Medium,Large}',
     '{Air Conditioning,CCTV Monitoring,Play Area,Grooming Station,Veterinary Clinic,Parking,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1548199973-03cce0bbc87b,https://images.unsplash.com/photo-1583337130417-13104dec14a6}',
     'https://images.unsplash.com/photo-1548199973-03cce0bbc87b',
     3.9, 65),

    -- 20. Hotel in Marikina (medium rating, medium price)
    (p20, owner, 'approved',
     'Shoe City Pet Lodge',
     '{hotel}',
     '22 J.P. Rizal Street, Sto. Niño', 'Marikina', '1800',
     14.6507, 121.1029,
     '+63 929 888 9999', null,
     'Cozy pet lodge in the shoe capital! Riverside location with a nice walking trail along the Marikina River. Great for active dogs.',
     18,
     '{Dog,Cat}', '{Small,Medium,Large}',
     '{CCTV Monitoring,Play Area,Outdoor Space,Garden,Daily Walks}',
     '{https://images.unsplash.com/photo-1583511655857-d19b40a7a54e,https://images.unsplash.com/photo-1587300003388-59208cc962cb}',
     'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e',
     4.1, 48),

    -- 21. Exotic pet vet in Manila (niche pet type filter test)
    (p21, owner, 'approved',
     'Exotic Pets Manila Veterinary',
     '{veterinary}',
     '45 United Nations Avenue, Ermita', 'Manila', '1000',
     14.5781, 120.9840,
     '+63 930 111 2222', 'https://exoticpetsmnl.com',
     'Specialist veterinary clinic for exotic pets — reptiles, birds, rabbits, hamsters, and more. One of the few exotic pet vets in Metro Manila.',
     null,
     '{Bird,Rabbit}', '{}',
     '{Air Conditioning,Laboratory,Pharmacy,Parking}',
     '{https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def}',
     'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def',
     4.8, 95),

    -- 22. Dog-only grooming in Taguig (same city as p2)
    (p22, owner, 'approved',
     'Good Boy Grooming Co.',
     '{grooming}',
     'GF Bonifacio Stopover, 31st Street', 'Taguig', '1634',
     14.5505, 121.0468,
     '+63 930 222 3333', null,
     'Dog-only grooming salon in BGC. We know dogs inside and out! Hand-stripping, show grooming, and creative styling available.',
     null,
     '{Dog}', '{Small,Medium,Large,Giant}',
     '{Air Conditioning,Grooming Station,Waiting Lounge,Parking,Pet Shop}',
     '{https://images.unsplash.com/photo-1516734212186-a967f81ad0d7}',
     'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7',
     4.4, 122),

    -- 23. Hotel in Batangas (LOW rating — 3.5, budget)
    (p23, owner, 'approved',
     'Lipa Paws Pension House',
     '{hotel}',
     '15 CM Recto Avenue', 'Lipa City', '4217',
     13.9412, 121.1630,
     '+63 930 333 4444', null,
     'Simple pet pension in Lipa, Batangas. No frills boarding at very affordable rates. Perfect for pets of Lipa and nearby towns.',
     8,
     '{Dog,Cat}', '{Small,Medium}',
     '{}',
     '{https://images.unsplash.com/photo-1587300003388-59208cc962cb}',
     'https://images.unsplash.com/photo-1587300003388-59208cc962cb',
     3.5, 12),

    -- 24. Premium vet + grooming in Quezon City (HIGH rating combo)
    (p24, owner, 'approved',
     'PetMD Wellness Center',
     '{grooming,veterinary}',
     '99 Timog Avenue, South Triangle', 'Quezon City', '1103',
     14.6337, 121.0317,
     '+63 930 444 5555', 'https://petmdwellness.ph',
     'Premium wellness center combining veterinary medicine with therapeutic grooming. Medicated baths, dermatology consultations, and preventive care programs.',
     null,
     '{Dog,Cat}', '{Small,Medium,Large}',
     '{Air Conditioning,X-Ray,Laboratory,Grooming Station,Pharmacy,Waiting Lounge,Parking}',
     '{https://images.unsplash.com/photo-1629909613654-28e377c37b09,https://images.unsplash.com/photo-1625794084867-8ddd239946b1}',
     'https://images.unsplash.com/photo-1629909613654-28e377c37b09',
     4.9, 178),

    -- 25. Hotel in Clark / Pampanga (unique location)
    (p25, owner, 'approved',
     'Clark Fur Lodge',
     '{hotel}',
     'Lot 12, Friendship Highway, Angeles', 'Angeles City', '2009',
     15.1679, 120.5864,
     '+63 930 555 6666', null,
     'Spacious pet lodge near Clark Freeport. Large outdoor grounds, cool highland breeze, and a peaceful country atmosphere. Great for dogs who love space.',
     25,
     '{Dog}', '{Medium,Large,Giant}',
     '{Outdoor Space,Play Area,CCTV Monitoring,Garden,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1601758228041-f3b2795255f1}',
     'https://images.unsplash.com/photo-1601758228041-f3b2795255f1',
     4.2, 29),

    -- 26. Grooming in Davao (same city as p7 — multi-result test, higher price)
    (p26, owner, 'approved',
     'Pawsh Studio Davao',
     '{grooming}',
     'GF Abreeza Mall, J.P. Laurel Avenue', 'Davao City', '8000',
     7.0863, 125.6139,
     '+63 930 666 7777', 'https://pawshstudio.ph',
     'High-end grooming studio inside Abreeza Mall. Japanese-style grooming, teddy bear cuts, and creative color styling. Instagram-worthy results guaranteed!',
     null,
     '{Dog,Cat}', '{Small,Medium,Large}',
     '{Air Conditioning,Grooming Station,Waiting Lounge,Parking,Pet Shop}',
     '{https://images.unsplash.com/photo-1625794084867-8ddd239946b1,https://images.unsplash.com/photo-1516734212186-a967f81ad0d7}',
     'https://images.unsplash.com/photo-1625794084867-8ddd239946b1',
     4.7, 156),

    -- 27. Hotel + Vet in Manila (same city as p6, p21 — multi-result, mid rating)
    (p27, owner, 'approved',
     'Metro Paws Care Center',
     '{hotel,veterinary}',
     '321 Taft Avenue, Malate', 'Manila', '1004',
     14.5670, 120.9925,
     '+63 930 777 8888', null,
     'Centrally located pet hotel with in-house vet. Convenient Taft Avenue location near universities. Affordable boarding with daily vet rounds included.',
     22,
     '{Dog,Cat,Rabbit}', '{Small,Medium,Large}',
     '{Air Conditioning,CCTV Monitoring,Veterinary Clinic,Parking,Pick-up & Drop-off}',
     '{https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd,https://images.unsplash.com/photo-1587300003388-59208cc962cb}',
     'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd',
     4.0, 88);


  -- ============================================================
  -- PROPERTY SETUP
  -- ============================================================
  insert into property_setup (property_id, policies, operating_hours, cancellation_policy, health_safety, emergency_contact, nearest_vet_hospital)
  values
    (p13, '{"breedRestrictions":true,"breedRestrictionDetails":"No giant breeds","aggressivePolicy":true,"aggressivePolicyDetails":"Muzzle required","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"08:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":false}'::jsonb,
     '{"freeCancellation":"12hours","lateFee":"₱100","noShow":"₱200"}'::jsonb,
     '{Basic Sanitization,CCTV}', '+63 929 111 2222', 'Caloocan Veterinary Clinic - 15 min away'),

    (p14, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Behavioral check before grooming","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":false,"weeklyHours":{"Monday":{"open":"10:00","close":"20:00"},"Tuesday":{"open":"10:00","close":"20:00"},"Wednesday":{"open":"10:00","close":"20:00"},"Thursday":{"open":"10:00","close":"20:00"},"Friday":{"open":"10:00","close":"21:00"},"Saturday":{"open":"09:00","close":"21:00"},"Sunday":"Closed"},"appointmentOnly":"appointments"}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱500","noShow":"₱1000"}'::jsonb,
     '{Sterilized Japanese Tools,Organic Products Only,Individual Grooming Rooms}', '+63 929 222 3333', 'Makati Vet Clinic - 5 min away'),

    (p15, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Cat behavior assessment on check-in","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"FVRCP vaccine required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"07:00","dailyCloseTime":"21:00","weekendAvailability":true,"holidayAvailability":true,"checkInCutoff":"19:00"}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Cat-Only Facility,Feliway Diffusers,Individual Cat Condos,Daily Sanitization}', '+63 929 333 4444', 'QC Pet Hospital - 8 min away'),

    (p16, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Sedation available for aggressive animals","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"00:00","dailyCloseTime":"23:59","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":true,"appointmentOnly":"both"}'::jsonb,
     '{"freeCancellation":"2hours","lateFee":"₱300","noShow":"₱500"}'::jsonb,
     '{Board-Certified Surgeons,ICU,Digital X-Ray,In-House Blood Lab,24/7 Emergency}', '+63 929 444 5555', 'On-site — this IS the hospital'),

    (p17, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Muzzle required for biters","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"10:00","dailyCloseTime":"21:00","weekendAvailability":true,"holidayAvailability":true,"appointmentOnly":"walk-ins"}'::jsonb,
     '{"freeCancellation":"3hours","lateFee":"₱50","noShow":"₱100"}'::jsonb,
     '{Sterilized Tools,Clean Environment}', '+63 929 555 6666', 'Mandaluyong Vet - 10 min away'),

    (p18, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Temperament assessment on arrival","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Full vaccination required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"06:00","dailyCloseTime":"22:00","weekendAvailability":true,"holidayAvailability":true,"checkInCutoff":"20:00"}'::jsonb,
     '{"freeCancellation":"72hours","lateFee":"₱500","noShow":"₱1500"}'::jsonb,
     '{Vaccination Required,Personal Attendant,Daily Health Check,Infinity Pool Lifeguard}', '+63 929 666 7777', 'Subic Bay Medical Center Vet - 10 min away'),

    (p19, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Assessment required","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"On-site vaccination available"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"07:00","dailyCloseTime":"21:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":true}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Licensed Vet,CCTV 24/7,Sanitized Rooms,Fire Safety}', '+63 929 777 8888', 'On-site veterinary clinic'),

    (p20, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Assessment on check-in","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Vaccination card required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"07:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":false}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱150","noShow":"₱300"}'::jsonb,
     '{Vaccination Required,Riverside Trail,Daily Walks,Secure Fencing}', '+63 929 888 9999', 'Marikina Vet Clinic - 12 min away'),

    (p21, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Handling by exotic pet specialist only","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"09:00","dailyCloseTime":"18:00","weekendAvailability":true,"holidayAvailability":false,"appointmentOnly":"appointments"}'::jsonb,
     '{"freeCancellation":"12hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Exotic Pet Specialist,Temperature-Controlled Rooms,Specialized Equipment}', '+63 930 111 2222', 'On-site exotic pet facility'),

    (p22, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Behavioral check before grooming","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":false,"weeklyHours":{"Monday":{"open":"09:00","close":"20:00"},"Tuesday":{"open":"09:00","close":"20:00"},"Wednesday":{"open":"09:00","close":"20:00"},"Thursday":{"open":"09:00","close":"20:00"},"Friday":{"open":"09:00","close":"21:00"},"Saturday":{"open":"08:00","close":"21:00"},"Sunday":{"open":"10:00","close":"18:00"}},"appointmentOnly":"both"}'::jsonb,
     '{"freeCancellation":"6hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Sterilized Tools,Hypoallergenic Products,Dog-Only Environment}', '+63 930 222 3333', 'BGC Animal Clinic - 5 min away'),

    (p23, '{"breedRestrictions":true,"breedRestrictionDetails":"Small to medium dogs only","aggressivePolicy":true,"aggressivePolicyDetails":"Not accepted","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"08:00","dailyCloseTime":"18:00","weekendAvailability":true,"holidayAvailability":false}'::jsonb,
     '{"freeCancellation":"6hours","lateFee":"₱50","noShow":"₱100"}'::jsonb,
     '{Basic Cleaning}', '+63 930 333 4444', 'Lipa Veterinary Clinic - 20 min away'),

    (p24, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Sedation available for aggressive pets","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"On-site vaccination available"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"08:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":true,"appointmentOnly":"both"}'::jsonb,
     '{"freeCancellation":"12hours","lateFee":"₱300","noShow":"₱500"}'::jsonb,
     '{Board-Certified Dermatologist,Medicated Baths,In-House Lab,Licensed Vets}', '+63 930 444 5555', 'On-site veterinary facility'),

    (p25, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Assessment on arrival","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"Vaccination required"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"06:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":true,"checkInCutoff":"18:00"}'::jsonb,
     '{"freeCancellation":"48hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Vaccination Required,Large Outdoor Grounds,Secure Fencing,Daily Exercise}', '+63 930 555 6666', 'Angeles Vet Hospital - 15 min away'),

    (p26, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Muzzle required for biters","unvaccinatedPolicy":false}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"10:00","dailyCloseTime":"20:00","weekendAvailability":true,"holidayAvailability":false,"appointmentOnly":"appointments"}'::jsonb,
     '{"freeCancellation":"12hours","lateFee":"₱300","noShow":"₱600"}'::jsonb,
     '{Japanese Grooming Tools,Organic Products,Individual Styling Rooms}', '+63 930 666 7777', 'Davao Vet Hospital - 5 min away'),

    (p27, '{"breedRestrictions":false,"aggressivePolicy":true,"aggressivePolicyDetails":"Assessment on check-in","unvaccinatedPolicy":true,"unvaccinatedPolicyDetails":"On-site vaccination available"}'::jsonb,
     '{"sameHoursEveryDay":true,"dailyOpenTime":"07:00","dailyCloseTime":"21:00","weekendAvailability":true,"holidayAvailability":true,"emergencyServices":false,"checkInCutoff":"19:00"}'::jsonb,
     '{"freeCancellation":"24hours","lateFee":"₱200","noShow":"₱400"}'::jsonb,
     '{Licensed Vet,Daily Health Rounds,CCTV,Clean Rooms}', '+63 930 777 8888', 'On-site veterinary clinic');


  -- ============================================================
  -- PROPERTY AMENITIES  (link to existing amenities table)
  -- ============================================================
  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p13)) as v(pid)
  join amenities a on a.amenity = any(array['CCTV Monitoring']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p14)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','Grooming Station','Waiting Lounge','Parking']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p15)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','CCTV Monitoring','Play Area','Webcam Access']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p16)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','X-Ray','Laboratory','Surgery Room','Pharmacy','Emergency Room','Parking']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p17)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','Grooming Station']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p18)) as v(pid)
  join amenities a on a.amenity = any(array['Swimming Pool','Outdoor Space','Play Area','Grooming Station','CCTV Monitoring','Pick-up & Drop-off','Garden']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p19)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','CCTV Monitoring','Play Area','Grooming Station','Veterinary Clinic','Parking','Pick-up & Drop-off']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p20)) as v(pid)
  join amenities a on a.amenity = any(array['CCTV Monitoring','Play Area','Outdoor Space','Garden','Daily Walks']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p21)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','Laboratory','Pharmacy','Parking']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p22)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','Grooming Station','Waiting Lounge','Parking','Pet Shop']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p23)) as v(pid)
  join amenities a on a.amenity = any(array['CCTV Monitoring'])
  on conflict do nothing;

  -- p23 might have no matching amenities if only CCTV — that's fine for testing "no amenities" filter

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p24)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','X-Ray','Laboratory','Grooming Station','Pharmacy','Waiting Lounge','Parking']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p25)) as v(pid)
  join amenities a on a.amenity = any(array['Outdoor Space','Play Area','CCTV Monitoring','Garden','Pick-up & Drop-off']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p26)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','Grooming Station','Waiting Lounge','Parking','Pet Shop']);

  insert into property_amenities (property_id, amenity_id)
  select v.pid, a.id from (values (p27)) as v(pid)
  join amenities a on a.amenity = any(array['Air Conditioning','CCTV Monitoring','Veterinary Clinic','Parking','Pick-up & Drop-off']);


  -- ============================================================
  -- PROPERTY PRICING
  -- ============================================================
  insert into property_pricing (property_id, base_services, pet_size_pricing, add_ons, vet_fees, fees_charges, payment_options, pricing_notes)
  values
    (p13,
     '[{"name":"Basic Overnight","priceType":"Fixed price","price":"250","duration":"24h"}]'::jsonb,
     '{"small":"200","medium":"250"}'::jsonb,
     '[]'::jsonb, '{}'::jsonb,
     '{"serviceFee":"5%","taxes":"Included","noShow":"₱200"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash"],"refundPolicy":"No refund within 12hrs"}'::jsonb,
     'Budget rates. No frills.'),

    (p14,
     '[{"name":"Signature Grooming","priceType":"Fixed price","price":"2000","duration":"3h"},{"name":"Japanese Scissor Cut","priceType":"Fixed price","price":"2500","duration":"3.5h"},{"name":"Spa & Pamper","priceType":"Fixed price","price":"1800","duration":"2.5h"}]'::jsonb,
     '{"small":"1800","medium":"2000","large":"2500","giant":"3000","cats":"1500"}'::jsonb,
     '[{"name":"Organic Mud Mask","price":"500","type":"One-time"},{"name":"Blueberry Facial","price":"300","type":"One-time"},{"name":"Pawdicure","price":"400","type":"One-time"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱1000"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card"],"refundPolicy":"Full refund if cancelled 24hrs before appointment"}'::jsonb,
     'Premium pricing reflects use of imported organic products and Japanese technique training.'),

    (p15,
     '[{"name":"Cat Condo Stay","priceType":"Fixed price","price":"600","duration":"24h"},{"name":"Premium Cat Suite","priceType":"Fixed price","price":"900","duration":"24h"},{"name":"Cat Daycare","priceType":"Fixed price","price":"350","duration":"12h"}]'::jsonb,
     '{"cats":"600"}'::jsonb,
     '[{"name":"Webcam Access","price":"50","type":"Per day"},{"name":"Catnip Toy","price":"80","type":"One-time"},{"name":"Premium Cat Food","price":"120","type":"Per day"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱400"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card"],"refundPolicy":"Full refund if cancelled 24hrs before check-in"}'::jsonb,
     'Cat-exclusive facility. No dogs allowed. Feliway diffusers in every room.'),

    (p16,
     '[{"name":"Emergency Consultation","priceType":"Fixed price","price":"1500","duration":"varies"},{"name":"General Check-up","priceType":"Fixed price","price":"600","duration":"30min"},{"name":"Vaccination","priceType":"Starts at","price":"350","duration":"15min"}]'::jsonb,
     '{}'::jsonb,
     '[{"name":"Blood Panel","price":"1200","type":"One-time"},{"name":"Digital X-Ray","price":"1500","type":"One-time"},{"name":"Ultrasound","price":"2000","type":"One-time"},{"name":"ICU Stay (per day)","price":"3000","type":"Per day"}]'::jsonb,
     '{"generalConsult":"600","vaccination":"350","emergency":"1500","surgery":"8000","dental":"2000","spayNeuter":"5000"}'::jsonb,
     '{"serviceFee":"0%","taxes":"Included"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash","Card","Bank Transfer"],"refundPolicy":"No refund for completed services"}'::jsonb,
     '24/7 emergency services. ICU rates apply for critical care patients.'),

    (p17,
     '[{"name":"Express Bath","priceType":"Fixed price","price":"150","duration":"30min"},{"name":"Full Grooming","priceType":"Starts at","price":"300","duration":"1h"},{"name":"Nail Trim Only","priceType":"Fixed price","price":"80","duration":"10min"}]'::jsonb,
     '{"small":"150","medium":"250"}'::jsonb,
     '[{"name":"Flea Shampoo Upgrade","price":"50","type":"One-time"},{"name":"Teeth Brushing","price":"50","type":"One-time"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"0%","taxes":"Included","noShow":"₱100"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash"],"refundPolicy":"No refund"}'::jsonb,
     'Mall-based grooming. Fast service. Walk-ins only — no appointments needed.'),

    (p18,
     '[{"name":"Beach Cabana","priceType":"Fixed price","price":"2000","duration":"24h"},{"name":"VIP Villa","priceType":"Fixed price","price":"3500","duration":"24h"},{"name":"Pool Day Pass","priceType":"Fixed price","price":"800","duration":"12h"},{"name":"Spa Grooming","priceType":"Fixed price","price":"1500","duration":"2h"}]'::jsonb,
     '{"small":"1500","medium":"2000","large":"2500","giant":"3000"}'::jsonb,
     '[{"name":"Personal Attendant","price":"500","type":"Per day"},{"name":"Photo Shoot","price":"1000","type":"One-time"},{"name":"Organic Meal Plan","price":"300","type":"Per day"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"15%","taxes":"Included","noShow":"₱1500","latePickup":"₱300/hr"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Card","Bank Transfer"],"refundPolicy":"Full refund if cancelled 72hrs before"}'::jsonb,
     'Luxury beachside resort. Peak season (Dec-May) rates +₱500/night.'),

    (p19,
     '[{"name":"Standard Room","priceType":"Fixed price","price":"500","duration":"24h"},{"name":"Grooming Package","priceType":"Starts at","price":"450","duration":"2h"},{"name":"Vet Consultation","priceType":"Fixed price","price":"400","duration":"30min"}]'::jsonb,
     '{"small":"400","medium":"500","large":"700","cats":"350"}'::jsonb,
     '[{"name":"Vaccination","price":"300","type":"One-time"},{"name":"Flea Treatment","price":"200","type":"One-time"}]'::jsonb,
     '{"generalConsult":"400","vaccination":"300","emergency":"1200"}'::jsonb,
     '{"serviceFee":"8%","taxes":"Included","noShow":"₱400"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash"],"refundPolicy":"Full refund 24hrs before"}'::jsonb,
     'All-in-one Cebu branch. Multi-service discount available.'),

    (p20,
     '[{"name":"Riverside Room","priceType":"Fixed price","price":"450","duration":"24h"},{"name":"Deluxe Room","priceType":"Fixed price","price":"700","duration":"24h"}]'::jsonb,
     '{"small":"350","medium":"450","large":"600"}'::jsonb,
     '[{"name":"River Walk Session","price":"80","type":"Per day"},{"name":"Extra Meal","price":"100","type":"Per day"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"8%","taxes":"Included","noShow":"₱300"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash"],"refundPolicy":"Full refund 24hrs before"}'::jsonb,
     'Riverside location. Perfect for active dogs.'),

    (p21,
     '[{"name":"Exotic Pet Consultation","priceType":"Fixed price","price":"800","duration":"45min"},{"name":"Bird Health Check","priceType":"Fixed price","price":"600","duration":"30min"},{"name":"Rabbit Dental","priceType":"Fixed price","price":"1200","duration":"1h"}]'::jsonb,
     '{}'::jsonb,
     '[{"name":"Blood Test (Avian)","price":"1000","type":"One-time"},{"name":"Nail/Beak Trim","price":"300","type":"One-time"}]'::jsonb,
     '{"generalConsult":"800","birdCheckup":"600","rabbitDental":"1200","emergency":"2000"}'::jsonb,
     '{"serviceFee":"0%","taxes":"Included"}'::jsonb,
     '{"deposit":false,"methods":["GCash","Cash","Card"],"refundPolicy":"No refund for completed consultations"}'::jsonb,
     'One of few exotic pet specialists in Metro Manila. By appointment only.'),

    (p22,
     '[{"name":"Show Grooming","priceType":"Fixed price","price":"1200","duration":"3h"},{"name":"Standard Grooming","priceType":"Starts at","price":"600","duration":"2h"},{"name":"Bath & Tidy","priceType":"Starts at","price":"400","duration":"1h"},{"name":"Hand Stripping","priceType":"Starts at","price":"1500","duration":"3h"}]'::jsonb,
     '{"small":"400","medium":"600","large":"900","giant":"1200"}'::jsonb,
     '[{"name":"De-shedding Treatment","price":"300","type":"One-time"},{"name":"Teeth Cleaning","price":"200","type":"One-time"},{"name":"Creative Color","price":"500","type":"One-time"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱400"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card"],"refundPolicy":"Full refund 6hrs before appointment"}'::jsonb,
     'Dog-only salon. Show grooming and hand stripping by certified groomers.'),

    (p23,
     '[{"name":"Basic Room","priceType":"Fixed price","price":"200","duration":"24h"}]'::jsonb,
     '{"small":"150","medium":"200"}'::jsonb,
     '[]'::jsonb, '{}'::jsonb,
     '{"serviceFee":"0%","taxes":"Included","noShow":"₱100"}'::jsonb,
     '{"deposit":false,"methods":["Cash"],"refundPolicy":"No refund"}'::jsonb,
     'Very basic boarding. Cash only.'),

    (p24,
     '[{"name":"Dermatology Consult","priceType":"Fixed price","price":"800","duration":"45min"},{"name":"Therapeutic Bath","priceType":"Starts at","price":"700","duration":"1.5h"},{"name":"General Check-up","priceType":"Fixed price","price":"500","duration":"30min"},{"name":"Medicated Grooming","priceType":"Starts at","price":"900","duration":"2h"}]'::jsonb,
     '{"small":"500","medium":"700","large":"900"}'::jsonb,
     '[{"name":"Skin Scraping Test","price":"500","type":"One-time"},{"name":"Allergy Panel","price":"2000","type":"One-time"},{"name":"Medicated Shampoo (take-home)","price":"350","type":"One-time"}]'::jsonb,
     '{"generalConsult":"500","dermatology":"800","vaccination":"300","dental":"1500"}'::jsonb,
     '{"serviceFee":"5%","taxes":"Included","noShow":"₱500"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card"],"refundPolicy":"Full refund 12hrs before"}'::jsonb,
     'Wellness center specializing in pet dermatology and skin conditions.'),

    (p25,
     '[{"name":"Standard Kennel","priceType":"Fixed price","price":"400","duration":"24h"},{"name":"Large Run","priceType":"Fixed price","price":"650","duration":"24h"},{"name":"Daycare","priceType":"Fixed price","price":"250","duration":"12h"}]'::jsonb,
     '{"medium":"400","large":"550","giant":"650"}'::jsonb,
     '[{"name":"Extra Exercise Session","price":"100","type":"Per day"},{"name":"Premium Kibble","price":"80","type":"Per day"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"8%","taxes":"Included","noShow":"₱400"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash"],"refundPolicy":"Full refund 48hrs before"}'::jsonb,
     'Large breeds welcome. Spacious outdoor runs.'),

    (p26,
     '[{"name":"Pawsh Cut","priceType":"Fixed price","price":"1000","duration":"2.5h"},{"name":"Creative Styling","priceType":"Fixed price","price":"1500","duration":"3h"},{"name":"Basic Bath","priceType":"Starts at","price":"400","duration":"1h"},{"name":"Teddy Bear Cut","priceType":"Fixed price","price":"1200","duration":"2.5h"}]'::jsonb,
     '{"small":"400","medium":"700","large":"1000"}'::jsonb,
     '[{"name":"Color Chalk","price":"300","type":"One-time"},{"name":"Aromatherapy Bath","price":"400","type":"One-time"},{"name":"Paw Balm","price":"100","type":"One-time"}]'::jsonb,
     '{}'::jsonb,
     '{"serviceFee":"10%","taxes":"Included","noShow":"₱600"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash","Card"],"refundPolicy":"Full refund 12hrs before"}'::jsonb,
     'High-end Davao grooming. Instagram-worthy results.'),

    (p27,
     '[{"name":"Standard Room","priceType":"Fixed price","price":"400","duration":"24h"},{"name":"Comfort Room","priceType":"Fixed price","price":"600","duration":"24h"},{"name":"Vet Consultation","priceType":"Fixed price","price":"450","duration":"30min"}]'::jsonb,
     '{"small":"350","medium":"400","large":"550","cats":"300"}'::jsonb,
     '[{"name":"Daily Vet Round","price":"0","type":"Included"},{"name":"Vaccination","price":"300","type":"One-time"}]'::jsonb,
     '{"generalConsult":"450","vaccination":"300","deworming":"200"}'::jsonb,
     '{"serviceFee":"8%","taxes":"Included","noShow":"₱400"}'::jsonb,
     '{"deposit":true,"methods":["GCash","Cash"],"refundPolicy":"Full refund 24hrs before"}'::jsonb,
     'Affordable boarding with daily vet rounds included at no extra charge.');


  -- ============================================================
  -- PROPERTY LEGAL
  -- ============================================================
  insert into property_legal (property_id, legal_entity_type, contracting_party, contracting_party_address, lgu_permits, legal_agreements)
  values
    (p13, 'individual',
     '{"firstName":"Ramon","middleName":"","lastName":"Aquino","email":"ramon.bantaypaws@gmail.com","phone":"9291112222","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"55 Rizal Avenue Extension","addressLine2":"","city":"Caloocan","postalCode":"1400"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p13-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p14, 'business',
     '{"firstName":"Sophia","middleName":"","lastName":"Yamamoto","email":"sophia@luxepaws.ph","phone":"9292223333","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"Greenbelt 5, Ayala Center","addressLine2":"7F","city":"Makati","postalCode":"1224"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p14-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p15, 'business',
     '{"firstName":"Catherine","middleName":"","lastName":"Lim","email":"catherine@meowmanor.ph","phone":"9293334444","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"12 Katipunan Avenue","addressLine2":"Loyola Heights","city":"Quezon City","postalCode":"1108"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p15-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p16, 'business',
     '{"firstName":"Antonio","middleName":"","lastName":"Reyes","email":"antonio@makativet247.com","phone":"9294445555","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"200 Gil Puyat Avenue","addressLine2":"Salcedo Village","city":"Makati","postalCode":"1227"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p16-lgu-permit.pdf,https://storage.pawstay.ph/legal/p16-bai-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p17, 'individual',
     '{"firstName":"Jenny","middleName":"","lastName":"Ong","email":"jenny.quickclip@gmail.com","phone":"9295556666","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"SM Megamall Building A","addressLine2":"3F","city":"Mandaluyong","postalCode":"1550"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p17-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p18, 'business',
     '{"firstName":"Marco","middleName":"","lastName":"Tan","email":"marco@subicpetresort.ph","phone":"9296667777","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"Lot 5 Waterfront Road","addressLine2":"SBFZ","city":"Subic Bay","postalCode":"2222"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p18-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p19, 'business',
     '{"firstName":"Maria","middleName":"","lastName":"Gonzales","email":"maria@cebupethaven.ph","phone":"9297778888","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"88 Archbishop Reyes Avenue","addressLine2":"Banilad","city":"Cebu City","postalCode":"6000"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p19-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p20, 'individual',
     '{"firstName":"Paolo","middleName":"","lastName":"Rivera","email":"paolo.shoecity@gmail.com","phone":"9298889999","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"22 J.P. Rizal Street","addressLine2":"Sto. Niño","city":"Marikina","postalCode":"1800"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p20-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p21, 'business',
     '{"firstName":"Dr. Andrea","middleName":"","lastName":"Santos","email":"andrea@exoticpetsmnl.com","phone":"9301112222","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"45 United Nations Avenue","addressLine2":"Ermita","city":"Manila","postalCode":"1000"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p21-lgu-permit.pdf,https://storage.pawstay.ph/legal/p21-bai-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p22, 'business',
     '{"firstName":"Kevin","middleName":"","lastName":"Chua","email":"kevin@goodboygrooming.ph","phone":"9302223333","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"Bonifacio Stopover, 31st Street","addressLine2":"GF","city":"Taguig","postalCode":"1634"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p22-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p23, 'individual',
     '{"firstName":"Lorna","middleName":"","lastName":"Dimaculangan","email":"lorna.lipapaws@gmail.com","phone":"9303334444","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"15 CM Recto Avenue","addressLine2":"","city":"Lipa City","postalCode":"4217"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p23-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p24, 'business',
     '{"firstName":"Dr. Sarah","middleName":"","lastName":"Villanueva","email":"sarah@petmdwellness.ph","phone":"9304445555","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"99 Timog Avenue","addressLine2":"South Triangle","city":"Quezon City","postalCode":"1103"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p24-lgu-permit.pdf,https://storage.pawstay.ph/legal/p24-bai-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p25, 'business',
     '{"firstName":"Eduardo","middleName":"","lastName":"Manalo","email":"eduardo@clarkfurlodge.ph","phone":"9305556666","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"Lot 12, Friendship Highway","addressLine2":"","city":"Angeles City","postalCode":"2009"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p25-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p26, 'business',
     '{"firstName":"Isabella","middleName":"","lastName":"Tanaka","email":"isabella@pawshstudio.ph","phone":"9306667777","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"Abreeza Mall, J.P. Laurel Avenue","addressLine2":"GF","city":"Davao City","postalCode":"8000"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p26-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb),
    (p27, 'business',
     '{"firstName":"Ricardo","middleName":"","lastName":"Pascual","email":"ricardo@metropawscare.ph","phone":"9307778888","phoneCountryCode":"+63"}'::jsonb,
     '{"country":"Philippines","streetAddress":"321 Taft Avenue","addressLine2":"Malate","city":"Manila","postalCode":"1004"}'::jsonb,
     '{https://storage.pawstay.ph/legal/p27-lgu-permit.pdf}',
     '{"termsAccepted":true,"dataProcessing":true,"finalAgreementAccepted":true}'::jsonb);


  -- ============================================================
  -- PROPERTY SERVICES
  -- ============================================================
  insert into property_services (property_id, name, description, price, category)
  values
    -- p13: Budget hotel
    (p13, 'Basic Overnight',        'Simple room with food and water',                    250, 'Boarding'),

    -- p14: Luxury grooming
    (p14, 'Signature Grooming',     'Full grooming with Japanese techniques',             2000, 'Grooming'),
    (p14, 'Japanese Scissor Cut',   'Precision scissor cut by certified stylist',         2500, 'Grooming'),
    (p14, 'Spa & Pamper Package',   'Grooming + mud mask + blueberry facial',             1800, 'Grooming'),

    -- p15: Cat-only hotel
    (p15, 'Cat Condo Stay',         'Individual cat condo with climbing shelf',            600, 'Boarding'),
    (p15, 'Premium Cat Suite',      'Spacious suite with window view and toys',            900, 'Boarding'),
    (p15, 'Cat Daycare',            'Half-day supervised play in cat lounge',              350, 'Daycare'),

    -- p16: 24/7 Vet hospital
    (p16, 'Emergency Consultation', 'Urgent care by board-certified vet',                 1500, 'Veterinary'),
    (p16, 'General Check-up',       'Comprehensive physical examination',                  600, 'Veterinary'),
    (p16, 'Vaccination',            'Core and non-core vaccines',                          350, 'Veterinary'),
    (p16, 'Surgery',                'General and orthopedic surgery',                     8000, 'Veterinary'),
    (p16, 'ICU Stay (per day)',     'Intensive care unit monitoring',                     3000, 'Veterinary'),

    -- p17: Cheap grooming
    (p17, 'Express Bath',           'Quick shampoo and blow dry',                          150, 'Grooming'),
    (p17, 'Full Grooming',          'Bath, haircut, nails, ears',                          300, 'Grooming'),
    (p17, 'Nail Trim Only',         'Quick nail clipping',                                  80, 'Grooming'),

    -- p18: Luxury beach resort
    (p18, 'Beach Cabana',           'Private cabana with ocean view',                     2000, 'Boarding'),
    (p18, 'VIP Villa',              'Luxury villa with personal attendant',               3500, 'Boarding'),
    (p18, 'Pool Day Pass',          'Half-day pool and beach access',                      800, 'Daycare'),
    (p18, 'Spa Grooming',           'Resort-style full grooming with organic products',   1500, 'Grooming'),

    -- p19: All-in-one Cebu
    (p19, 'Standard Room',          'Comfortable boarding room',                           500, 'Boarding'),
    (p19, 'Grooming Package',       'Full grooming service',                               450, 'Grooming'),
    (p19, 'Vet Consultation',       'General health check-up',                             400, 'Veterinary'),

    -- p20: Marikina hotel
    (p20, 'Riverside Room',         'Room with riverside walking trail access',            450, 'Boarding'),
    (p20, 'Deluxe Room',            'Larger room with premium bedding',                    700, 'Boarding'),

    -- p21: Exotic vet
    (p21, 'Exotic Pet Consultation','Specialist exam for exotic species',                  800, 'Veterinary'),
    (p21, 'Bird Health Check',      'Avian health assessment and exam',                    600, 'Veterinary'),
    (p21, 'Rabbit Dental',          'Dental check and filing for rabbits',                1200, 'Veterinary'),

    -- p22: Dog-only grooming BGC
    (p22, 'Show Grooming',          'Competition-level grooming and styling',             1200, 'Grooming'),
    (p22, 'Standard Grooming',      'Professional full-service grooming',                  600, 'Grooming'),
    (p22, 'Bath & Tidy',            'Bath with light trimming',                            400, 'Grooming'),
    (p22, 'Hand Stripping',         'Traditional hand-stripping for wire-coated breeds',  1500, 'Grooming'),

    -- p23: Budget Batangas hotel
    (p23, 'Basic Room',             'Simple room with basic amenities',                    200, 'Boarding'),

    -- p24: Premium wellness QC
    (p24, 'Dermatology Consult',    'Skin condition assessment by specialist',             800, 'Veterinary'),
    (p24, 'Therapeutic Bath',       'Medicated bath for skin conditions',                  700, 'Grooming'),
    (p24, 'General Check-up',       'Comprehensive health examination',                    500, 'Veterinary'),
    (p24, 'Medicated Grooming',     'Full grooming with prescription shampoo',             900, 'Grooming'),

    -- p25: Clark hotel
    (p25, 'Standard Kennel',        'Spacious outdoor kennel with shade',                  400, 'Boarding'),
    (p25, 'Large Run',              'Extra-large run for big dogs',                        650, 'Boarding'),
    (p25, 'Daycare',                'Half-day supervised outdoor activities',              250, 'Daycare'),

    -- p26: Premium grooming Davao
    (p26, 'Pawsh Cut',              'Signature style cut with premium products',          1000, 'Grooming'),
    (p26, 'Creative Styling',       'Fun creative color and styling',                     1500, 'Grooming'),
    (p26, 'Basic Bath',             'Shampoo, rinse, blow dry',                            400, 'Grooming'),
    (p26, 'Teddy Bear Cut',         'Adorable teddy bear style grooming',                 1200, 'Grooming'),

    -- p27: Manila hotel + vet
    (p27, 'Standard Room',          'Basic boarding with daily vet rounds',                400, 'Boarding'),
    (p27, 'Comfort Room',           'Upgraded room with premium bedding',                  600, 'Boarding'),
    (p27, 'Vet Consultation',       'General check-up by resident vet',                    450, 'Veterinary');


  raise notice 'Extra seed complete — 15 additional properties (p13–p27) with setup, amenities, pricing, legal, and services inserted successfully!';
end $$;