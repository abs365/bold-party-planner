-- Bold Party Data Consistency Fix
-- Safe production cleanup migration

-- Normalize vendor media types
UPDATE vendor_media
SET type = 'image'
WHERE type = 'photo';

-- Normalize event statuses
UPDATE events
SET status = 'planning'
WHERE status = 'active';

-- Ensure updated_at consistency
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add missing updated_at triggers safely
DO $$
BEGIN

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors'
    AND column_name = 'updated_at'
  ) THEN

    DROP TRIGGER IF EXISTS set_vendors_updated_at ON vendors;

    CREATE TRIGGER set_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  END IF;

END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status
ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_events_status
ON events(status);

CREATE INDEX IF NOT EXISTS idx_vendors_status
ON vendors(status);

-- Final consistency log
DO $$
BEGIN
  RAISE NOTICE '008_data_consistency_fix.sql completed successfully';
END $$;