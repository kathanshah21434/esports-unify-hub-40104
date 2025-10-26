-- Add winners field to tournaments table for storing winner announcements
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS winners TEXT;