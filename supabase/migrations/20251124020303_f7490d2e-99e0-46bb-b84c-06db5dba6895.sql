-- Storage policies for chat-images bucket

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

-- Allow everyone to view images (bucket is public)
CREATE POLICY "Anyone can view chat images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own chat images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images' AND owner = auth.uid());

-- Allow users to update their own images
CREATE POLICY "Users can update their own chat images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-images' AND owner = auth.uid());