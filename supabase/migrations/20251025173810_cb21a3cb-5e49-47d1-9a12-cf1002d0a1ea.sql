-- Add payment tracking columns to tournament_registrations table
ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0;

-- Update existing registrations to have completed payment status
UPDATE public.tournament_registrations 
SET payment_status = 'completed', payment_amount = 0
WHERE payment_status IS NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.tournament_registrations.payment_status IS 'Payment status: pending, completed, or failed';
COMMENT ON COLUMN public.tournament_registrations.payment_amount IS 'Amount paid for tournament entry';