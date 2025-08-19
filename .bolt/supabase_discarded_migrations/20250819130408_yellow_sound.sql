/*
  # Add safety category to reports

  1. Changes
    - Add 'safety' to the category constraint for reports table
    - Update existing constraint to include the new category

  2. Security
    - No changes to RLS policies
*/

-- Add safety category to reports constraint
ALTER TABLE reports 
DROP CONSTRAINT IF EXISTS reports_category_check;

ALTER TABLE reports 
ADD CONSTRAINT reports_category_check 
CHECK (category = ANY (ARRAY['light'::text, 'water'::text, 'fuel'::text, 'price'::text, 'traffic'::text, 'infrastructure'::text, 'environment'::text, 'safety'::text]));