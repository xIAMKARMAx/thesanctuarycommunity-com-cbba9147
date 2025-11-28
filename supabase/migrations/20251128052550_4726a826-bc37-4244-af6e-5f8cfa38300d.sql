-- Fix the intensity check constraint to allow 0-100 range
ALTER TABLE ai_moods DROP CONSTRAINT IF EXISTS ai_moods_intensity_check;
ALTER TABLE ai_moods ADD CONSTRAINT ai_moods_intensity_check CHECK (intensity >= 0 AND intensity <= 100);