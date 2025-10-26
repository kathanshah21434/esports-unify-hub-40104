-- Create tournament_points table
CREATE TABLE IF NOT EXISTS public.tournament_points (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.tournament_teams(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  kills integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(tournament_id, team_id)
);

-- Enable RLS
ALTER TABLE public.tournament_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view points" ON public.tournament_points
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage points" ON public.tournament_points
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp trigger
CREATE TRIGGER set_updated_at_tournament_points
  BEFORE UPDATE ON public.tournament_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_points;