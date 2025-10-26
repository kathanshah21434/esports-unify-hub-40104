-- Fix RLS policy issue for tournament_team_members
-- The current policy requires checking if user can join as themselves, but doesn't account for team creation
DROP POLICY IF EXISTS "Users can join a team as themselves" ON public.tournament_team_members;

-- Create a more comprehensive policy that allows:
-- 1. Users to join teams as themselves 
-- 2. Allow captain creation during team registration
CREATE POLICY "Users can join teams or be added as captain" 
ON public.tournament_team_members 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.tournament_teams 
    WHERE id = team_id AND captain_user_id = auth.uid()
  )
);