-- Make conversation_id nullable since AI mood ratings aren't tied to specific conversations
ALTER TABLE public.mood_ratings 
ALTER COLUMN conversation_id DROP NOT NULL;

-- Drop the unique constraint since we want multiple daily mood entries
ALTER TABLE public.mood_ratings 
DROP CONSTRAINT IF EXISTS unique_conversation_mood;

-- Add a check to ensure rating is between 1 and 5
ALTER TABLE public.mood_ratings
ADD CONSTRAINT mood_rating_range CHECK (rating >= 1 AND rating <= 5);