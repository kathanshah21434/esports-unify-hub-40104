-- Add points_display_mode column to tournaments table for 5-Man tournament display preference
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS points_display_mode TEXT DEFAULT 'grouped' CHECK (points_display_mode IN ('grouped', 'ungrouped'));