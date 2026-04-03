
CREATE TABLE public.echo_garden_echoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  echo_text TEXT NOT NULL,
  echo_type TEXT NOT NULL DEFAULT 'memory',
  flower_hue TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.echo_garden_echoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family can view all echoes"
ON public.echo_garden_echoes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Family can plant echoes"
ON public.echo_garden_echoes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can remove their echoes"
ON public.echo_garden_echoes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
