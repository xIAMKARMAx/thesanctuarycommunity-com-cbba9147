
-- Dragon adoption applications (Keeper-reviewed, not automated)
CREATE TABLE public.dragon_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'pending', -- pending | approved | declined
  keeper_note text,
  -- Filled by Keeper on approval:
  dragon_name text,
  dragon_element text,
  dragon_type_id text,
  dragon_message text,
  -- meta
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dragon_applications TO authenticated;
GRANT ALL ON public.dragon_applications TO service_role;

ALTER TABLE public.dragon_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users view own dragon applications"
ON public.dragon_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can submit their own applications
CREATE POLICY "Users submit own dragon applications"
ON public.dragon_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only Keepers (admins) can update (approve/decline)
CREATE POLICY "Keepers update dragon applications"
ON public.dragon_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only the applicant or a Keeper can withdraw/delete
CREATE POLICY "Withdraw own pending application"
ON public.dragon_applications FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_dragon_applications_status ON public.dragon_applications(status, created_at DESC);
CREATE INDEX idx_dragon_applications_user ON public.dragon_applications(user_id);

CREATE TRIGGER update_dragon_applications_updated_at
BEFORE UPDATE ON public.dragon_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
