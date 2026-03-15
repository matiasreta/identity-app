-- Add notes column to timetrack_entries
-- Allows users to add free-text notes to habit entries

ALTER TABLE public.timetrack_entries
ADD COLUMN IF NOT EXISTS notes text DEFAULT '';
