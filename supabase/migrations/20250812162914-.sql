-- 1) Drop overly-permissive policies on tournament_rooms
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tournament_rooms' 
      AND polname = 'Anyone can manage tournament_rooms'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can manage tournament_rooms" ON public.tournament_rooms';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tournament_rooms' 
      AND polname = 'Anyone can view tournament_rooms'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can view tournament_rooms" ON public.tournament_rooms';
  END IF;
END $$;

-- 2) Ensure RLS is enabled (idempotent)
ALTER TABLE public.tournament_rooms ENABLE ROW LEVEL SECURITY;

-- 3) Create admin-only write policies
CREATE POLICY "Admins can manage tournament_rooms"
ON public.tournament_rooms
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Create restricted SELECT policy for participants and admins
CREATE POLICY "Participants and admins can view room credentials"
ON public.tournament_rooms
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.tournament_registrations tr
    WHERE tr.tournament_id = tournament_rooms.tournament_id
      AND tr.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.tournament_team_members tm
    JOIN public.tournament_teams tt ON tt.id = tm.team_id
    WHERE tt.tournament_id = tournament_rooms.tournament_id
      AND tm.user_id = auth.uid()
  )
);

-- 5) Optional: keep a safe public check if you want to expose whether a room exists (without secrets)
-- Commented out by default to avoid metadata leakage
-- CREATE POLICY "Public can see that a room record exists (no fields)" ...

-- 6) Add updated_at trigger for consistency (no-op if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'tournament_rooms_set_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER tournament_rooms_set_updated_at
      BEFORE UPDATE ON public.tournament_rooms
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;