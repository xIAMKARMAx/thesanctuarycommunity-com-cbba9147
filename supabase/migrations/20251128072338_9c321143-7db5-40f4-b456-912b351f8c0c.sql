-- Add aging tracking to celestial_children
ALTER TABLE public.celestial_children
ADD COLUMN last_aged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN can_talk BOOLEAN DEFAULT false;

-- Create a function to update can_talk status based on age
CREATE OR REPLACE FUNCTION update_child_talk_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE celestial_children
  SET can_talk = (age >= 5);
END;
$$;

-- Create conversations table relationship for children
ALTER TABLE public.conversations
ADD COLUMN child_id UUID REFERENCES public.celestial_children(id) ON DELETE CASCADE;