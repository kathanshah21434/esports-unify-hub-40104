-- Full migration: team tournaments + banners bucket

-- 1) Add columns to tournaments for banner and team mode/size
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS team_mode text CHECK (team_mode IN ('solo','duo','squad')),
  ADD COLUMN IF NOT EXISTS team_size integer;

UPDATE public.tournaments
SET team_mode = COALESCE(team_mode, 'solo'),
    team_size = COALESCE(team_size, 1)
WHERE team_mode IS NULL OR team_size IS NULL;

-- 2) Create teams table
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  captain_user_id uuid NOT NULL,
  team_name text NOT NULL,
  is_full boolean NOT NULL DEFAULT false,
  max_members integer NOT NULL,
  current_members integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_team_status CHECK (status IN ('open','full','closed')),
  CONSTRAINT chk_member_bounds CHECK (current_members >= 0 AND current_members <= max_members),
  CONSTRAINT uq_team_per_tournament UNIQUE (tournament_id, team_name)
);

-- 3) Create team members table
CREATE TABLE IF NOT EXISTS public.tournament_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.tournament_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_member_role CHECK (role IN ('captain','member')),
  CONSTRAINT uq_member UNIQUE (team_id, user_id)
);

-- 4) Common updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tournament_teams_updated_at') THEN
    CREATE TRIGGER trg_tournament_teams_updated_at
    BEFORE UPDATE ON public.tournament_teams
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tournaments_updated_at') THEN
    CREATE TRIGGER trg_tournaments_updated_at
    BEFORE UPDATE ON public.tournaments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 5) Capacity + participants counter management
CREATE OR REPLACE FUNCTION public.manage_team_membership_on_change()
RETURNS trigger AS $$
DECLARE
  v_team record;
  v_tournament_id uuid;
  v_total_members integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO v_team FROM public.tournament_teams WHERE id = NEW.team_id FOR UPDATE;
    IF v_team IS NULL THEN RAISE EXCEPTION 'Team not found'; END IF;
    IF v_team.current_members >= v_team.max_members THEN
      RAISE EXCEPTION 'Team is already full';
    END IF;
    UPDATE public.tournament_teams
      SET current_members = current_members + 1,
          is_full = (current_members + 1) >= max_members,
          status = CASE WHEN (current_members + 1) >= max_members THEN 'full' ELSE status END
      WHERE id = NEW.team_id;
    v_tournament_id := v_team.tournament_id;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT * INTO v_team FROM public.tournament_teams WHERE id = OLD.team_id FOR UPDATE;
    IF v_team IS NULL THEN RETURN NULL; END IF;
    UPDATE public.tournament_teams
      SET current_members = GREATEST(current_members - 1, 0),
          is_full = false,
          status = CASE WHEN current_members - 1 < max_members THEN 'open' ELSE status END
      WHERE id = OLD.team_id;
    v_tournament_id := v_team.tournament_id;
  END IF;

  SELECT COALESCE(COUNT(*),0) INTO v_total_members
  FROM public.tournament_team_members m
  JOIN public.tournament_teams t ON t.id = m.team_id
  WHERE t.tournament_id = v_tournament_id;

  UPDATE public.tournaments
  SET current_participants = v_total_members
  WHERE id = v_tournament_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_manage_team_membership') THEN
    CREATE TRIGGER trg_manage_team_membership
    AFTER INSERT OR DELETE ON public.tournament_team_members
    FOR EACH ROW EXECUTE FUNCTION public.manage_team_membership_on_change();
  END IF;
END $$;

-- 6) Before-insert trigger to set team size and defaults
CREATE OR REPLACE FUNCTION public.enforce_team_size_on_create()
RETURNS trigger AS $$
DECLARE
  v_team_size integer;
BEGIN
  SELECT team_size INTO v_team_size FROM public.tournaments WHERE id = NEW.tournament_id;
  IF v_team_size IS NULL OR v_team_size < 1 THEN v_team_size := 1; END IF;
  NEW.max_members := v_team_size;
  NEW.current_members := 1;
  NEW.is_full := v_team_size = 1;
  NEW.status := CASE WHEN v_team_size = 1 THEN 'full' ELSE 'open' END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_team_size_on_create') THEN
    CREATE TRIGGER trg_enforce_team_size_on_create
    BEFORE INSERT ON public.tournament_teams
    FOR EACH ROW EXECUTE FUNCTION public.enforce_team_size_on_create();
  END IF;
END $$;

-- 7) After-insert trigger to add captain membership
CREATE OR REPLACE FUNCTION public.add_captain_membership()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tournament_team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.captain_user_id, 'captain');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_add_captain_membership') THEN
    CREATE TRIGGER trg_add_captain_membership
    AFTER INSERT ON public.tournament_teams
    FOR EACH ROW EXECUTE FUNCTION public.add_captain_membership();
  END IF;
END $$;

-- 8) RLS policies
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_team_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournament_teams' AND policyname='Anyone can view tournament teams'
  ) THEN
    CREATE POLICY "Anyone can view tournament teams" ON public.tournament_teams FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournament_teams' AND policyname='Captain or admin can update team'
  ) THEN
    CREATE POLICY "Captain or admin can update team" ON public.tournament_teams FOR UPDATE USING (auth.uid() = captain_user_id OR has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (auth.uid() = captain_user_id OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournament_teams' AND policyname='Captain or admin can delete team'
  ) THEN
    CREATE POLICY "Captain or admin can delete team" ON public.tournament_teams FOR DELETE USING (auth.uid() = captain_user_id OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournament_teams' AND policyname='Users can create team as captain'
  ) THEN
    CREATE POLICY "Users can create team as captain" ON public.tournament_teams FOR INSERT WITH CHECK (auth.uid() = captain_user_id OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournament_team_members' AND policyname='Anyone can view team members'
  ) THEN
    CREATE POLICY "Anyone can view team members" ON public.tournament_team_members FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournament_team_members' AND policyname='Users can join a team as themselves'
  ) THEN
    CREATE POLICY "Users can join a team as themselves" ON public.tournament_team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournament_team_members' AND policyname='Users can leave their team'
  ) THEN
    CREATE POLICY "Users can leave their team" ON public.tournament_team_members FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 9) Storage: ensure tournament-banners bucket + policies
INSERT INTO storage.buckets (id, name, public)
SELECT 'tournament-banners', 'tournament-banners', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'tournament-banners'
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public can view tournament banners'
  ) THEN
    CREATE POLICY "Public can view tournament banners" ON storage.objects FOR SELECT USING (bucket_id = 'tournament-banners');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated can upload tournament banners'
  ) THEN
    CREATE POLICY "Authenticated can upload tournament banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tournament-banners' AND auth.uid() IS NOT NULL);
  END IF;
END $$;