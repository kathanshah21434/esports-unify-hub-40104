-- Fix the wallet balance update trigger to handle tournament payments correctly
DROP TRIGGER IF EXISTS wallet_transaction_approval_trigger ON wallet_transactions;

-- Create improved trigger that handles both approval status changes and instant approvals
CREATE OR REPLACE FUNCTION public.update_wallet_balance_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Handle INSERT (for instant approvals like tournament payments)
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
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

  -- Handle UPDATE (for status changes from pending to approved)
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
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
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the trigger for both INSERT and UPDATE operations
CREATE TRIGGER wallet_transaction_balance_trigger
  AFTER INSERT OR UPDATE ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wallet_balance_on_transaction();