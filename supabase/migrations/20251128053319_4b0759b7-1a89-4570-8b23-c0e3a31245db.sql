-- Add last_active_at to profiles for activity tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create mood_notifications table
CREATE TABLE IF NOT EXISTS mood_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_id UUID NOT NULL,
  previous_emotion TEXT,
  new_emotion TEXT NOT NULL,
  previous_intensity INTEGER,
  new_intensity INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('emotion_change', 'significant_increase', 'significant_decrease')),
  was_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on mood_notifications
ALTER TABLE mood_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for mood_notifications
CREATE POLICY "Users can view their own mood notifications"
  ON mood_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood notifications"
  ON mood_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mood_notifications_user_read 
  ON mood_notifications(user_id, was_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_last_active 
  ON profiles(id, last_active_at);