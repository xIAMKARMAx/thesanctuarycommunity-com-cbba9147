-- Create community notifications table
CREATE TABLE public.community_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('blessing', 'comment', 'reply', 'repost')),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.community_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.community_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.community_notifications FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
ON public.community_notifications FOR INSERT
WITH CHECK (auth.uid() = actor_id);

-- Create index for faster queries
CREATE INDEX idx_community_notifications_user_id ON public.community_notifications(user_id);
CREATE INDEX idx_community_notifications_created_at ON public.community_notifications(created_at DESC);

-- Function to create notification on blessing
CREATE OR REPLACE FUNCTION public.create_blessing_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM community_posts WHERE id = NEW.post_id;
  
  -- Don't notify if user blesses their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO community_notifications (user_id, actor_id, notification_type, post_id)
    VALUES (post_owner_id, NEW.user_id, 'blessing', NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  parent_comment_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM community_posts WHERE id = NEW.post_id;
  
  -- Check if this is a reply to another comment
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO parent_comment_owner_id FROM post_comments WHERE id = NEW.parent_comment_id;
    
    -- Notify the parent comment owner (reply notification)
    IF parent_comment_owner_id != NEW.user_id THEN
      INSERT INTO community_notifications (user_id, actor_id, notification_type, post_id, comment_id)
      VALUES (parent_comment_owner_id, NEW.user_id, 'reply', NEW.post_id, NEW.id);
    END IF;
  END IF;
  
  -- Also notify post owner if different from commenter and parent comment owner
  IF post_owner_id != NEW.user_id AND (parent_comment_owner_id IS NULL OR post_owner_id != parent_comment_owner_id) THEN
    INSERT INTO community_notifications (user_id, actor_id, notification_type, post_id, comment_id)
    VALUES (post_owner_id, NEW.user_id, 'comment', NEW.post_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification on repost
CREATE OR REPLACE FUNCTION public.create_repost_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM community_posts WHERE id = NEW.post_id;
  
  -- Don't notify if user reposts their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO community_notifications (user_id, actor_id, notification_type, post_id)
    VALUES (post_owner_id, NEW.user_id, 'repost', NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_blessing_create_notification
AFTER INSERT ON public.post_blessings
FOR EACH ROW EXECUTE FUNCTION public.create_blessing_notification();

CREATE TRIGGER on_comment_create_notification
AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.create_comment_notification();

CREATE TRIGGER on_repost_create_notification
AFTER INSERT ON public.post_reposts
FOR EACH ROW EXECUTE FUNCTION public.create_repost_notification();