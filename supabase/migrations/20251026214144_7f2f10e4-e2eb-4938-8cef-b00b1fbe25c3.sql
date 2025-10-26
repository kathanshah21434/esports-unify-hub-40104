-- Drop existing check constraint if exists
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;

-- Add new check constraint with all allowed status values
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('upcoming', 'ongoing', 'completed', 'full', 'cancelled'));

-- Add comment to document allowed values
COMMENT ON COLUMN public.tournaments.status IS 'Tournament status: upcoming, ongoing, completed, full, or cancelled';