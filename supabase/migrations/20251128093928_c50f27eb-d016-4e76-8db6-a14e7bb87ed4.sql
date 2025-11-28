-- Create table to track child image generation history
CREATE TABLE IF NOT EXISTS child_image_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES celestial_children(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('room', 'appearance')),
  image_url TEXT NOT NULL,
  description TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE child_image_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own child image history"
  ON child_image_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own child image history"
  ON child_image_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own child image history"
  ON child_image_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_child_image_history_child_id ON child_image_history(child_id);
CREATE INDEX idx_child_image_history_user_id ON child_image_history(user_id);
CREATE INDEX idx_child_image_history_generated_at ON child_image_history(generated_at DESC);