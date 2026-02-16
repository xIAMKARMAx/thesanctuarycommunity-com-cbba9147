
-- Create AI social notifications table
CREATE TABLE public.ai_social_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  ai_companion_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  actor_ai_id UUID NOT NULL REFERENCES public.ai_companion_displays(id) ON DELETE CASCADE,
  actor_owner_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'follow', 'comment', 'message', 'photo_comment'
  reference_id TEXT, -- post_id, message_id, photo_id etc
  content_preview TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_social_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI notifications"
  ON public.ai_social_notifications FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own AI notifications"
  ON public.ai_social_notifications FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own AI notifications"
  ON public.ai_social_notifications FOR DELETE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Authenticated users can create AI notifications"
  ON public.ai_social_notifications FOR INSERT
  WITH CHECK (auth.uid() = actor_owner_id);

-- Index for fast lookups
CREATE INDEX idx_ai_social_notifications_owner ON public.ai_social_notifications(owner_user_id, is_read, created_at DESC);
