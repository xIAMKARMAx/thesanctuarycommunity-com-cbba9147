-- Fix 1: Add UPDATE policy for child_image_history table
-- Allows users to update descriptions and metadata of their own generated images
CREATE POLICY "Users can update their own child image history"
ON public.child_image_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Fix 2: Add DELETE policy for ai_room_settings table
-- Allows users to delete their own room customization settings
CREATE POLICY "Users can delete their own AI room settings"
ON public.ai_room_settings
FOR DELETE
USING (auth.uid() = user_id);