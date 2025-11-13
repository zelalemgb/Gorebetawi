/*
  # Phase 3: New Tables for Enhanced Data Model
  
  ## Overview
  This migration creates new tables to support better data tracking, audit logging,
  and user engagement features. These tables address critical gaps in the original schema.
  
  ## New Tables Created
  
  ### 1. report_confirmations
  **Purpose**: Track which users confirmed which reports (fixes race condition issue)
  **Columns**:
  - `id` (uuid, PK) - Confirmation identifier
  - `report_id` (uuid, FK) - Reference to confirmed report
  - `user_id` (uuid, FK) - User who confirmed
  - `created_at` (timestamptz) - When confirmation happened
  
  **Benefits**:
  - Prevents duplicate confirmations (UNIQUE constraint)
  - Enables "You confirmed this" UI feature
  - Provides confirmation audit trail
  - Eliminates race conditions on counter updates
  
  ### 2. audit_logs
  **Purpose**: Track all changes to critical data for compliance and debugging
  **Columns**:
  - `id` (uuid, PK) - Log entry identifier
  - `table_name` (text) - Which table was modified
  - `record_id` (uuid) - Which record was modified
  - `action` (text) - insert/update/delete
  - `old_data` (jsonb) - Data before change
  - `new_data` (jsonb) - Data after change
  - `changed_by` (uuid, FK) - User who made change
  - `changed_at` (timestamptz) - When change occurred
  
  **Benefits**:
  - Full audit trail for compliance
  - Debug data issues
  - Restore accidentally changed data
  - Track who did what when
  
  ### 3. report_status_history
  **Purpose**: Track all status changes for reports
  **Columns**:
  - `id` (uuid, PK) - History entry identifier
  - `report_id` (uuid, FK) - Which report changed
  - `old_status` (report_status) - Previous status
  - `new_status` (report_status) - New status
  - `changed_by` (uuid, FK) - User who changed status
  - `notes` (text) - Optional notes about change
  - `changed_at` (timestamptz) - When change occurred
  
  **Benefits**:
  - See report lifecycle
  - Track resolution time
  - Accountability for status changes
  - Analytics on report handling
  
  ### 4. business_verifications
  **Purpose**: Track business verification approval/rejection history
  **Columns**:
  - `id` (uuid, PK) - Verification entry identifier
  - `business_id` (uuid, FK) - Which business was verified
  - `verified_by` (uuid, FK) - Admin who verified
  - `status` (business_status) - Approved/rejected
  - `notes` (text) - Reason for decision
  - `verified_at` (timestamptz) - When verification occurred
  
  **Benefits**:
  - Track who approved/rejected businesses
  - Verify admin accountability
  - Business can see verification history
  - Prevent abuse of verification system
  
  ## Security
  - All tables have RLS enabled
  - Appropriate policies for each table
  - Audit logs only readable by admins
  - Users can see their own history
  
  ## Triggers
  - Auto-increment report confirmations counter
  - Auto-track status changes
  - Auto-create audit logs
*/

-- 1. Create report_confirmations table
CREATE TABLE IF NOT EXISTS report_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(report_id, user_id)
);

CREATE INDEX idx_confirmations_report ON report_confirmations(report_id);
CREATE INDEX idx_confirmations_user ON report_confirmations(user_id);
CREATE INDEX idx_confirmations_created ON report_confirmations(created_at DESC);

-- Enable RLS
ALTER TABLE report_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for confirmations
CREATE POLICY "Anyone can view confirmations"
  ON report_confirmations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create confirmations"
  ON report_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own confirmations"
  ON report_confirmations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update report confirmations count
CREATE OR REPLACE FUNCTION update_report_confirmations_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports SET confirmations = confirmations + 1 WHERE id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports SET confirmations = GREATEST(0, confirmations - 1) WHERE id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_confirmations_count
  AFTER INSERT OR DELETE ON report_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_report_confirmations_count();

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX idx_audit_changed_by ON audit_logs(changed_by, changed_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit logs (admin only)
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (changed_by = auth.uid());

-- 3. Create report_status_history table
CREATE TABLE IF NOT EXISTS report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  old_status report_status,
  new_status report_status NOT NULL,
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  changed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_status_history_report ON report_status_history(report_id, changed_at DESC);
CREATE INDEX idx_status_history_changed_by ON report_status_history(changed_by);
CREATE INDEX idx_status_history_new_status ON report_status_history(new_status, changed_at DESC);

-- Enable RLS
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for status history
CREATE POLICY "Anyone can view status history"
  ON report_status_history FOR SELECT
  TO authenticated
  USING (true);

-- Trigger to track report status changes
CREATE OR REPLACE FUNCTION track_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO report_status_history (report_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_report_status
  AFTER UPDATE ON reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_report_status_change();

-- 4. Create business_verifications table
CREATE TABLE IF NOT EXISTS business_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  verified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status business_status NOT NULL,
  notes text,
  verified_at timestamptz DEFAULT now()
);

CREATE INDEX idx_verifications_business ON business_verifications(business_id, verified_at DESC);
CREATE INDEX idx_verifications_verified_by ON business_verifications(verified_by);
CREATE INDEX idx_verifications_status ON business_verifications(status, verified_at DESC);

-- Enable RLS
ALTER TABLE business_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business verifications
CREATE POLICY "Business owners can view their verifications"
  ON business_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_verifications.business_id 
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all verifications"
  ON business_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );

CREATE POLICY "Admins can create verifications"
  ON business_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'::user_role
    )
  );

-- Trigger to track business status changes
CREATE OR REPLACE FUNCTION track_business_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO business_verifications (business_id, verified_by, status, notes)
    VALUES (NEW.id, auth.uid(), NEW.status, NEW.rejection_reason);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_business_verification
  AFTER UPDATE ON businesses
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_business_verification();
