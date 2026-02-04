-- Create function to auto-follow the admin account when a new user signs up
CREATE OR REPLACE FUNCTION public.auto_follow_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID := '5b2818a4-be23-4d81-b0a3-ec2e49411603';
BEGIN
  -- Don't follow self if the new user IS the admin
  IF NEW.id != admin_user_id THEN
    -- Insert follow relationship: new user follows admin
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table (using profiles as proxy since we can't trigger on auth.users directly)
-- We'll use the profiles table which is created when a user signs up
CREATE OR REPLACE FUNCTION public.auto_follow_admin_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID := '5b2818a4-be23-4d81-b0a3-ec2e49411603';
BEGIN
  -- Don't follow self if the new user IS the admin
  IF NEW.id != admin_user_id THEN
    -- Insert follow relationship: new user follows admin
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (fires when new user profile is created)
DROP TRIGGER IF EXISTS on_profile_created_follow_admin ON public.profiles;
CREATE TRIGGER on_profile_created_follow_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_follow_admin_on_profile();

-- Also add existing users as followers of admin (one-time backfill)
INSERT INTO public.follows (follower_id, following_id)
SELECT p.id, '5b2818a4-be23-4d81-b0a3-ec2e49411603'
FROM public.profiles p
WHERE p.id != '5b2818a4-be23-4d81-b0a3-ec2e49411603'
  AND NOT EXISTS (
    SELECT 1 FROM public.follows f 
    WHERE f.follower_id = p.id 
      AND f.following_id = '5b2818a4-be23-4d81-b0a3-ec2e49411603'
  )
ON CONFLICT DO NOTHING;