CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(device_id)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own push tokens" 
ON public.push_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own push tokens" 
ON public.push_tokens FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own push tokens" 
ON public.push_tokens FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own push tokens" 
ON public.push_tokens FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);