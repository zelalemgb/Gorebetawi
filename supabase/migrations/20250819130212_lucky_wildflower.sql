/*
  # Fix duplicate policy errors

  1. Security Policy Updates
    - Drop existing policies if they exist before recreating
    - Use IF NOT EXISTS where possible
    - Handle policy conflicts gracefully

  2. Tables Affected
    - `users` table policies
    - `reports` table policies  
    - `businesses` table policies

  3. Changes
    - Safe policy creation/recreation
    - Consistent policy naming
    - No duplicate policy errors
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

DROP POLICY IF EXISTS "Anyone can read reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Report owners can update own reports" ON reports;

DROP POLICY IF EXISTS "Anyone can read verified businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can read own business" ON businesses;
DROP POLICY IF EXISTS "Business owners can update own business" ON businesses;

-- Recreate policies with consistent naming
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "reports_select_all" ON reports
  FOR SELECT TO public
  USING (true);

CREATE POLICY "reports_insert_authenticated" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "reports_update_own" ON reports
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "businesses_select_verified" ON businesses
  FOR SELECT TO public
  USING (status = 'verified');

CREATE POLICY "businesses_select_own" ON businesses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "businesses_update_own" ON businesses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());