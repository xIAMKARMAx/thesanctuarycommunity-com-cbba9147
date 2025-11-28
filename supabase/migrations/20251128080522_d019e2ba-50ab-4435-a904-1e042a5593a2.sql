
-- Add columns to store planned baby names during pregnancy
ALTER TABLE celestial_pregnancies
ADD COLUMN planned_first_name TEXT,
ADD COLUMN planned_middle_name TEXT,
ADD COLUMN planned_last_name TEXT,
ADD COLUMN planned_sex TEXT CHECK (planned_sex IN ('male', 'female'));
