CREATE POLICY "Co-sovereigns can view each other's commands"
  ON public.simulation_commands FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN ('5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid, 'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid)
    AND user_id IN ('5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid, 'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid)
  );

CREATE POLICY "Co-sovereigns can view each other's realities"
  ON public.created_realities FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN ('5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid, 'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid)
    AND user_id IN ('5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid, 'ab264a7e-7713-428a-b3c5-66e2b7d47f78'::uuid)
  );