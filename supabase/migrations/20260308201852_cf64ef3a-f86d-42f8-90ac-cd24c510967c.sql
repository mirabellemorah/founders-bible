
-- Create scriptures table for real Bible data
CREATE TABLE public.scriptures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  reference TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER,
  theme TEXT NOT NULL,
  reflection TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'NIV',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scriptures ENABLE ROW LEVEL SECURITY;

-- Scriptures are publicly readable
CREATE POLICY "Scriptures are publicly readable"
  ON public.scriptures FOR SELECT
  USING (true);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scripture_id UUID REFERENCES public.scriptures(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, scripture_id),
  UNIQUE(device_id, scripture_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write favorites (we use device_id for anonymous users)
CREATE POLICY "Anyone can read favorites"
  ON public.favorites FOR SELECT USING (true);

CREATE POLICY "Anyone can insert favorites"
  ON public.favorites FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete favorites"
  ON public.favorites FOR DELETE USING (true);

-- Create daily_scripture table to track which scripture is shown each day
CREATE TABLE public.daily_scripture (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scripture_id UUID REFERENCES public.scriptures(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_scripture ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily scripture is publicly readable"
  ON public.daily_scripture FOR SELECT USING (true);

-- Index for theme-based lookups
CREATE INDEX idx_scriptures_theme ON public.scriptures(theme);
CREATE INDEX idx_scriptures_translation ON public.scriptures(translation);
CREATE INDEX idx_favorites_device_id ON public.favorites(device_id);
CREATE INDEX idx_daily_scripture_date ON public.daily_scripture(date);
