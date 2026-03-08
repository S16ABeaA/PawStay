-- ============================================================
-- Migration: Receivable & Settlement Tracking
-- Purpose: Track monthly receivables (service_fee owed by proprietors)
--          and settlements (payments received from proprietors).
--
-- Architecture:
--   Receivable is BORN when a booking reaches 'completed' or 'checked_out'.
--   Receivable is SETTLED when an entry is recorded in proprietor_settlements.
--   Monthly receivable = SUM(service_fee finalized in month) - SUM(settled in month)
-- ============================================================

-- 1. Add finalized_at to bookings (timestamp when booking became completed/checked_out)
--    This is the canonical "receivable date" — the month a receivable belongs to.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS finalized_at timestamptz;

-- Backfill finalized_at for existing finalized bookings (use updated_at as best approximation)
UPDATE bookings
SET finalized_at = COALESCE(updated_at, created_at)
WHERE status IN ('completed', 'checked_out')
  AND finalized_at IS NULL;

-- Index for monthly receivable queries
CREATE INDEX IF NOT EXISTS idx_bookings_finalized_at ON bookings(finalized_at)
  WHERE finalized_at IS NOT NULL;

-- Composite index for receivable aggregation queries
CREATE INDEX IF NOT EXISTS idx_bookings_receivable_lookup
  ON bookings(status, finalized_at)
  WHERE is_deleted = false
    AND status IN ('completed', 'checked_out')
    AND finalized_at IS NOT NULL;


-- 2. Create proprietor_settlements table
--    Each row = one payment/collection from a proprietor to the platform.
--    Links to specific bookings through the join table below.
CREATE TABLE IF NOT EXISTS proprietor_settlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietor_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  property_id     uuid NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,

  -- Amount settled in this transaction
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),

  -- Settlement metadata
  settlement_method text CHECK (settlement_method IN ('cash','gcash','bank_transfer','card','check','offset',NULL)),
  reference_no    text,                 -- external payment reference
  notes           text,

  -- Status lifecycle
  status          text NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('pending','completed','failed','reversed')),

  -- Period this settlement covers (optional, for reporting)
  period_month    date,                 -- e.g. '2026-03-01' means March 2026

  settled_at      timestamptz NOT NULL DEFAULT now(),  -- when payment was received
  created_by      uuid REFERENCES profiles(id),        -- super_admin who recorded it
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prop_settlements_proprietor ON proprietor_settlements(proprietor_id);
CREATE INDEX IF NOT EXISTS idx_prop_settlements_property   ON proprietor_settlements(property_id);
CREATE INDEX IF NOT EXISTS idx_prop_settlements_status     ON proprietor_settlements(status);
CREATE INDEX IF NOT EXISTS idx_prop_settlements_settled_at ON proprietor_settlements(settled_at);
CREATE INDEX IF NOT EXISTS idx_prop_settlements_period     ON proprietor_settlements(period_month);


-- 3. Join table: which bookings are covered by which settlement
--    Prevents double-settling the same booking and allows partial tracking.
CREATE TABLE IF NOT EXISTS settlement_bookings (
  settlement_id   uuid NOT NULL REFERENCES proprietor_settlements(id) ON DELETE CASCADE,
  booking_id      uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount          numeric(12,2) NOT NULL CHECK (amount >= 0),  -- portion of service_fee settled
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (settlement_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_settlement_bookings_booking ON settlement_bookings(booking_id);


-- 4. RLS policies
ALTER TABLE proprietor_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_bookings    ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Superadmins manage settlements" ON proprietor_settlements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Superadmins manage settlement_bookings" ON settlement_bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Proprietors can view their own settlements
CREATE POLICY "Proprietors view own settlements" ON proprietor_settlements
  FOR SELECT USING (proprietor_id = auth.uid());


-- 5. Trigger: auto-set finalized_at when booking status changes to completed/checked_out
CREATE OR REPLACE FUNCTION set_booking_finalized_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('completed', 'checked_out')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'checked_out'))
     AND NEW.finalized_at IS NULL
  THEN
    NEW.finalized_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_booking_finalized_at ON bookings;
CREATE TRIGGER trg_set_booking_finalized_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_finalized_at();

-- Also handle INSERT (e.g. walk-in bookings created directly as completed)
DROP TRIGGER IF EXISTS trg_set_booking_finalized_at_insert ON bookings;
CREATE TRIGGER trg_set_booking_finalized_at_insert
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_finalized_at();


-- 6. Auto-update updated_at on proprietor_settlements
CREATE OR REPLACE FUNCTION set_settlement_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_settlement_updated_at ON proprietor_settlements;
CREATE TRIGGER trg_settlement_updated_at
  BEFORE UPDATE ON proprietor_settlements
  FOR EACH ROW
  EXECUTE FUNCTION set_settlement_updated_at();


-- 7. Materialized view for fast monthly receivable dashboard queries
--    NOTE: We pre-aggregate settled amounts per booking first, then GROUP BY
--    month.  The previous version used LEFT JOIN LATERAL inside the GROUP BY
--    which incorrectly duplicated rows when a booking had multiple settlements.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_receivables AS
WITH booking_settled AS (
  -- Total already-settled amount per booking
  SELECT sb.booking_id, SUM(sb.amount) AS settled
  FROM   settlement_bookings sb
  JOIN   proprietor_settlements ps ON ps.id = sb.settlement_id
  WHERE  ps.status = 'completed'
  GROUP  BY sb.booking_id
)
SELECT
  p.owner_id                        AS proprietor_id,
  b.property_id,
  date_trunc('month', b.finalized_at) AS month,
  SUM(b.service_fee)                AS generated,
  SUM(COALESCE(bs.settled, 0))      AS settled,
  SUM(b.service_fee) - SUM(COALESCE(bs.settled, 0)) AS outstanding
FROM bookings b
JOIN properties p            ON p.id = b.property_id
LEFT JOIN booking_settled bs ON bs.booking_id = b.id
WHERE b.is_deleted = false
  AND b.status IN ('completed', 'checked_out')
  AND b.payment_status <> 'refunded'
  AND b.finalized_at IS NOT NULL
GROUP BY p.owner_id, b.property_id, date_trunc('month', b.finalized_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_recv_pk
  ON mv_monthly_receivables(proprietor_id, property_id, month);

-- Helper function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_monthly_receivables()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_receivables;
END;
$$;


-- 8. Guard against over-settling a booking
--    Ensure that the total allocated in settlement_bookings never exceeds
--    the booking's service_fee.
CREATE OR REPLACE FUNCTION check_settlement_booking_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_fee       numeric(12,2);
  v_allocated numeric(12,2);
BEGIN
  SELECT service_fee INTO v_fee FROM bookings WHERE id = NEW.booking_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_allocated
    FROM settlement_bookings
    WHERE booking_id = NEW.booking_id
      AND settlement_id <> NEW.settlement_id;  -- exclude current row on UPDATE

  IF (v_allocated + NEW.amount) > v_fee THEN
    RAISE EXCEPTION 'Over-settlement: booking % fee is %, already settled %, attempted %',
      NEW.booking_id, v_fee, v_allocated, NEW.amount;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_settlement_limit ON settlement_bookings;
CREATE TRIGGER trg_check_settlement_limit
  BEFORE INSERT OR UPDATE ON settlement_bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_settlement_booking_limit();
