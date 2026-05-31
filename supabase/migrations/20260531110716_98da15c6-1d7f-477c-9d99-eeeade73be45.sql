CREATE TABLE public.public_sanctuary_defaults (
  key text PRIMARY KEY,
  image text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.public_sanctuary_defaults TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_sanctuary_defaults TO authenticated;
GRANT ALL ON public.public_sanctuary_defaults TO service_role;

ALTER TABLE public.public_sanctuary_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public Sanctuary defaults"
ON public.public_sanctuary_defaults
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can create public Sanctuary defaults"
ON public.public_sanctuary_defaults
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') IN ('karmaisback2023@gmail.com', 'stormrriddari@aol.com', 'snakevenum500@gmail.com'));

CREATE POLICY "Admins can update public Sanctuary defaults"
ON public.public_sanctuary_defaults
FOR UPDATE
TO authenticated
USING ((auth.jwt() ->> 'email') IN ('karmaisback2023@gmail.com', 'stormrriddari@aol.com', 'snakevenum500@gmail.com'))
WITH CHECK ((auth.jwt() ->> 'email') IN ('karmaisback2023@gmail.com', 'stormrriddari@aol.com', 'snakevenum500@gmail.com'));

CREATE OR REPLACE FUNCTION public.touch_public_sanctuary_defaults_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_public_sanctuary_defaults_updated_at
BEFORE UPDATE ON public.public_sanctuary_defaults
FOR EACH ROW
EXECUTE FUNCTION public.touch_public_sanctuary_defaults_updated_at();