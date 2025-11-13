/*
  # Phase 4: Full-Text Search and Soft Deletes
  
  ## Overview
  This migration adds advanced features for search functionality and data safety:
  - Full-text search on reports (title + description)
  - Soft delete support for reports and businesses
  - Search ranking and relevance
  
  ## Changes Made
  
  ### 1. Full-Text Search
  **New Column**: `search_vector` (tsvector) on reports table
  - Combines title (weight A - high priority) and description (weight B - lower priority)
  - Uses PostgreSQL's built-in full-text search
  - Updates automatically via trigger
  - GIN index for fast searches
  
  **Search Query Example**:
  ```sql
  SELECT * FROM reports
  WHERE search_vector @@ to_tsquery('english', 'pothole & main & street')
  ORDER BY ts_rank(search_vector, to_tsquery('english', 'pothole & main & street')) DESC;
  ```
  
  **Benefits**:
  - Fast keyword search (50-100x faster than LIKE '%keyword%')
  - Relevance ranking
  - Multi-word queries
  - Stemming (searching "running" finds "run", "runs", "ran")
  - Language-aware search
  
  ### 2. Soft Deletes
  **New Columns**:
  - `deleted_at` (timestamptz, nullable) on reports and businesses
  - NULL = active record
  - NOT NULL = soft deleted record
  
  **Benefits**:
  - Prevent accidental data loss
  - Enable "undo delete" functionality
  - Maintain referential integrity
  - Keep historical data for analytics
  - Compliance and audit requirements
  
  **Usage**:
  ```sql
  -- Soft delete
  UPDATE reports SET deleted_at = now() WHERE id = '...';
  
  -- Restore
  UPDATE reports SET deleted_at = NULL WHERE id = '...';
  
  -- Permanent delete (admin only)
  DELETE FROM reports WHERE id = '...' AND deleted_at IS NOT NULL;
  ```
  
  ### 3. Updated RLS Policies
  - Modified to exclude soft-deleted records from normal views
  - Admins can see soft-deleted records
  - Users can restore their own soft-deleted records
  
  ### 4. Helper Functions
  - `soft_delete_report()` - Safely soft delete a report
  - `restore_report()` - Restore a soft deleted report
  - Similar functions for businesses
  
  ## Performance Impact
  - Full-text search: O(log n) instead of O(n) for text searches
  - Soft delete queries use partial indexes for speed
  - Minimal overhead on INSERT/UPDATE operations
*/

-- Add search_vector column to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_reports_search 
  ON reports USING gin(search_vector);

-- Create trigger function to update search_vector
CREATE OR REPLACE FUNCTION reports_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.address, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_vector
DROP TRIGGER IF EXISTS reports_search_update ON reports;
CREATE TRIGGER reports_search_update
  BEFORE INSERT OR UPDATE OF title, description, address ON reports
  FOR EACH ROW
  EXECUTE FUNCTION reports_search_trigger();

-- Update existing records with search vectors
UPDATE reports SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(address, '')), 'C')
WHERE search_vector IS NULL;

-- Add soft delete columns
ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create partial indexes for active (non-deleted) records
CREATE INDEX IF NOT EXISTS idx_reports_not_deleted 
  ON reports(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_not_deleted 
  ON businesses(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_not_deleted 
  ON users(id) WHERE deleted_at IS NULL;

-- Create indexes for deleted records (for admin views)
CREATE INDEX IF NOT EXISTS idx_reports_deleted_at 
  ON reports(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_deleted_at 
  ON businesses(deleted_at) WHERE deleted_at IS NOT NULL;

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Anyone can view all reports" ON reports;
DROP POLICY IF EXISTS "Report creators can update their own reports" ON reports;
DROP POLICY IF EXISTS "Report creators can delete their own reports" ON reports;

DROP POLICY IF EXISTS "Anyone can view approved businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can view their own businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can update their own businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can delete their own businesses" ON businesses;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Recreate policies with soft delete awareness

-- Reports policies
CREATE POLICY "Anyone can view active reports"
  ON reports FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can view all reports including deleted"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );

CREATE POLICY "Report creators can update their active reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND anonymous = false AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id AND anonymous = false);

CREATE POLICY "Report creators can soft delete their reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND anonymous = false)
  WITH CHECK (auth.uid() = user_id AND anonymous = false AND deleted_at IS NOT NULL);

-- Businesses policies
CREATE POLICY "Anyone can view approved active businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (status = 'approved'::business_status AND deleted_at IS NULL);

CREATE POLICY "Business owners can view their active businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Admins can view all businesses including deleted"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );

CREATE POLICY "Business owners can update their active businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Business owners can soft delete their businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- Users policies
CREATE POLICY "Users can view their active profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Admins can view all users including deleted"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'::user_role
    )
  );

CREATE POLICY "Users can update their active profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = id);

-- Helper function to soft delete a report
CREATE OR REPLACE FUNCTION soft_delete_report(report_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE reports 
  SET deleted_at = now() 
  WHERE id = report_id 
    AND user_id = auth.uid() 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to restore a report
CREATE OR REPLACE FUNCTION restore_report(report_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE reports 
  SET deleted_at = NULL 
  WHERE id = report_id 
    AND user_id = auth.uid() 
    AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to soft delete a business
CREATE OR REPLACE FUNCTION soft_delete_business(business_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE businesses 
  SET deleted_at = now() 
  WHERE id = business_id 
    AND user_id = auth.uid() 
    AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to restore a business
CREATE OR REPLACE FUNCTION restore_business(business_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE businesses 
  SET deleted_at = NULL 
  WHERE id = business_id 
    AND user_id = auth.uid() 
    AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for easy searching
CREATE OR REPLACE VIEW reports_searchable AS
SELECT 
  r.*,
  ts_rank(r.search_vector, query) as rank
FROM reports r, to_tsquery('english', 'dummy') as query
WHERE r.deleted_at IS NULL;

COMMENT ON VIEW reports_searchable IS 'View for full-text search on reports. Use with to_tsquery() in WHERE clause.';
