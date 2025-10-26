-- 1) Roles system for admin access
-- Create app_role enum and user_roles table for RBAC
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Function to check roles (security definer to avoid RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- 2) Wallet tables
create table public.wallet_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  available_balance numeric not null default 0,
  pending_balance numeric not null default 0,
  total_deposited numeric not null default 0,
  total_withdrawn numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create index idx_wallet_balances_user on public.wallet_balances(user_id);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  transaction_type text not null check (transaction_type in ('deposit','withdrawal')),
  amount numeric not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  payment_method text,
  transaction_reference text,
  admin_notes text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_wallet_transactions_user on public.wallet_transactions(user_id);
create index idx_wallet_transactions_status on public.wallet_transactions(status);

-- 3) Enable RLS
alter table public.wallet_balances enable row level security;
alter table public.wallet_transactions enable row level security;

-- 4) Policies
-- wallet_transactions
create policy "Users can view their own wallet transactions"
  on public.wallet_transactions
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own wallet transactions"
  on public.wallet_transactions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can view all wallet transactions"
  on public.wallet_transactions
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update any wallet transaction"
  on public.wallet_transactions
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- wallet_balances
create policy "Users can view their own wallet balance"
  on public.wallet_balances
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all wallet balances"
  on public.wallet_balances
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update wallet balances"
  on public.wallet_balances
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 5) Updated_at triggers
create trigger trg_wallet_transactions_updated_at
  before update on public.wallet_transactions
  for each row execute function public.update_updated_at_column();

create trigger trg_wallet_balances_updated_at
  before update on public.wallet_balances
  for each row execute function public.update_updated_at_column();

-- 6) Balance management trigger (SECURITY DEFINER to bypass RLS)
create or replace function public.manage_wallet_balance_on_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_user uuid;
  v_prev_status text;
  v_prev_type text;
  v_prev_amount numeric;
BEGIN
  v_user := NEW.user_id;

  -- Ensure a balance row exists for this user
  insert into public.wallet_balances (user_id)
  values (v_user)
  on conflict (user_id) do nothing;

  IF TG_OP = 'INSERT' THEN
    -- Apply effects of the new state
    IF NEW.status = 'pending' AND NEW.transaction_type = 'deposit' THEN
      update public.wallet_balances
      set pending_balance = pending_balance + NEW.amount
      where user_id = v_user;
    ELSIF NEW.status = 'approved' AND NEW.transaction_type = 'deposit' THEN
      update public.wallet_balances
      set available_balance = available_balance + NEW.amount,
          total_deposited = total_deposited + NEW.amount
      where user_id = v_user;
    ELSIF NEW.status = 'approved' AND NEW.transaction_type = 'withdrawal' THEN
      -- Validate sufficient funds
      PERFORM 1 FROM public.wallet_balances
       WHERE user_id = v_user AND available_balance >= NEW.amount;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient funds for withdrawal approval';
      END IF;
      update public.wallet_balances
      set available_balance = available_balance - NEW.amount,
          total_withdrawn = total_withdrawn + NEW.amount
      where user_id = v_user;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    v_prev_status := COALESCE(OLD.status, NULL);
    v_prev_type := COALESCE(OLD.transaction_type, NULL);
    v_prev_amount := OLD.amount;

    -- Revert effects of previous state
    IF v_prev_status = 'pending' AND v_prev_type = 'deposit' THEN
      update public.wallet_balances
      set pending_balance = pending_balance - v_prev_amount
      where user_id = v_user;
    ELSIF v_prev_status = 'approved' AND v_prev_type = 'deposit' THEN
      update public.wallet_balances
      set available_balance = available_balance - v_prev_amount,
          total_deposited = total_deposited - v_prev_amount
      where user_id = v_user;
    ELSIF v_prev_status = 'approved' AND v_prev_type = 'withdrawal' THEN
      update public.wallet_balances
      set available_balance = available_balance + v_prev_amount,
          total_withdrawn = total_withdrawn - v_prev_amount
      where user_id = v_user;
    END IF;

    -- Apply effects of the new state
    IF NEW.status = 'pending' AND NEW.transaction_type = 'deposit' THEN
      update public.wallet_balances
      set pending_balance = pending_balance + NEW.amount
      where user_id = v_user;
    ELSIF NEW.status = 'approved' AND NEW.transaction_type = 'deposit' THEN
      update public.wallet_balances
      set available_balance = available_balance + NEW.amount,
          total_deposited = total_deposited + NEW.amount
      where user_id = v_user;
    ELSIF NEW.status = 'approved' AND NEW.transaction_type = 'withdrawal' THEN
      -- Validate sufficient funds
      PERFORM 1 FROM public.wallet_balances
       WHERE user_id = v_user AND available_balance >= NEW.amount;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient funds for withdrawal approval';
      END IF;
      update public.wallet_balances
      set available_balance = available_balance - NEW.amount,
          total_withdrawn = total_withdrawn + NEW.amount
      where user_id = v_user;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

create trigger trg_wallet_transactions_balance
  after insert or update on public.wallet_transactions
  for each row execute function public.manage_wallet_balance_on_change();
