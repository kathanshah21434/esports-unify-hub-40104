-- Check current trigger for wallet balance updates
SELECT tgname, tgrelid::regclass, tgenabled, tgtype 
FROM pg_trigger 
WHERE tgname LIKE '%wallet%';

-- Check if the trigger is working correctly by examining its definition
SELECT pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'update_wallet_balance_on_approval';