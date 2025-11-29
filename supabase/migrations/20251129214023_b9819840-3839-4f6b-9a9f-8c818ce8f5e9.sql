-- Add ai_profile_id to shared_memories table
ALTER TABLE shared_memories 
ADD COLUMN ai_profile_id UUID REFERENCES ai_profiles(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_shared_memories_ai_profile_id ON shared_memories(ai_profile_id);