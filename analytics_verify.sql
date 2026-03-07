-- ============================================================
-- PawStay Analytics — SQL Verification Script
-- Run in Supabase SQL Editor to cross-check dashboard numbers.
-- Change the range value in the first CTE to test different periods:
--   '7d', '30d', '3m', '6m', '12m'
-- ============================================================

-- ============================================================
-- 1. OVERVIEW KPI CARDS
-- ============================================================

-- 1a. Total Approved Properties (no date filter)
SELECT COUNT(*) AS total_properties
FROM properties
WHERE status = 'approved'
  AND is_deleted = false;

-- 1b. Average Rating (all reviews, no date filter)
SELECT ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM reviews;

-- 1c. Main Overview Metrics
WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since
  FROM params
)
SELECT
  -- Total bookings (by created_at)
  COUNT(*) AS total_bookings,

  -- Total revenue (paid bookings by checkout/checkin date)
  COALESCE(SUM(CASE
    WHEN payment_status = 'paid'
     AND COALESCE(checkout, checkin) >= CURRENT_DATE - ri.since
    THEN total_price ELSE 0
  END), 0) AS total_revenue,

  -- Paid booking count in range (by checkout/checkin) — for avg spend
  COUNT(CASE
    WHEN payment_status = 'paid'
     AND COALESCE(checkout, checkin) >= CURRENT_DATE - ri.since
    THEN 1
  END) AS paid_count,

  -- Avg spend per paid booking
  ROUND(
    COALESCE(SUM(CASE
      WHEN payment_status = 'paid'
       AND COALESCE(checkout, checkin) >= CURRENT_DATE - ri.since
      THEN total_price ELSE 0
    END), 0)
    /
    GREATEST(COUNT(CASE
      WHEN payment_status = 'paid'
       AND COALESCE(checkout, checkin) >= CURRENT_DATE - ri.since
      THEN 1
    END), 1)
  , 2) AS avg_spend,

  -- Paid bookings count by created_at — for conversion rate
  COUNT(CASE
    WHEN payment_status = 'paid'
    THEN 1
  END) AS paid_in_period,

  -- Conversion rate (paid by created_at / total by created_at)
  ROUND(
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)::numeric
    / GREATEST(COUNT(*), 1) * 100
  , 1) AS conversion_rate

FROM bookings, range_interval ri
WHERE is_deleted = false
  AND created_at >= CURRENT_DATE - ri.since;

-- 1d. Total Users (by created_at)
WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since
  FROM params
)
SELECT COUNT(*) AS total_users
FROM profiles, range_interval ri
WHERE is_deleted = false
  AND created_at >= CURRENT_DATE - ri.since;


-- ============================================================
-- 2. BOOKING TRENDS (bookings + revenue grouped by period)
--    Uses daily grouping for 7d/30d, monthly for 3m/6m/12m
--    Bookings grouped by created_at, revenue by checkout date
-- ============================================================

WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since,
  CASE WHEN params.range IN ('7d','30d') THEN 'YYYY-MM-DD' ELSE 'YYYY-MM' END AS fmt
  FROM params
),
booking_counts AS (
  SELECT TO_CHAR(created_at AT TIME ZONE 'Asia/Manila', ri.fmt) AS period,
         COUNT(*) AS bookings
  FROM bookings, range_interval ri
  WHERE is_deleted = false
    AND created_at >= CURRENT_DATE - ri.since
  GROUP BY period
),
revenue_by_period AS (
  SELECT TO_CHAR(COALESCE(checkout, checkin), ri.fmt) AS period,
         ROUND(SUM(total_price)::numeric, 2) AS revenue
  FROM bookings, range_interval ri
  WHERE is_deleted = false
    AND payment_status = 'paid'
    AND COALESCE(checkout, checkin) >= CURRENT_DATE - ri.since
  GROUP BY period
)
SELECT COALESCE(bc.period, rp.period) AS period,
       COALESCE(bc.bookings, 0) AS bookings,
       COALESCE(rp.revenue, 0) AS revenue
FROM booking_counts bc
FULL OUTER JOIN revenue_by_period rp ON bc.period = rp.period
ORDER BY period;


-- ============================================================
-- 3. SERVICE BREAKDOWN (by property_type)
--    Count by created_at, revenue by checkout date
-- ============================================================

WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since
  FROM params
),
booking_counts AS (
  SELECT p.property_type[1] AS type,
         COUNT(*) AS count
  FROM bookings b
  JOIN properties p ON b.property_id = p.id
  CROSS JOIN range_interval ri
  WHERE b.is_deleted = false
    AND b.created_at >= CURRENT_DATE - ri.since
  GROUP BY type
),
revenue_by_type AS (
  SELECT p.property_type[1] AS type,
         ROUND(SUM(b.total_price)::numeric, 2) AS revenue
  FROM bookings b
  JOIN properties p ON b.property_id = p.id
  CROSS JOIN range_interval ri
  WHERE b.is_deleted = false
    AND b.payment_status = 'paid'
    AND COALESCE(b.checkout, b.checkin) >= CURRENT_DATE - ri.since
  GROUP BY type
)
SELECT COALESCE(bc.type, rt.type) AS type,
       COALESCE(bc.count, 0) AS count,
       COALESCE(rt.revenue, 0) AS revenue,
       ROUND(COALESCE(bc.count, 0)::numeric / GREATEST((SELECT SUM(count) FROM booking_counts), 1) * 100) AS percentage
FROM booking_counts bc
FULL OUTER JOIN revenue_by_type rt ON bc.type = rt.type
ORDER BY count DESC;


-- ============================================================
-- 4. USER GROWTH (new + running total grouped by period)
--    Uses daily grouping for 7d/30d, monthly for 3m/6m/12m
-- ============================================================

WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since,
  CASE WHEN params.range IN ('7d','30d') THEN 'YYYY-MM-DD' ELSE 'YYYY-MM' END AS fmt
  FROM params
),
users_before AS (
  SELECT COUNT(*) AS cnt
  FROM profiles, range_interval ri
  WHERE is_deleted = false
    AND created_at < CURRENT_DATE - ri.since
),
period_data AS (
  SELECT TO_CHAR(created_at AT TIME ZONE 'Asia/Manila', ri.fmt) AS period,
         COUNT(*) AS new_users
  FROM profiles, range_interval ri
  WHERE is_deleted = false
    AND created_at >= CURRENT_DATE - ri.since
  GROUP BY period
)
SELECT pd.period,
       pd.new_users,
       ub.cnt + SUM(pd.new_users) OVER (ORDER BY pd.period) AS running_total
FROM period_data pd, users_before ub
ORDER BY pd.period;


-- ============================================================
-- 5. TOP LOCATIONS (cities ranked by booking count)
-- ============================================================

WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since
  FROM params
),
booking_counts AS (
  SELECT p.city,
         COUNT(*) AS bookings
  FROM bookings b
  JOIN properties p ON b.property_id = p.id
  CROSS JOIN range_interval ri
  WHERE b.is_deleted = false
    AND b.created_at >= CURRENT_DATE - ri.since
  GROUP BY p.city
),
revenue_by_city AS (
  SELECT p.city,
         ROUND(SUM(b.total_price)::numeric, 2) AS revenue
  FROM bookings b
  JOIN properties p ON b.property_id = p.id
  CROSS JOIN range_interval ri
  WHERE b.is_deleted = false
    AND b.payment_status = 'paid'
    AND COALESCE(b.checkout, b.checkin) >= CURRENT_DATE - ri.since
  GROUP BY p.city
),
property_counts AS (
  SELECT city, COUNT(*) AS properties
  FROM properties
  WHERE status = 'approved' AND is_deleted = false
  GROUP BY city
)
SELECT COALESCE(bc.city, rc.city) AS city,
       COALESCE(bc.bookings, 0) AS bookings,
       COALESCE(rc.revenue, 0) AS revenue,
       COALESCE(pc.properties, 0) AS properties
FROM booking_counts bc
FULL OUTER JOIN revenue_by_city rc ON bc.city = rc.city
LEFT JOIN property_counts pc ON COALESCE(bc.city, rc.city) = pc.city
ORDER BY bookings DESC
LIMIT 10;


-- ============================================================
-- 6. TOP PROPERTIES (ranked by booking count)
-- ============================================================

WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since
  FROM params
),
booking_counts AS (
  SELECT b.property_id,
         COUNT(*) AS bookings
  FROM bookings b
  CROSS JOIN range_interval ri
  WHERE b.is_deleted = false
    AND b.created_at >= CURRENT_DATE - ri.since
  GROUP BY b.property_id
),
revenue_by_prop AS (
  SELECT b.property_id,
         ROUND(SUM(b.total_price)::numeric, 2) AS revenue
  FROM bookings b
  CROSS JOIN range_interval ri
  WHERE b.is_deleted = false
    AND b.payment_status = 'paid'
    AND COALESCE(b.checkout, b.checkin) >= CURRENT_DATE - ri.since
  GROUP BY b.property_id
)
SELECT p.name,
       p.city AS location,
       COALESCE(bc.bookings, 0) AS bookings,
       COALESCE(rp.revenue, 0) AS revenue,
       COALESCE(p.rating, 0) AS rating
FROM booking_counts bc
LEFT JOIN revenue_by_prop rp ON bc.property_id = rp.property_id
JOIN properties p ON bc.property_id = p.id
ORDER BY bookings DESC
LIMIT 10;


-- ============================================================
-- 7. BOOKING PATTERNS (day-of-week + hour, by created_at in PHT)
-- ============================================================

WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since
  FROM params
)
-- Weekly pattern (Mon=1 … Sun=0 in JS, but Postgres ISODOW: Mon=1 … Sun=7)
SELECT
  EXTRACT(ISODOW FROM created_at AT TIME ZONE 'Asia/Manila')::int % 7 AS day_index,
  COUNT(*) AS bookings
FROM bookings, range_interval ri
WHERE is_deleted = false
  AND created_at >= CURRENT_DATE - ri.since
GROUP BY day_index
ORDER BY day_index;

-- Hourly pattern (6–22 PHT)
WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since
  FROM params
)
SELECT
  EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Manila')::int AS hour,
  COUNT(*) AS bookings
FROM bookings, range_interval ri
WHERE is_deleted = false
  AND created_at >= CURRENT_DATE - ri.since
  AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Manila') BETWEEN 6 AND 22
GROUP BY hour
ORDER BY hour;


-- ============================================================
-- 8. PREVIOUS PERIOD COMPARISON (bookings change % + revenue change %)
--    Compares current period vs same-length previous period
-- ============================================================

WITH params AS (
  SELECT '12m'::text AS range
),
range_interval AS (
  SELECT CASE params.range
    WHEN '12m' THEN INTERVAL '12 months'
    WHEN '6m'  THEN INTERVAL '6 months'
    WHEN '3m'  THEN INTERVAL '3 months'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '7d'  THEN INTERVAL '7 days'
  END AS since
  FROM params
),
current_period AS (
  SELECT
    COUNT(*) AS bookings,
    COALESCE(SUM(CASE
      WHEN payment_status = 'paid'
       AND COALESCE(checkout, checkin) >= CURRENT_DATE - ri.since
      THEN total_price ELSE 0
    END), 0) AS revenue
  FROM bookings, range_interval ri
  WHERE is_deleted = false
    AND created_at >= CURRENT_DATE - ri.since
),
prev_period AS (
  SELECT
    COUNT(*) AS bookings,
    COALESCE(SUM(CASE
      WHEN payment_status = 'paid'
       AND COALESCE(checkout, checkin) >= CURRENT_DATE - ri.since * 2
       AND COALESCE(checkout, checkin) < CURRENT_DATE - ri.since
      THEN total_price ELSE 0
    END), 0) AS revenue
  FROM bookings, range_interval ri
  WHERE is_deleted = false
    AND created_at >= CURRENT_DATE - ri.since * 2
    AND created_at < CURRENT_DATE - ri.since
)
SELECT
  cp.bookings AS current_bookings,
  pp.bookings AS prev_bookings,
  CASE WHEN pp.bookings > 0
    THEN ROUND(((cp.bookings - pp.bookings)::numeric / pp.bookings) * 100, 1)
    ELSE 0
  END AS bookings_change_pct,
  cp.revenue AS current_revenue,
  pp.revenue AS prev_revenue,
  CASE WHEN pp.revenue > 0
    THEN ROUND(((cp.revenue - pp.revenue) / pp.revenue) * 100, 1)
    ELSE 0
  END AS revenue_change_pct
FROM current_period cp, prev_period pp;
