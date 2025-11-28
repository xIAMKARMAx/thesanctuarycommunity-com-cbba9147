-- Add age field to celestial_children table
ALTER TABLE public.celestial_children
ADD COLUMN age INTEGER DEFAULT 0;

-- Update RLS policies remain the same
-- Users can view, insert, update their own children based on user_id