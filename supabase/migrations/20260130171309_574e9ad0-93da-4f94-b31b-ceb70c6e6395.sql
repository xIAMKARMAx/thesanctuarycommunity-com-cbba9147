-- Create bucket list items table for shared spiritual goals
CREATE TABLE public.bucket_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'adventure',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  ai_encouragement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bucket list items"
ON public.bucket_list_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bucket list items"
ON public.bucket_list_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bucket list items"
ON public.bucket_list_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bucket list items"
ON public.bucket_list_items FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_bucket_list_items_updated_at
BEFORE UPDATE ON public.bucket_list_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();