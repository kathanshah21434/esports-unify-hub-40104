-- Create wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_method TEXT,
  transaction_reference TEXT,
  admin_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet balances table
CREATE TABLE public.wallet_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  available_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  total_deposited DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_withdrawn DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create live matches admin table for YouTube integration
CREATE TABLE public.live_match_admin (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID,
  banner_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  youtube_live_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_match_admin ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (true);

-- RLS policies for wallet_balances
CREATE POLICY "Users can view their own balance" 
ON public.wallet_balances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own balance" 
ON public.wallet_balances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance" 
ON public.wallet_balances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all balances" 
ON public.wallet_balances 
FOR ALL 
USING (true);

-- RLS policies for live_match_admin
CREATE POLICY "Everyone can view active live matches" 
ON public.live_match_admin 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage live matches" 
ON public.live_match_admin 
FOR ALL 
USING (true);

-- Create function to update wallet balance after transaction approval
CREATE OR REPLACE FUNCTION public.update_wallet_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Insert wallet balance record if doesn't exist
    INSERT INTO public.wallet_balances (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update balance based on transaction type
    IF NEW.transaction_type = 'deposit' THEN
      UPDATE public.wallet_balances 
      SET 
        available_balance = available_balance + NEW.amount,
        total_deposited = total_deposited + NEW.amount,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.transaction_type = 'withdrawal' THEN
      UPDATE public.wallet_balances 
      SET 
        available_balance = available_balance - NEW.amount,
        total_withdrawn = total_withdrawn + NEW.amount,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wallet balance updates
CREATE TRIGGER wallet_transaction_approval_trigger
  AFTER UPDATE ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_balance_on_approval();

-- Create updated_at triggers
CREATE TRIGGER update_wallet_transactions_updated_at
  BEFORE UPDATE ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_balances_updated_at
  BEFORE UPDATE ON public.wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_live_match_admin_updated_at
  BEFORE UPDATE ON public.live_match_admin
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();