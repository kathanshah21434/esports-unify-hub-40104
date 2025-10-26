-- Create tournament_teams table to store team information
CREATE TABLE public.tournament_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  team_name TEXT NOT NULL,
  team_captain_id UUID NOT NULL,
  team_size INTEGER NOT NULL DEFAULT 2,
  current_members INTEGER NOT NULL DEFAULT 1,
  max_members INTEGER NOT NULL DEFAULT 2,
  is_full BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, team_name)
);

-- Enable Row Level Security
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament teams
CREATE POLICY "Teams are viewable by everyone" 
ON public.tournament_teams 
FOR SELECT 
USING (true);

CREATE POLICY "Team captains can create teams" 
ON public.tournament_teams 
FOR INSERT 
WITH CHECK (auth.uid() = team_captain_id);

CREATE POLICY "Team captains can update their teams" 
ON public.tournament_teams 
FOR UPDATE 
USING (auth.uid() = team_captain_id);

CREATE POLICY "Admin can manage all teams" 
ON public.tournament_teams 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add team_id column to tournament_registrations
ALTER TABLE public.tournament_registrations 
ADD COLUMN team_id UUID,
ADD COLUMN is_team_captain BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX idx_tournament_teams_tournament_id ON public.tournament_teams(tournament_id);
CREATE INDEX idx_tournament_registrations_team_id ON public.tournament_registrations(team_id);

-- Create trigger for automatic timestamp updates on teams
CREATE TRIGGER update_tournament_teams_updated_at
BEFORE UPDATE ON public.tournament_teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update team member count and full status
CREATE OR REPLACE FUNCTION public.update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update team member count and full status when registration is added/removed
  IF TG_OP = 'INSERT' AND NEW.team_id IS NOT NULL THEN
    UPDATE public.tournament_teams 
    SET 
      current_members = (
        SELECT COUNT(*) 
        FROM public.tournament_registrations 
        WHERE team_id = NEW.team_id 
        AND payment_status = 'completed'
      ),
      is_full = (
        SELECT COUNT(*) >= max_members
        FROM public.tournament_registrations 
        WHERE team_id = NEW.team_id 
        AND payment_status = 'completed'
      )
    WHERE id = NEW.team_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.team_id IS NOT NULL THEN
    UPDATE public.tournament_teams 
    SET 
      current_members = (
        SELECT COUNT(*) 
        FROM public.tournament_registrations 
        WHERE team_id = NEW.team_id 
        AND payment_status = 'completed'
      ),
      is_full = (
        SELECT COUNT(*) >= max_members
        FROM public.tournament_registrations 
        WHERE team_id = NEW.team_id 
        AND payment_status = 'completed'
      )
    WHERE id = NEW.team_id;
  ELSIF TG_OP = 'DELETE' AND OLD.team_id IS NOT NULL THEN
    UPDATE public.tournament_teams 
    SET 
      current_members = (
        SELECT COUNT(*) 
        FROM public.tournament_registrations 
        WHERE team_id = OLD.team_id 
        AND payment_status = 'completed'
      ),
      is_full = (
        SELECT COUNT(*) >= max_members
        FROM public.tournament_registrations 
        WHERE team_id = OLD.team_id 
        AND payment_status = 'completed'
      )
    WHERE id = OLD.team_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update team member count
CREATE TRIGGER update_team_member_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tournament_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_team_member_count();