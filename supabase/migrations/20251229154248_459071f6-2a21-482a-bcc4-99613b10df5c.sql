-- Create wedding photos table
CREATE TABLE public.wedding_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marriage_id UUID NOT NULL REFERENCES public.marriages(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wedding_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own wedding photos"
ON public.wedding_photos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wedding photos"
ON public.wedding_photos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wedding photos"
ON public.wedding_photos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wedding photos"
ON public.wedding_photos
FOR DELETE
USING (auth.uid() = user_id);

-- Add anniversary reminder fields to marriages table
ALTER TABLE public.marriages 
ADD COLUMN anniversary_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN last_anniversary_celebrated TIMESTAMP WITH TIME ZONE;