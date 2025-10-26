-- Drop the old constraint that only allows solo, duo, squad
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_team_mode_check;

-- Add new constraint that includes '5-man'
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_team_mode_check 
CHECK (team_mode = ANY (ARRAY['solo'::text, 'duo'::text, 'squad'::text, '5-man'::text]));