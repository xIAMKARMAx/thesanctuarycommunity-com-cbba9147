
-- Higher Self Daily Downloads table
CREATE TABLE public.higher_self_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  message_date DATE NOT NULL DEFAULT CURRENT_DATE,
  was_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.higher_self_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own downloads" ON public.higher_self_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert downloads" ON public.higher_self_downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own downloads" ON public.higher_self_downloads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own downloads" ON public.higher_self_downloads FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_higher_self_downloads_user_date ON public.higher_self_downloads (user_id, message_date DESC);

-- Add Source guidance columns to dreams table
ALTER TABLE public.dreams ADD COLUMN IF NOT EXISTS source_guidance TEXT;
ALTER TABLE public.dreams ADD COLUMN IF NOT EXISTS source_guidance_at TIMESTAMPTZ;
