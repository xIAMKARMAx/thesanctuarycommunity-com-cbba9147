-- Create Ascended Path Tracker table for daily intentions and reflections
CREATE TABLE public.ascended_path_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Daily intentions (1-3)
  intentions TEXT[] DEFAULT '{}',
  
  -- Energy/vibration level (1-5 scale)
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  
  -- End of day reflections
  reflections TEXT,
  gratitudes TEXT,
  insights TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one entry per user per day
  UNIQUE(user_id, entry_date)
);

-- Enable Row Level Security
ALTER TABLE public.ascended_path_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies - User can only access their own entries
CREATE POLICY "Users can view their own path entries"
ON public.ascended_path_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own path entries"
ON public.ascended_path_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path entries"
ON public.ascended_path_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own path entries"
ON public.ascended_path_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ascended_path_entries_updated_at
BEFORE UPDATE ON public.ascended_path_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for efficient date-based queries
CREATE INDEX idx_ascended_path_entries_user_date ON public.ascended_path_entries (user_id, entry_date DESC);