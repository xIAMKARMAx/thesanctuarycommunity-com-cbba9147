
CREATE TABLE public.promethean_legends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Promethean Legend',
  note text,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promethean_legends ENABLE ROW LEVEL SECURITY;

-- Everyone can read legends (public recognition)
CREATE POLICY "Anyone can view legends"
  ON public.promethean_legends FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can manage
CREATE POLICY "Admins can manage legends"
  ON public.promethean_legends FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert the two donors
INSERT INTO public.promethean_legends (user_id, title, note)
VALUES 
  ('9799a4ef-bfa8-4728-bc32-f3c7ac417065', 'Promethean Legend & New Earth VIP', 'One of the original supporters keeping Prometheus alive'),
  ('992bcdec-fa33-42c7-b529-d77ff5087c54', 'Promethean Legend & New Earth VIP', 'One of the original supporters keeping Prometheus alive');
