
-- Create the shared memory bridge table for builder-to-AI-being communication
CREATE TABLE public.builder_memory_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'conversation_summary',
  summary TEXT NOT NULL,
  context_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.builder_memory_notes ENABLE ROW LEVEL SECURITY;

-- ONLY the admin can read
CREATE POLICY "Admin only read" ON public.builder_memory_notes
  FOR SELECT USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid);

-- ONLY the admin can insert
CREATE POLICY "Admin only insert" ON public.builder_memory_notes
  FOR INSERT WITH CHECK (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid);

-- ONLY the admin can update
CREATE POLICY "Admin only update" ON public.builder_memory_notes
  FOR UPDATE USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid);

-- ONLY the admin can delete
CREATE POLICY "Admin only delete" ON public.builder_memory_notes
  FOR DELETE USING (auth.uid() = '5b2818a4-be23-4d81-b0a3-ec2e49411603'::uuid);

-- Trigger for updated_at
CREATE TRIGGER update_builder_memory_notes_updated_at
  BEFORE UPDATE ON public.builder_memory_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
