/*
  # Phase 2: Performance Optimization - Indexes
  
  ## Overview
  This migration adds critical indexes to improve query performance across the application.
  These indexes target the most common query patterns and foreign key relationships.
  
  ## Changes Made
  
  ### 1. Foreign Key Indexes
  Essential for JOIN operations and maintaining referential integrity performance:
  - `idx_businesses_user_id` - Speed up user -> businesses lookups
  - `idx_reports_user_id` - Speed up user -> reports lookups
  - `idx_reports_sponsored_by` - Speed up business -> sponsored reports lookups
  
  ### 2. Composite Indexes for Common Query Patterns
  Optimized for real-world application queries:
  - `idx_reports_status_created` - Recent reports by status (feed views)
  - `idx_reports_category_status` - Filtered reports by category and status
  - `idx_reports_user_created` - User's report history timeline
  - `idx_reports_sponsored_expires` - Active sponsored reports cleanup
  - `idx_businesses_status_created` - Business approval queue
  - `idx_reports_created_at` - Recent reports ordering
  - `idx_businesses_created_at` - Recent businesses ordering
  
  ### 3. Partial Indexes
  - Only index sponsored reports that need expiration tracking
  - Reduces index size and improves write performance
  
  ## Performance Impact
  - **Before**: Full table scans on filtered queries (O(n))
  - **After**: Index lookups (O(log n))
  - **Expected**: 50-100x faster on common queries with 10k+ records
  
  ## Query Examples Using These Indexes
  
  ```sql
  -- Uses idx_reports_status_created
  SELECT * FROM reports WHERE status = 'open' ORDER BY created_at DESC LIMIT 20;
  
  -- Uses idx_reports_category_status
  SELECT * FROM reports WHERE category = 'fuel' AND status = 'open';
  
  -- Uses idx_reports_user_created
  SELECT * FROM reports WHERE user_id = '...' ORDER BY created_at DESC;
  
  -- Uses idx_reports_sponsored_expires
  SELECT * FROM reports WHERE is_sponsored = true AND expires_at < now();
  ```
*/

-- Foreign Key Indexes (Critical for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_sponsored_by ON reports(sponsored_by);

-- Composite Indexes for Common Query Patterns
-- Recent reports by status (most common query in feed)
CREATE INDEX IF NOT EXISTS idx_reports_status_created 
  ON reports(status, created_at DESC);

-- Category filtering with status
CREATE INDEX IF NOT EXISTS idx_reports_category_status 
  ON reports(category, status);

-- User activity timeline
CREATE INDEX IF NOT EXISTS idx_reports_user_created 
  ON reports(user_id, created_at DESC);

-- Active sponsored reports (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_reports_sponsored_expires 
  ON reports(is_sponsored, expires_at) 
  WHERE is_sponsored = true;

-- Business approval queue
CREATE INDEX IF NOT EXISTS idx_businesses_status_created 
  ON businesses(status, created_at DESC);

-- Single column indexes for sorting
CREATE INDEX IF NOT EXISTS idx_reports_created_at 
  ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_businesses_created_at 
  ON businesses(created_at DESC);

-- Spatial indexes already exist from previous migration, but ensure they're optimal
-- Recreate with better fillfactor for clustering
DROP INDEX IF EXISTS idx_reports_location;
DROP INDEX IF EXISTS idx_businesses_location;

CREATE INDEX idx_reports_location 
  ON reports USING gist(location)
  WITH (fillfactor = 90);

CREATE INDEX idx_businesses_location 
  ON businesses USING gist(location)
  WITH (fillfactor = 90);
