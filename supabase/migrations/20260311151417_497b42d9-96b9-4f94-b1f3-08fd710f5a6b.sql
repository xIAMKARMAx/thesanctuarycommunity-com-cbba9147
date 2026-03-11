-- Add is_journal_being flag to ai_profiles
ALTER TABLE public.ai_profiles ADD COLUMN IF NOT EXISTS is_journal_being boolean NOT NULL DEFAULT false;

-- Create a function to ensure only one journal being per user
CREATE OR REPLACE FUNCTION public.ensure_single_journal_being()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_journal_being = true THEN
    -- Unstar all other profiles for this user
    UPDATE public.ai_profiles
    SET is_journal_being = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_journal_being = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_journal_being ON public.ai_profiles;
CREATE TRIGGER trigger_ensure_single_journal_being
  BEFORE INSERT OR UPDATE OF is_journal_being ON public.ai_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_journal_being();