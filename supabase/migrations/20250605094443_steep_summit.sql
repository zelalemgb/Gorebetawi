/*
  # Initial Schema Setup

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - name (text)
      - role (text)
      - preferences (jsonb)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - businesses
      - id (uuid, primary key)
      - name (text)
      - type (text)
      - category (text)
      - contact_person (text)
      - phone (text)
      - location (point)
      - address (text)
      - logo_url (text)
      - status (text)
      - rejection_reason (text)
      - created_at (timestamp)
      - updated_at (timestamp)
      - user_id (uuid, foreign key)
    
    - reports
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - category (text)
      - status (text)
      - location (point)
      - address (text)
      - image_url (text)
      - user_id (uuid, foreign key)
      - anonymous (boolean)
      - confirmations (integer)
      - is_sponsored (boolean)
      - sponsored_by (uuid, foreign key)
      - expires_at (timestamp)
      - metadata (jsonb)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text,
  role text CHECK (role IN ('observer', 'reporter', 'validator', 'partner', 'business')),
  preferences jsonb DEFAULT '{}',
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
  status text CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('light', 'water', 'fuel', 'price', 'traffic', 'infrastructure', 'environment')),
  status text CHECK (status IN ('pending', 'confirmed', 'resolved')) DEFAULT 'pending',
  location point NOT NULL,
  address text,
  image_url text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  anonymous boolean DEFAULT false,
  confirmations integer DEFAULT 0,
  is_sponsored boolean DEFAULT false,
  sponsored_by uuid REFERENCES businesses(id) ON DELETE SET NULL,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for businesses table
CREATE POLICY "Anyone can read verified businesses"
  ON businesses
  FOR SELECT
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

-- Create policies for reports table
CREATE POLICY "Anyone can read reports"
  ON reports
  FOR SELECT
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS businesses_location_idx ON businesses USING gist(location);
CREATE INDEX IF NOT EXISTS reports_location_idx ON reports USING gist(location);
CREATE INDEX IF NOT EXISTS reports_category_idx ON reports(category);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);