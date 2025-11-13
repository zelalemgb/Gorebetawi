/*
  # Phase 1: Data Integrity & Type Safety
  
  ## Overview
  This migration implements critical data integrity improvements to ensure type safety,
  data validation, and proper spatial data handling.
  
  ## Changes Made
  
  ### 1. Create ENUMs for Categorical Data
  - `user_role` - Defines valid user roles (citizen, business, admin)
  - `business_type` - Defines valid business types (gas_station, water_supplier, other)
  - `business_category` - Defines valid business categories matching report categories
  - `report_category` - Defines valid report categories (light, water, fuel, price, security, health, infrastructure, other)
  - `report_status` - Defines valid report statuses (open, in_progress, resolved, rejected)
  - `business_status` - Defines valid business verification statuses (pending, approved, rejected)
  
  ### 2. Migrate Existing Data to ENUMs
  - Safely converts text columns to enum types
  - Preserves all existing data
  - Uses temporary columns to avoid data loss
  
  ### 3. Fix Geometry Types
  - Converts `point` to `geometry(Point, 4326)` for proper spatial operations
  - Adds SRID (Spatial Reference System Identifier) for accurate geospatial queries
  - Enables PostGIS spatial functions
  
  ### 4. Add CHECK Constraints
  - Ensures confirmations count is non-negative
  - Validates anonymous reports don't have user_id set
  - Validates phone number format
  - Ensures sponsored reports have valid expiration dates
  
  ## Benefits
  - **Data Integrity**: Prevents invalid values at database level
  - **Type Safety**: Enables better query optimization
  - **Storage Efficiency**: ENUMs use less space than text
  - **Maintainability**: Self-documenting valid values
  - **Spatial Accuracy**: Proper coordinate system for distance calculations
*/

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('citizen', 'business', 'admin');
CREATE TYPE business_type AS ENUM ('gas_station', 'water_supplier', 'other');
CREATE TYPE business_category AS ENUM ('light', 'water', 'fuel', 'price', 'security', 'health', 'infrastructure', 'other');
CREATE TYPE report_category AS ENUM ('light', 'water', 'fuel', 'price', 'security', 'health', 'infrastructure', 'other');
CREATE TYPE report_status AS ENUM ('open', 'in_progress', 'resolved', 'rejected');
CREATE TYPE business_status AS ENUM ('pending', 'approved', 'rejected');

-- Drop existing policies that depend on columns we're changing
DROP POLICY IF EXISTS "Anyone can view approved businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can view their own businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can insert their own businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can update their own businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can delete their own businesses" ON businesses;

DROP POLICY IF EXISTS "Anyone can view all reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Report creators can update their own reports" ON reports;
DROP POLICY IF EXISTS "Report creators can delete their own reports" ON reports;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Migrate users.role to ENUM
ALTER TABLE users ADD COLUMN role_new user_role;
UPDATE users SET role_new = 
  CASE 
    WHEN role = 'citizen' THEN 'citizen'::user_role
    WHEN role = 'business' THEN 'business'::user_role
    WHEN role = 'admin' THEN 'admin'::user_role
    ELSE 'citizen'::user_role
  END;
ALTER TABLE users ALTER COLUMN role_new SET DEFAULT 'citizen'::user_role;
ALTER TABLE users ALTER COLUMN role_new SET NOT NULL;
ALTER TABLE users DROP COLUMN role;
ALTER TABLE users RENAME COLUMN role_new TO role;

-- Migrate businesses.type to ENUM
ALTER TABLE businesses ADD COLUMN type_new business_type;
UPDATE businesses SET type_new = 
  CASE 
    WHEN type = 'gas_station' THEN 'gas_station'::business_type
    WHEN type = 'water_supplier' THEN 'water_supplier'::business_type
    ELSE 'other'::business_type
  END;
ALTER TABLE businesses ALTER COLUMN type_new SET NOT NULL;
ALTER TABLE businesses DROP COLUMN type;
ALTER TABLE businesses RENAME COLUMN type_new TO type;

-- Migrate businesses.category to ENUM
ALTER TABLE businesses ADD COLUMN category_new business_category;
UPDATE businesses SET category_new = 
  CASE 
    WHEN category = 'light' THEN 'light'::business_category
    WHEN category = 'water' THEN 'water'::business_category
    WHEN category = 'fuel' THEN 'fuel'::business_category
    WHEN category = 'price' THEN 'price'::business_category
    WHEN category = 'security' THEN 'security'::business_category
    WHEN category = 'health' THEN 'health'::business_category
    WHEN category = 'infrastructure' THEN 'infrastructure'::business_category
    ELSE 'other'::business_category
  END;
ALTER TABLE businesses ALTER COLUMN category_new SET NOT NULL;
ALTER TABLE businesses DROP COLUMN category;
ALTER TABLE businesses RENAME COLUMN category_new TO category;

-- Migrate businesses.status to ENUM
ALTER TABLE businesses ADD COLUMN status_new business_status;
UPDATE businesses SET status_new = 
  CASE 
    WHEN status = 'pending' THEN 'pending'::business_status
    WHEN status = 'approved' THEN 'approved'::business_status
    WHEN status = 'rejected' THEN 'rejected'::business_status
    ELSE 'pending'::business_status
  END;
ALTER TABLE businesses ALTER COLUMN status_new SET DEFAULT 'pending'::business_status;
ALTER TABLE businesses ALTER COLUMN status_new SET NOT NULL;
ALTER TABLE businesses DROP COLUMN status;
ALTER TABLE businesses RENAME COLUMN status_new TO status;

-- Migrate reports.category to ENUM
ALTER TABLE reports ADD COLUMN category_new report_category;
UPDATE reports SET category_new = 
  CASE 
    WHEN category = 'light' THEN 'light'::report_category
    WHEN category = 'water' THEN 'water'::report_category
    WHEN category = 'fuel' THEN 'fuel'::report_category
    WHEN category = 'price' THEN 'price'::report_category
    WHEN category = 'security' THEN 'security'::report_category
    WHEN category = 'health' THEN 'health'::report_category
    WHEN category = 'infrastructure' THEN 'infrastructure'::report_category
    ELSE 'other'::report_category
  END;
ALTER TABLE reports ALTER COLUMN category_new SET NOT NULL;
ALTER TABLE reports DROP COLUMN category;
ALTER TABLE reports RENAME COLUMN category_new TO category;

-- Migrate reports.status to ENUM
ALTER TABLE reports ADD COLUMN status_new report_status;
UPDATE reports SET status_new = 
  CASE 
    WHEN status = 'open' THEN 'open'::report_status
    WHEN status = 'in_progress' THEN 'in_progress'::report_status
    WHEN status = 'resolved' THEN 'resolved'::report_status
    WHEN status = 'rejected' THEN 'rejected'::report_status
    ELSE 'open'::report_status
  END;
ALTER TABLE reports ALTER COLUMN status_new SET DEFAULT 'open'::report_status;
ALTER TABLE reports ALTER COLUMN status_new SET NOT NULL;
ALTER TABLE reports DROP COLUMN status;
ALTER TABLE reports RENAME COLUMN status_new TO status;

-- Fix geometry types (convert point to geometry(Point, 4326))
DO $$
BEGIN
  -- Check if location is already geometry type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reports' 
    AND column_name = 'location' 
    AND udt_name = 'point'
  ) THEN
    ALTER TABLE reports 
      ALTER COLUMN location TYPE geometry(Point, 4326) 
      USING ST_SetSRID(ST_MakePoint((location[0])::double precision, (location[1])::double precision), 4326);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' 
    AND column_name = 'location' 
    AND udt_name = 'point'
  ) THEN
    ALTER TABLE businesses
      ALTER COLUMN location TYPE geometry(Point, 4326)
      USING ST_SetSRID(ST_MakePoint((location[0])::double precision, (location[1])::double precision), 4326);
  END IF;
END $$;

-- Add CHECK constraints
ALTER TABLE reports 
  ADD CONSTRAINT check_confirmations_non_negative 
  CHECK (confirmations >= 0);

ALTER TABLE reports 
  ADD CONSTRAINT check_anonymous_user_null
  CHECK ((anonymous = true AND user_id IS NULL) OR (anonymous = false));

ALTER TABLE reports
  ADD CONSTRAINT check_sponsored_expiry
  CHECK ((is_sponsored = true AND expires_at IS NOT NULL) OR (is_sponsored = false));

ALTER TABLE businesses
  ADD CONSTRAINT check_phone_format
  CHECK (phone ~ '^\+?[0-9\s\-\(\)]+$');

-- Recreate policies with new ENUM types

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Anyone can view approved businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (status = 'approved'::business_status);

CREATE POLICY "Business owners can view their own businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Business owners can insert their own businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business owners can update their own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business owners can delete their own businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reports policies (improved for security)
CREATE POLICY "Anyone can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND anonymous = false) OR 
    (user_id IS NULL AND anonymous = true)
  );

CREATE POLICY "Report creators can update their own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND anonymous = false)
  WITH CHECK (auth.uid() = user_id AND anonymous = false);

CREATE POLICY "Report creators can delete their own reports"
  ON reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND anonymous = false);
