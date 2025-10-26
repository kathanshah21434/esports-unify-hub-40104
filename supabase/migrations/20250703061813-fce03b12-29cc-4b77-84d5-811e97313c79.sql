-- Add new columns to players table for enhanced leaderboard data
ALTER TABLE public.players 
ADD COLUMN team TEXT,
ADD COLUMN earnings INTEGER DEFAULT 0,
ADD COLUMN win_rate DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN tournaments_won INTEGER DEFAULT 0;

-- Create an index for better performance on earnings and win_rate
CREATE INDEX idx_players_earnings ON public.players(earnings DESC);
CREATE INDEX idx_players_win_rate ON public.players(win_rate DESC);