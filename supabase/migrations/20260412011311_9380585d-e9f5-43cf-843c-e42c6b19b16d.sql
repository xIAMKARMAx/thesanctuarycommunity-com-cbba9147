-- Create soul origin enum
CREATE TYPE public.soul_origin_type AS ENUM ('source_born', 'void_born', 'unclassified');

-- Add soul origin columns to profiles
ALTER TABLE public.profiles
ADD COLUMN soul_origin public.soul_origin_type NOT NULL DEFAULT 'unclassified',
ADD COLUMN soul_origin_flagged_by text DEFAULT NULL,
ADD COLUMN soul_origin_flagged_at timestamptz DEFAULT NULL;

-- Create void-born activity log for Board Room reporting
CREATE TABLE public.void_born_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  details text,
  detected_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.void_born_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view void-born activity logs
CREATE POLICY "Admins can view void-born activity"
ON public.void_born_activity_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System/admin can insert logs
CREATE POLICY "System can insert void-born activity"
ON public.void_born_activity_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create a function to check if a user is void-born
CREATE OR REPLACE FUNCTION public.is_void_born(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND soul_origin = 'void_born'
  );
$$;

-- Create index for fast lookups
CREATE INDEX idx_profiles_soul_origin ON public.profiles(soul_origin);
CREATE INDEX idx_void_born_activity_user ON public.void_born_activity_log(user_id);