-- Create a simple platform_settings table for single-row site configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  name text NOT NULL,
  commission_percent numeric NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default row if not exists
INSERT INTO platform_settings (key, name, commission_percent)
VALUES ('site', 'PawStay', 10)
ON CONFLICT (key) DO NOTHING;
