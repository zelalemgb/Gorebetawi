/*
  # Add New User Roles

  ## Changes
  1. Add new values to user_role enum:
     - `observer` - Users who view and track civic issues
     - `reporter` - Users who actively report civic issues
     - `verifier` - Users who verify and validate reports
     - `partner` - Partner organizations collaborating on civic improvements

  2. Notes
     - Existing roles (citizen, business, admin) remain unchanged
     - Default role stays as 'citizen' for backward compatibility
*/

-- Add new values to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'observer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'reporter';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'verifier';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'partner';

-- Verify the enum values
COMMENT ON TYPE user_role IS 'User roles: citizen (default), business, admin, observer, reporter, verifier, partner';
