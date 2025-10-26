-- Add timer-related columns to tournaments for admin timer controls
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS timer_duration integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_start_time timestamptz,
  ADD COLUMN IF NOT EXISTS timer_is_running boolean NOT NULL DEFAULT false;

-- Extend profiles with fields used by the UI
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS earnings numeric DEFAULT 0;

-- Create live_match_admin table to manage YouTube live streams (used by admin and public pages)
CREATE TABLE IF NOT EXISTS public.live_match_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid,
  banner_url text,
  title text NOT NULL,
  description text,
  youtube_live_url text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_match_admin ENABLE ROW LEVEL SECURITY;

-- Policies (follow existing project pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'live_match_admin' AND policyname = 'Anyone can manage live_match_admin'
  ) THEN
    CREATE POLICY "Anyone can manage live_match_admin"
    ON public.live_match_admin
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'live_match_admin' AND policyname = 'Anyone can view active live_match_admin'
  ) THEN
    CREATE POLICY "Anyone can view active live_match_admin"
    ON public.live_match_admin
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- updated_at trigger
DROP TRIGGER IF EXISTS update_live_match_admin_updated_at ON public.live_match_admin;
CREATE TRIGGER update_live_match_admin_updated_at
BEFORE UPDATE ON public.live_match_admin
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();