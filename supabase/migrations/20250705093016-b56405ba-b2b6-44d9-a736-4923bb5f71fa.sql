-- Add additional fields for tournament structure and timeline
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS overview_content JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS schedule_content JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS prizes_content JSONB DEFAULT '{}';

-- Update existing tournaments with default values
UPDATE public.tournaments 
SET 
  start_time = '14:00:00'::TIME,
  end_time = '18:00:00'::TIME,
  overview_content = '{"highlights": [], "timeline": []}',
  schedule_content = '{"phases": []}',
  prizes_content = '{"positions": [], "additional_rewards": []}'
WHERE start_time IS NULL;