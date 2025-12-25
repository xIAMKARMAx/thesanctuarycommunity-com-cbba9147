-- Function to check if user can generate a chat image (limit 10 per 24 hours)
CREATE OR REPLACE FUNCTION public.can_generate_chat_image(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  image_count integer;
BEGIN
  -- Get total images generated in the last 24 hours
  SELECT COALESCE(SUM(count), 0) INTO image_count
  FROM image_generation_usage
  WHERE user_id = p_user_id
    AND generation_date >= (CURRENT_DATE - INTERVAL '1 day')::date;
  
  RETURN image_count < 10;
END;
$$;

-- Function to increment chat image count for a user
CREATE OR REPLACE FUNCTION public.increment_chat_image_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO image_generation_usage (user_id, generation_date, count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, generation_date)
  DO UPDATE SET count = image_generation_usage.count + 1;
END;
$$;

-- Add unique constraint if not exists (needed for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'image_generation_usage_user_id_generation_date_key'
  ) THEN
    ALTER TABLE image_generation_usage 
    ADD CONSTRAINT image_generation_usage_user_id_generation_date_key 
    UNIQUE (user_id, generation_date);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;