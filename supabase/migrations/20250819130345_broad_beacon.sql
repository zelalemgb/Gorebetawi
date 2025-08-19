/*
  # Initial Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `name` (text, optional)
      - `role` (text, default 'observer')
      - `preferences` (jsonb, default '{}')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `reports`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `category` (text, constrained)
      - `status` (text, default 'pending')
      - `location` (point)
      - `address` (text, optional)
      - `image_url` (text, optional)
      - `user_id` (uuid, optional, references users)
      - `anonymous` (boolean, default false)
      - `confirmations` (integer, default 0)
      - `metadata` (jsonb, default '{}')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `businesses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text, constrained)
      - `category` (text, constrained)
      - `contact_person` (text)
      - `phone` (text)
      - `location` (point)
      - `address` (text)
      - `logo_url` (text, optional)
      - `status` (text, default 'pending')
      - `rejection_reason` (text, optional)
      - `user_id` (uuid, optional, references users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add trigger for user creation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'observer' CHECK (role IN ('observer', 'reporter', 'validator', 'partner', 'business')),
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('light', 'water', 'fuel', 'price', 'traffic', 'infrastructure', 'environment')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'resolved')),
  location point NOT NULL,
  address text,
  image_url text,
  user_id uuid REFERENCES users(id),
  anonymous boolean DEFAULT false,
  confirmations integer DEFAULT 0,
  is_sponsored boolean DEFAULT false,
  sponsored_by uuid REFERENCES businesses(id) ON DELETE SET NULL,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text CHECK (type IN ('fuel_station', 'retail_shop', 'market', 'other')),
  category text CHECK (category IN ('fuel', 'price')),
  contact_person text NOT NULL,
  phone text NOT NULL,
  location point NOT NULL,
  address text NOT NULL,
  logo_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason text,
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS reports_location_idx ON reports USING gist (location);
CREATE INDEX IF NOT EXISTS reports_category_idx ON reports (category);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);
CREATE INDEX IF NOT EXISTS businesses_location_idx ON businesses USING gist (location);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can read reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Report owners can update own reports" ON reports;
DROP POLICY IF EXISTS "Anyone can read verified businesses" ON businesses;
DROP POLICY IF EXISTS "Business owners can read own business" ON businesses;
DROP POLICY IF EXISTS "Business owners can update own business" ON businesses;

-- Create policies for users
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for reports
CREATE POLICY "Anyone can read reports"
  ON reports
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Report owners can update own reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for businesses
CREATE POLICY "Anyone can read verified businesses"
  ON businesses
  FOR SELECT
  TO public
  USING (status = 'verified');

CREATE POLICY "Business owners can read own business"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Business owners can update own business"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_users_updated_at ON users;
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();