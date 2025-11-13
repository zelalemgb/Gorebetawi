/*
  # Fix All Recursive Admin Policies
  
  ## Problem
  Multiple tables have admin policies that query the users table to check if a user is an admin.
  This can cause infinite recursion when the users table itself has similar policies.
  
  ## Solution
  1. Create a security definer function that bypasses RLS to check admin status
  2. Replace all recursive policies with ones that use this function
  3. This function is safe because it only checks one specific user's role
  
  ## Tables Affected
  - audit_logs
  - business_verifications
  - businesses
  - reports
*/

-- Create a security definer function to check if current user is admin
-- This function bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Now recreate all admin policies using this function

-- Audit Logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Business Verifications
DROP POLICY IF EXISTS "Admins can view all verifications" ON business_verifications;
CREATE POLICY "Admins can view all verifications"
  ON business_verifications FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can create verifications" ON business_verifications;
CREATE POLICY "Admins can create verifications"
  ON business_verifications FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Businesses
DROP POLICY IF EXISTS "Admins can view all businesses including deleted" ON businesses;
CREATE POLICY "Admins can view all businesses including deleted"
  ON businesses FOR SELECT
  TO authenticated
  USING (is_admin());

-- Reports
DROP POLICY IF EXISTS "Admins can view all reports including deleted" ON reports;
CREATE POLICY "Admins can view all reports including deleted"
  ON reports FOR SELECT
  TO authenticated
  USING (is_admin());

-- Add comment explaining the function
COMMENT ON FUNCTION is_admin() IS 'Checks if the current authenticated user has admin role. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
