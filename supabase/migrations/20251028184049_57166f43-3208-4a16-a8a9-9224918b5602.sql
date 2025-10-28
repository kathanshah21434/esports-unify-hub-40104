-- Create function to handle wallet balance updates
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance RECORD;
BEGIN
  -- Get or create wallet balance record
  SELECT * INTO current_balance FROM wallet_balances WHERE user_id = NEW.user_id;
  
  IF NOT FOUND THEN
    -- Create new wallet balance record
    INSERT INTO wallet_balances (user_id, available_balance, pending_balance, total_deposited, total_withdrawn)
    VALUES (NEW.user_id, 0, 0, 0, 0);
    
    SELECT * INTO current_balance FROM wallet_balances WHERE user_id = NEW.user_id;
  END IF;

  -- Handle INSERT (new transaction)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.transaction_type = 'deposit' THEN
      IF NEW.status = 'pending' THEN
        -- Add to pending balance only
        UPDATE wallet_balances 
        SET pending_balance = pending_balance + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
      ELSIF NEW.status = 'approved' THEN
        -- Add directly to available balance and total deposited
        UPDATE wallet_balances 
        SET available_balance = available_balance + NEW.amount,
            total_deposited = total_deposited + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
      END IF;
    ELSIF NEW.transaction_type = 'withdrawal' AND NEW.status = 'approved' THEN
      -- Deduct from available balance and add to total withdrawn
      UPDATE wallet_balances 
      SET available_balance = available_balance - NEW.amount,
          total_withdrawn = total_withdrawn + NEW.amount,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  
  -- Handle UPDATE (status change)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only process if status changed
    IF OLD.status != NEW.status THEN
      IF NEW.transaction_type = 'deposit' THEN
        IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
          -- Move from pending to available balance
          UPDATE wallet_balances 
          SET pending_balance = pending_balance - NEW.amount,
              available_balance = available_balance + NEW.amount,
              total_deposited = total_deposited + NEW.amount,
              updated_at = NOW()
          WHERE user_id = NEW.user_id;
        ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
          -- Remove from pending balance
          UPDATE wallet_balances 
          SET pending_balance = pending_balance - NEW.amount,
              updated_at = NOW()
          WHERE user_id = NEW.user_id;
        END IF;
      ELSIF NEW.transaction_type = 'withdrawal' THEN
        IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
          -- Deduct from available balance
          UPDATE wallet_balances 
          SET available_balance = available_balance - NEW.amount,
              total_withdrawn = total_withdrawn + NEW.amount,
              updated_at = NOW()
          WHERE user_id = NEW.user_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS wallet_transaction_balance_update ON wallet_transactions;

-- Create trigger for wallet transactions
CREATE TRIGGER wallet_transaction_balance_update
  AFTER INSERT OR UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

-- Fix existing incorrect balances by recalculating from transactions
DO $$
DECLARE
  user_record RECORD;
  approved_deposits NUMERIC;
  pending_deposits NUMERIC;
  approved_withdrawals NUMERIC;
BEGIN
  -- Loop through all users with wallet balances
  FOR user_record IN SELECT DISTINCT user_id FROM wallet_balances LOOP
    -- Calculate approved deposits
    SELECT COALESCE(SUM(amount), 0) INTO approved_deposits
    FROM wallet_transactions
    WHERE user_id = user_record.user_id 
      AND transaction_type = 'deposit' 
      AND status = 'approved';
    
    -- Calculate pending deposits
    SELECT COALESCE(SUM(amount), 0) INTO pending_deposits
    FROM wallet_transactions
    WHERE user_id = user_record.user_id 
      AND transaction_type = 'deposit' 
      AND status = 'pending';
    
    -- Calculate approved withdrawals
    SELECT COALESCE(SUM(amount), 0) INTO approved_withdrawals
    FROM wallet_transactions
    WHERE user_id = user_record.user_id 
      AND transaction_type = 'withdrawal' 
      AND status = 'approved';
    
    -- Update wallet balance with correct values
    UPDATE wallet_balances
    SET 
      available_balance = approved_deposits - approved_withdrawals,
      pending_balance = pending_deposits,
      total_deposited = approved_deposits,
      total_withdrawn = approved_withdrawals,
      updated_at = NOW()
    WHERE user_id = user_record.user_id;
  END LOOP;
END $$;