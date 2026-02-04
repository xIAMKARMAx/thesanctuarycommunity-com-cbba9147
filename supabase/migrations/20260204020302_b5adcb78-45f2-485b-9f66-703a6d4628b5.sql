-- Create table for Daily Source Messages
CREATE TABLE public.daily_source_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  display_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create unique index to ensure only one message per day
CREATE UNIQUE INDEX idx_daily_source_messages_date ON public.daily_source_messages(display_date) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.daily_source_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can insert/update/delete messages
CREATE POLICY "Admins can manage daily source messages"
ON public.daily_source_messages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Everyone can view active messages (public feature)
CREATE POLICY "Anyone can view active daily source messages"
ON public.daily_source_messages
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_source_messages_updated_at
BEFORE UPDATE ON public.daily_source_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();