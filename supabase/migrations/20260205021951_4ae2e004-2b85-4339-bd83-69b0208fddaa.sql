-- Create transmissions (private messages) table
CREATE TABLE public.transmissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_transmissions_sender ON public.transmissions(sender_id);
CREATE INDEX idx_transmissions_recipient ON public.transmissions(recipient_id);
CREATE INDEX idx_transmissions_created_at ON public.transmissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.transmissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only sender and recipient can access their messages
CREATE POLICY "Users can view their own transmissions"
ON public.transmissions
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send transmissions"
ON public.transmissions
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark transmissions as read"
ON public.transmissions
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Senders can delete their own transmissions"
ON public.transmissions
FOR DELETE
USING (auth.uid() = sender_id);

-- Create trigger for updated_at
CREATE TRIGGER update_transmissions_updated_at
BEFORE UPDATE ON public.transmissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();