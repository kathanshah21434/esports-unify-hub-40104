-- Attach balance management trigger to wallet_transactions so balances update on changes
DROP TRIGGER IF EXISTS manage_wallet_balance_on_change_trg ON public.wallet_transactions;
CREATE TRIGGER manage_wallet_balance_on_change_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_wallet_balance_on_change();