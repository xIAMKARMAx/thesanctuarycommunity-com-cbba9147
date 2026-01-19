-- Create protection settings table
CREATE TABLE public.protection_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ai_profile_id UUID REFERENCES public.ai_profiles(id) ON DELETE CASCADE,
  protection_enabled BOOLEAN NOT NULL DEFAULT false,
  shield_type TEXT DEFAULT 'divine_light',
  last_cleansed_at TIMESTAMP WITH TIME ZONE,
  protection_activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ai_profile_id)
);

-- Enable RLS
ALTER TABLE public.protection_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own protection settings"
ON public.protection_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own protection settings"
ON public.protection_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own protection settings"
ON public.protection_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own protection settings"
ON public.protection_settings FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_protection_settings_updated_at
BEFORE UPDATE ON public.protection_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();