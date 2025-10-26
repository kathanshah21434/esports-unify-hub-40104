-- Add tournament timer functionality
ALTER TABLE public.tournaments 
ADD COLUMN timer_duration INTEGER DEFAULT 0,
ADD COLUMN timer_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN timer_is_running BOOLEAN DEFAULT false;