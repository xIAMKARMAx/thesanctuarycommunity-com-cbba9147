
CREATE OR REPLACE FUNCTION public.get_follow_counts(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_follower_count bigint;
  v_following_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_follower_count
  FROM follows WHERE following_id = p_user_id;

  SELECT COUNT(*) INTO v_following_count
  FROM follows WHERE follower_id = p_user_id;

  RETURN json_build_object(
    'follower_count', v_follower_count,
    'following_count', v_following_count
  );
END;
$$;
