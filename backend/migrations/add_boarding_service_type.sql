-- Add 'boarding' as a valid service_type in pet_service_history
-- Also update existing entries that have 'other' but are actually boarding

ALTER TABLE pet_service_history DROP CONSTRAINT IF EXISTS pet_service_history_service_type_check;
ALTER TABLE pet_service_history ADD CONSTRAINT pet_service_history_service_type_check
  CHECK (service_type IN ('grooming','checkup','vaccination','dental','boarding','other'));

-- Update existing 'other' entries that are linked to boarding bookings
UPDATE pet_service_history psh
SET service_type = 'boarding'
FROM bookings b
WHERE psh.booking_id = b.id
  AND b.service_type = 'boarding'
  AND psh.service_type = 'other';
