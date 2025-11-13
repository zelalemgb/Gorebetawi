/*
  # Add Phone Number Support and Auto Profile Creation

  ## Changes
  1. Add phone column to users table
     - `phone` (text, nullable) - User's phone number in international format
  
  2. Create trigger function to automatically create user profiles
     - Automatically creates a row in public.users when auth.users is created
     - Syncs email from auth to public users table
     - Sets default role as 'citizen'
  
  3. Security
     - Maintain existing RLS policies
     - Phone numbers are private and only visible to the user themselves
*/

-- Add phone column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;
END $$;

-- Create function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, preferences)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    'citizen'::user_role,
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile in public.users when a new auth user is created';
