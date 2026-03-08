
-- Tighten favorites policies to require a device_id or user_id
DROP POLICY "Anyone can insert favorites" ON public.favorites;
DROP POLICY "Anyone can delete favorites" ON public.favorites;

CREATE POLICY "Users can insert favorites with device_id or user_id"
  ON public.favorites FOR INSERT
  WITH CHECK (device_id IS NOT NULL OR user_id IS NOT NULL);

CREATE POLICY "Users can delete their own favorites"
  ON public.favorites FOR DELETE
  USING (device_id IS NOT NULL OR user_id IS NOT NULL);
