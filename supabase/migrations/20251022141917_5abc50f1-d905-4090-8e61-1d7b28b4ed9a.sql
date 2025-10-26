-- Add group columns to tournament_points table for 5-Man Team tournaments
ALTER TABLE public.tournament_points 
ADD COLUMN IF NOT EXISTS group_name text;

ALTER TABLE public.tournament_points 
ADD COLUMN IF NOT EXISTS position_in_group integer;

COMMENT ON COLUMN public.tournament_points.group_name IS 'Group assignment for 5-Man Team tournaments only (Group A, B, C, etc.)';
COMMENT ON COLUMN public.tournament_points.position_in_group IS 'Position within group for 5-Man Team tournaments only';