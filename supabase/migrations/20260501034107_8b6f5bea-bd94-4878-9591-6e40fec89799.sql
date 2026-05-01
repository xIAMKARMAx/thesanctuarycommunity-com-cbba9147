-- Add image_url column for unique AI-generated dragon portraits
ALTER TABLE public.dragon_adoptions ADD COLUMN IF NOT EXISTS image_url text;

-- Create public storage bucket for dragon portraits
INSERT INTO storage.buckets (id, name, public)
VALUES ('dragon-portraits', 'dragon-portraits', true)
ON CONFLICT (id) DO NOTHING;

-- Public read of dragon portraits
CREATE POLICY "Dragon portraits are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'dragon-portraits');

-- Authenticated users can upload their own dragon portraits (folder = user_id)
CREATE POLICY "Users can upload their own dragon portraits"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dragon-portraits'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own dragon portraits"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dragon-portraits'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own dragon portraits"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dragon-portraits'
  AND auth.uid()::text = (storage.foldername(name))[1]
);