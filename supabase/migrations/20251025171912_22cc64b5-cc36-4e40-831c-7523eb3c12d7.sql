-- Create a function to ensure wallet balance exists for user
CREATE OR REPLACE FUNCTION public.ensure_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert wallet balance if it doesn't exist
  INSERT INTO public.wallet_balances (user_id, available_balance, pending_balance, total_deposited, total_withdrawn)
  VALUES (NEW.user_id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to ensure wallet balance before transaction insert
DROP TRIGGER IF EXISTS ensure_wallet_balance_before_transaction ON public.wallet_transactions;
CREATE TRIGGER ensure_wallet_balance_before_transaction
  BEFORE INSERT ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_wallet_balance();

-- Also create wallet_balances for existing users who don't have one
INSERT INTO public.wallet_balances (user_id, available_balance, pending_balance, total_deposited, total_withdrawn)
SELECT DISTINCT user_id, 0, 0, 0, 0
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.wallet_balances)
ON CONFLICT (user_id) DO NOTHING;