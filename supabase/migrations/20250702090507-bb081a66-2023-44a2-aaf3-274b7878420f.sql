
-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  game TEXT NOT NULL,
  description TEXT,
  prize_pool TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 0,
  current_participants INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed')) DEFAULT 'upcoming',
  image TEXT,
  banner TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  avatar TEXT,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player1 TEXT NOT NULL,
  player2 TEXT NOT NULL,
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'live', 'completed')) DEFAULT 'upcoming',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  game TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (make tables public for now since no auth is implemented)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since no authentication is implemented)
CREATE POLICY "Allow all operations on tournaments" ON public.tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);

-- Enable real-time updates
ALTER TABLE public.tournaments REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.matches REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- Insert initial data
INSERT INTO public.tournaments (id, name, game, description, prize_pool, max_participants, current_participants, start_date, end_date, status, image, banner) VALUES
('1', 'Battle Royale Championship', 'Battle Royale', 'Ultimate championship with top players worldwide', '$50,000', 100, 87, '2024-07-15', '2024-07-20', 'ongoing', '/lovable-uploads/feb97539-ef64-4950-81ec-d958016900ac.png', 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=400&fit=crop'),
('2', 'FPS Masters Cup', 'FPS Arena', 'Fast-paced action tournament for FPS enthusiasts', '$25,000', 64, 45, '2024-07-25', '2024-07-28', 'upcoming', '/lovable-uploads/feb97539-ef64-4950-81ec-d958016900ac.png', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=400&fit=crop'),
('3', 'Strategy Masters League', 'Strategy Game', 'The ultimate test of strategic thinking and planning', '$15,000', 32, 28, '2024-08-01', '2024-08-05', 'upcoming', '/lovable-uploads/feb97539-ef64-4950-81ec-d958016900ac.png', 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=1200&h=400&fit=crop');

INSERT INTO public.players (id, name, rank, points, wins, losses, avatar, country) VALUES
('1', 'ProGamer_X', 1, 2450, 89, 11, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', 'USA'),
('2', 'EliteSniper', 2, 2380, 76, 24, 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', 'UK'),
('3', 'DigitalWarrior', 3, 2290, 68, 32, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', 'Canada'),
('4', 'CyberNinja', 4, 2150, 55, 45, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', 'Japan');

INSERT INTO public.matches (id, tournament_id, player1, player2, player1_score, player2_score, status, start_time, game) VALUES
('1', '1', 'ProGamer_X', 'EliteSniper', 15, 12, 'live', '2024-07-02T14:00:00Z', 'Battle Royale'),
('2', '1', 'DigitalWarrior', 'CyberNinja', 0, 0, 'upcoming', '2024-07-02T16:00:00Z', 'Battle Royale'),
('3', '2', 'ProGamer_X', 'CyberNinja', 0, 0, 'upcoming', '2024-07-25T10:00:00Z', 'FPS Arena');
