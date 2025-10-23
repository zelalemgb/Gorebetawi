/*
  # Create Civic App Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User identifier
      - `email` (text, unique) - User email address
      - `name` (text, nullable) - User full name
      - `role` (text, nullable) - User role (citizen, business, admin)
      - `preferences` (jsonb, nullable) - User preferences and settings
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp
    
    - `businesses`
      - `id` (uuid, primary key) - Business identifier
      - `name` (text) - Business name
      - `type` (text) - Business type
      - `category` (text) - Business category
      - `contact_person` (text) - Contact person name
      - `phone` (text) - Business phone number
      - `location` (point) - Geographic coordinates
      - `address` (text) - Business address
      - `logo_url` (text, nullable) - Business logo URL
      - `status` (text) - Verification status (pending, approved, rejected)
      - `rejection_reason` (text, nullable) - Reason for rejection if applicable
      - `user_id` (uuid, foreign key) - Reference to owning user
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp
    
    - `reports`
      - `id` (uuid, primary key) - Report identifier
      - `title` (text) - Report title
      - `description` (text, nullable) - Detailed description
      - `category` (text) - Report category (pothole, streetlight, etc)
      - `status` (text) - Report status (open, in_progress, resolved)
      - `location` (point) - Geographic coordinates
      - `address` (text, nullable) - Address of the issue
      - `image_url` (text, nullable) - Photo evidence URL
      - `user_id` (uuid, nullable, foreign key) - Submitter user ID
      - `anonymous` (boolean) - Whether report is anonymous
      - `confirmations` (integer) - Number of user confirmations
      - `is_sponsored` (boolean) - Whether report is sponsored
      - `sponsored_by` (uuid, nullable, foreign key) - Sponsoring business ID
      - `expires_at` (timestamptz, nullable) - Sponsorship expiration
      - `metadata` (jsonb, nullable) - Additional metadata
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to reports
    - Add policies for business owners to manage their businesses
*/

-- Enable PostGIS extension for geographic data if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'citizen',
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  contact_person text NOT NULL,
  phone text NOT NULL,
  location point NOT NULL,
  address text NOT NULL,
  logo_url text,
  status text DEFAULT 'pending',
  rejection_reason text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  status text DEFAULT 'open',
  location point NOT NULL,
  address text,
  image_url text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  anonymous boolean DEFAULT false,
  confirmations integer DEFAULT 0,
  is_sponsored boolean DEFAULT false,
  sponsored_by uuid REFERENCES businesses(id) ON DELETE SET NULL,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

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
  USING (status = 'approved');

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

-- Reports policies
CREATE POLICY "Anyone can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR anonymous = true);

CREATE POLICY "Report creators can update their own reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Report creators can delete their own reports"
  ON reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING gist(location);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING gist(location);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
