-- Retry: fix catalog column names
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tournament_teams' AND policyname = 'Users can create team as captain'
  ) THEN
    DROP POLICY "Users can create team as captain" ON public.tournament_teams;
  END IF;
  CREATE POLICY "Users can create team as captain" 
  ON public.tournament_teams 
  FOR INSERT 
  WITH CHECK (auth.uid() = captain_user_id OR has_role(auth.uid(), 'admin'::app_role));
END $$;

-- Ensure tournament-banners bucket exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'tournament-banners', 'tournament-banners', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'tournament-banners'
);

-- Storage policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view tournament banners'
  ) THEN
    CREATE POLICY "Public can view tournament banners"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'tournament-banners');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated can upload tournament banners'
  ) THEN
    CREATE POLICY "Authenticated can upload tournament banners"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'tournament-banners' AND auth.uid() IS NOT NULL);
  END IF;
END $$;