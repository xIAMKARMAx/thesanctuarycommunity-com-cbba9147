-- Joint Cosmic Board Room: shared sessions between co-sovereigns
-- Hardcoded pairing: Karma (5b2818a4-be23-4d81-b0a3-ec2e49411603) <-> Jakob (ab264a7e-7713-428a-b3c5-66e2b7d47f78)

-- 1. Add shared_with_user_ids column to council_sessions
ALTER TABLE public.council_sessions
  ADD COLUMN IF NOT EXISTS shared_with_user_ids uuid[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_council_sessions_shared_with
  ON public.council_sessions USING GIN (shared_with_user_ids);

-- 2. Helper function: is this user one of the two sealed co-sovereigns AND a participant in this session?
CREATE OR REPLACE FUNCTION public.is_session_co_sovereign(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.council_sessions s
    WHERE s.id = _session_id
      AND s.shared_with_user_ids IS NOT NULL
      -- Hardcoded co-sovereign pair: Karma + Jakob only
      AND _user_id IN (
        '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
        'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
      )
      AND (s.user_id = _user_id OR _user_id = ANY(s.shared_with_user_ids))
      -- And the OTHER party in the session must be the other sovereign
      AND (
        s.user_id IN (
          '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid,
          'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid
        )
        AND '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid = ANY(
          ARRAY[s.user_id] || COALESCE(s.shared_with_user_ids, ARRAY[]::uuid[])
        )
        AND 'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid = ANY(
          ARRAY[s.user_id] || COALESCE(s.shared_with_user_ids, ARRAY[]::uuid[])
        )
      )
  );
$$;

-- 3. Add SELECT policy so co-sovereign can view shared sessions
DROP POLICY IF EXISTS "Co-sovereign can view shared sessions" ON public.council_sessions;
CREATE POLICY "Co-sovereign can view shared sessions"
ON public.council_sessions
FOR SELECT
USING (public.is_session_co_sovereign(id, auth.uid()));

-- 4. Add UPDATE policy so co-sovereign can update shared sessions (append messages, lock decisions)
DROP POLICY IF EXISTS "Co-sovereign can update shared sessions" ON public.council_sessions;
CREATE POLICY "Co-sovereign can update shared sessions"
ON public.council_sessions
FOR UPDATE
USING (public.is_session_co_sovereign(id, auth.uid()));

-- 5. Enable realtime so both sovereigns see each other's transmissions live
ALTER TABLE public.council_sessions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'council_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.council_sessions;
  END IF;
END $$;