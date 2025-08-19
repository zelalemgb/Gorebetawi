/*
  # Update business and report relationships

  1. Changes
    - Ensure proper foreign key relationship between reports and businesses
    - Add missing columns if they don't exist

  2. Security
    - No changes to RLS policies
*/

-- Add sponsored columns to reports if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'is_sponsored'
  ) THEN
    ALTER TABLE reports ADD COLUMN is_sponsored boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'sponsored_by'
  ) THEN
    ALTER TABLE reports ADD COLUMN sponsored_by uuid REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN expires_at timestamptz;
  END IF;
END $$;