-- Drop duplicate and old triggers
DROP TRIGGER IF EXISTS manage_wallet_balance_on_change_trg ON wallet_transactions;
DROP TRIGGER IF EXISTS trg_wallet_transactions_balance ON wallet_transactions;

-- Keep only the new trigger (wallet_transaction_balance_update)
-- and the ensure_wallet_balance_before_transaction trigger

-- Recalculate all balances again to fix any inconsistencies
DO $$
DECLARE
  user_record RECORD;
  approved_deposits NUMERIC;
  pending_deposits NUMERIC;
  approved_withdrawals NUMERIC;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM wallet_balances LOOP
    SELECT COALESCE(SUM(amount), 0) INTO approved_deposits
    FROM wallet_transactions
    WHERE user_id = user_record.user_id 
      AND transaction_type = 'deposit' 
      AND status = 'approved';
    
    SELECT COALESCE(SUM(amount), 0) INTO pending_deposits
    FROM wallet_transactions
    WHERE user_id = user_record.user_id 
      AND transaction_type = 'deposit' 
      AND status = 'pending';
    
    SELECT COALESCE(SUM(amount), 0) INTO approved_withdrawals
    FROM wallet_transactions
    WHERE user_id = user_record.user_id 
      AND transaction_type = 'withdrawal' 
      AND status = 'approved';
    
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