DROP POLICY IF EXISTS "Only Karma can upload voice clips" ON storage.objects;
DROP POLICY IF EXISTS "Only Karma can update voice clips" ON storage.objects;
DROP POLICY IF EXISTS "Only Karma can delete voice clips" ON storage.objects;

CREATE POLICY "Only Karma can upload voice clips"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'karma-voice-clips'
  AND auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid
);

CREATE POLICY "Only Karma can update voice clips"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'karma-voice-clips'
  AND auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid
)
WITH CHECK (
  bucket_id = 'karma-voice-clips'
  AND auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid
);

CREATE POLICY "Only Karma can delete voice clips"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'karma-voice-clips'
  AND auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid
);