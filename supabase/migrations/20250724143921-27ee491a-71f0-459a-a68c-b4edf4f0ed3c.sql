-- Phase 1: Enable RLS on missing tables and create proper policies

-- Enable RLS on matches table
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies for matches
CREATE POLICY "Everyone can view matches" 
ON public.matches 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage all matches" 
ON public.matches 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND email IN ('admin@esports.com', 'kathan21042007@gmail.com')
  )
);

-- Enable RLS on tournaments table
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create policies for tournaments
CREATE POLICY "Everyone can view tournaments" 
ON public.tournaments 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage all tournaments" 
ON public.tournaments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND email IN ('admin@esports.com', 'kathan21042007@gmail.com')
  )
);

-- Enable RLS on players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create policies for players
CREATE POLICY "Everyone can view players" 
ON public.players 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage all players" 
ON public.players 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND email IN ('admin@esports.com', 'kathan21042007@gmail.com')
  )
);

-- Phase 2: Create proper role-based access control

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND email IN ('admin@esports.com', 'kathan21042007@gmail.com')
  )
);

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

-- Insert admin role for existing admin users
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role
FROM public.profiles 
WHERE email IN ('admin@esports.com', 'kathan21042007@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create trigger to automatically assign 'user' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Update existing RLS policies to use the new role system

-- Update wallet_transactions admin policies
DROP POLICY IF EXISTS "Admin can manage all transactions" ON public.wallet_transactions;
CREATE POLICY "Admin can manage all transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (public.is_admin());

-- Update wallet_balances admin policies  
DROP POLICY IF EXISTS "Admin can manage all balances" ON public.wallet_balances;
CREATE POLICY "Admin can manage all balances" 
ON public.wallet_balances 
FOR ALL 
USING (public.is_admin());

-- Update tournament_teams admin policies
DROP POLICY IF EXISTS "Admin can manage all teams" ON public.tournament_teams;
CREATE POLICY "Admin can manage all teams" 
ON public.tournament_teams 
FOR ALL 
USING (public.is_admin());

-- Update tournament_registrations admin policies
DROP POLICY IF EXISTS "Admin can manage all registrations" ON public.tournament_registrations;
CREATE POLICY "Admin can manage all registrations" 
ON public.tournament_registrations 
FOR ALL 
USING (public.is_admin());

-- Update tournament_rooms admin policies
DROP POLICY IF EXISTS "Admin can manage all rooms" ON public.tournament_rooms;
CREATE POLICY "Admin can manage all rooms" 
ON public.tournament_rooms 
FOR ALL 
USING (public.is_admin());

-- Update sponsors admin policies
DROP POLICY IF EXISTS "Authenticated users can manage sponsors" ON public.sponsors;
CREATE POLICY "Admin can manage all sponsors" 
ON public.sponsors 
FOR ALL 
USING (public.is_admin());

-- Update live_match_admin admin policies
DROP POLICY IF EXISTS "Admin can manage live matches" ON public.live_match_admin;
CREATE POLICY "Admin can manage live matches" 
ON public.live_match_admin 
FOR ALL 
USING (public.is_admin());

-- Update announcements admin policies
DROP POLICY IF EXISTS "Admin can manage all announcements" ON public.announcements;
CREATE POLICY "Admin can manage all announcements" 
ON public.announcements 
FOR ALL 
USING (public.is_admin());

-- Update matches and tournaments policies to use role system
DROP POLICY IF EXISTS "Admin can manage all matches" ON public.matches;
CREATE POLICY "Admin can manage all matches" 
ON public.matches 
FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage all tournaments" ON public.tournaments;
CREATE POLICY "Admin can manage all tournaments" 
ON public.tournaments 
FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage all players" ON public.players;
CREATE POLICY "Admin can manage all players" 
ON public.players 
FOR ALL 
USING (public.is_admin());