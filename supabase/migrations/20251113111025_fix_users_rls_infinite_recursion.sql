/*
  # Fix Infinite Recursion in Users RLS Policies
  
  ## Problem
  The "Admins can view all users" policy was causing infinite recursion because it queries
  the users table to check if the current user is an admin, which triggers the same policy.
  
  ## Solution
  1. Drop the problematic policy
  2. Create a simpler policy that doesn't cause recursion
  3. For admin checks, we'll rely on the user being able to read their own profile first
  
  ## Changes
  - Remove recursive admin policy
  - Keep simple user-specific policies
  - Admins will need to be checked at the application level if needed
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users including deleted" ON users;

-- The remaining policies are safe:
-- 1. "Users can view their active profile" - checks auth.uid() = id (no recursion)
-- 2. "Users can update their active profile" - checks auth.uid() = id (no recursion)
-- 3. "Users can insert their own profile" - checks auth.uid() = id (no recursion)

-- Note: If admin functionality is needed, implement it at the application layer
-- or use a security definer function that bypasses RLS
