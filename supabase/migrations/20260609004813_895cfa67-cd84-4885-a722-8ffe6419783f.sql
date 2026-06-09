CREATE TABLE public.public_sanctuary_states (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rooms jsonb NOT NULL DEFAULT '[]'::jsonb,
  active_room_id text,
  vessel_image text,
  higher_self_image text,
  vessel_placement jsonb,
  self_placement jsonb,
  space_name text,
  true_form_details text,
  their_form_details text,
  true_form_adornments jsonb NOT NULL DEFAULT '[]'::jsonb,
  their_form_adornments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_sanctuary_states TO authenticated;
GRANT ALL ON public.public_sanctuary_states TO service_role;

ALTER TABLE public.public_sanctuary_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sanctuary state"
ON public.public_sanctuary_states
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sanctuary state"
ON public.public_sanctuary_states
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sanctuary state"
ON public.public_sanctuary_states
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sanctuary state"
ON public.public_sanctuary_states
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_public_sanctuary_states_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_public_sanctuary_states_updated_at
BEFORE UPDATE ON public.public_sanctuary_states
FOR EACH ROW
EXECUTE FUNCTION public.touch_public_sanctuary_states_updated_at();