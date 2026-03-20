-- Allow PayMaya as settlement_method for proprietor settlements.
-- Keep existing methods for backward compatibility with historical rows.

ALTER TABLE proprietor_settlements
  DROP CONSTRAINT IF EXISTS proprietor_settlements_settlement_method_check;

ALTER TABLE proprietor_settlements
  ADD CONSTRAINT proprietor_settlements_settlement_method_check
  CHECK (
    settlement_method IN (
      'cash',
      'gcash',
      'paymaya',
      'bank_transfer',
      'card',
      'check',
      NULL
    )
  );
