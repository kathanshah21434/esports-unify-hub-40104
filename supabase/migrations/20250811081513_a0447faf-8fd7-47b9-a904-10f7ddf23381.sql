-- Fix policy quoting and add storage bucket for tournament banners

-- 1) Fix the broken policy from previous attempt (drop if exists then recreate)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can create team as captain' AND tablename = 'tournament_teams'
  ) THEN
    DROP POLICY "Users can create team as captain" ON public.tournament_teams;
  END IF;
  CREATE POLICY "Users can create team as captain" 
  ON public.tournament_teams 
  FOR INSERT 
  WITH CHECK (auth.uid() = captain_user_id OR has_role(auth.uid(), 'admin'::app_role));
END $$;

-- 2) Ensure tournament-banners bucket exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'tournament-banners', 'tournament-banners', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'tournament-banners'
);

-- 3) Storage policies for banners
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Public can view tournament banners'
  ) THEN
    CREATE POLICY "Public can view tournament banners"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'tournament-banners');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Authenticated can upload tournament banners'
  ) THEN
    CREATE POLICY "Authenticated can upload tournament banners"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'tournament-banners' AND auth.uid() IS NOT NULL);
  END IF;
END $$;