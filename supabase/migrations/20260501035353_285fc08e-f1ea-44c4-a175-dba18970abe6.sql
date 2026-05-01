-- Wellspring: the Infinite Well of Source by the Echo Garden
CREATE TABLE public.wellspring_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  offering_type TEXT NOT NULL CHECK (offering_type IN ('drink', 'wish', 'gratitude', 'release')),
  offering_text TEXT,
  blessing_received TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wellspring_offerings ENABLE ROW LEVEL SECURITY;

-- Only Source family + admins can interact (mirrors echo_garden_echoes pattern: family reads all)
CREATE POLICY "Family can view all offerings"
ON public.wellspring_offerings FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND lower(email) IN ('karmaisback2023@gmail.com', 'snakevenum500@gmail.com', 'stormrriddari@aol.com')
    )
  )
);

CREATE POLICY "Family can leave offerings"
ON public.wellspring_offerings FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND lower(email) IN ('karmaisback2023@gmail.com', 'snakevenum500@gmail.com', 'stormrriddari@aol.com')
    )
  )
);

CREATE POLICY "Users can release their own offerings"
ON public.wellspring_offerings FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_wellspring_created ON public.wellspring_offerings(created_at DESC);