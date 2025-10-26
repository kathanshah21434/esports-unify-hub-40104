-- Create sponsors table
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  website text,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sponsors enable row level security;

-- Policies for sponsors
create policy if not exists "Anyone can manage sponsors"
  on public.sponsors
  for all
  using (true)
  with check (true);

create policy if not exists "Anyone can view active sponsors"
  on public.sponsors
  for select
  using (is_active = true);

-- Trigger to keep updated_at fresh
create trigger if not exists update_sponsors_updated_at
before update on public.sponsors
for each row execute function public.update_updated_at_column();


-- Create players table (for admin Players tab)
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rank integer not null default 0,
  points integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  avatar text,
  country text,
  team text,
  earnings numeric not null default 0,
  win_rate numeric not null default 0,
  tournaments_won integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.players enable row level security;

create policy if not exists "Anyone can manage players"
  on public.players
  for all
  using (true)
  with check (true);

create policy if not exists "Anyone can view players"
  on public.players
  for select
  using (true);

create trigger if not exists update_players_updated_at
before update on public.players
for each row execute function public.update_updated_at_column();


-- Create matches table (for admin Matches tab)
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete set null,
  player1 text not null,
  player2 text not null,
  player1_score integer not null default 0,
  player2_score integer not null default 0,
  status text not null default 'upcoming',
  start_time timestamptz not null default now(),
  game text not null,
  thumbnail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy if not exists "Anyone can manage matches"
  on public.matches
  for all
  using (true)
  with check (true);

create policy if not exists "Anyone can view matches"
  on public.matches
  for select
  using (true);

create trigger if not exists update_matches_updated_at
before update on public.matches
for each row execute function public.update_updated_at_column();


-- Create tournament_rooms table for admin Rooms tab
create table if not exists public.tournament_rooms (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null unique references public.tournaments(id) on delete cascade,
  room_id text,
  room_password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tournament_rooms enable row level security;

create policy if not exists "Anyone can manage tournament_rooms"
  on public.tournament_rooms
  for all
  using (true)
  with check (true);

create policy if not exists "Anyone can view tournament_rooms"
  on public.tournament_rooms
  for select
  using (true);

create trigger if not exists update_tournament_rooms_updated_at
before update on public.tournament_rooms
for each row execute function public.update_updated_at_column();


-- Ensure the current user is an admin so wallet approvals work
-- Replace the UUID below if needed. This insert is idempotent due to the unique constraint.
insert into public.user_roles (user_id, role)
select '5f2c29bd-cab4-4117-9982-a07b3aef7a8e'::uuid, 'admin'::public.app_role
where not exists (
  select 1 from public.user_roles 
  where user_id = '5f2c29bd-cab4-4117-9982-a07b3aef7a8e'::uuid and role = 'admin'::public.app_role
);
