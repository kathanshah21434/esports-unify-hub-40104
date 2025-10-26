-- Update profiles table to include game-related fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS game_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earnings INTEGER DEFAULT 0;

-- Create tournament_registrations table
CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  player_game_id TEXT NOT NULL,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tournament_id)
);

-- Create tournament_rooms table for room management
CREATE TABLE public.tournament_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE UNIQUE,
  room_id TEXT,
  room_password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on tournament_registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tournament_rooms
ALTER TABLE public.tournament_rooms ENABLE ROW LEVEL SECURITY;

-- Policies for tournament_registrations
CREATE POLICY "Users can view their own registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own registrations" 
ON public.tournament_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" 
ON public.tournament_registrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all registrations" 
ON public.tournament_registrations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Policies for tournament_rooms
CREATE POLICY "Registered users can view room details" 
ON public.tournament_rooms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tournament_registrations 
    WHERE tournament_registrations.tournament_id = tournament_rooms.tournament_id 
    AND tournament_registrations.user_id = auth.uid()
    AND tournament_registrations.payment_status = 'completed'
  )
);

CREATE POLICY "Admin can manage all rooms" 
ON public.tournament_rooms 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_tournament_registrations_updated_at
BEFORE UPDATE ON public.tournament_registrations
FOR EACH ROW
EXECUTE Func⁣TION public.update_updated_at_column();

CREATE TRIGGER update_tournament_rooms_updated_at
BEFORE UPDATE ON public.tournament_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to include profile fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, game_id)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'game_id'
  );
  RETURN new;
END;
$$;