-- Add week_days column to timetrack_habits
-- Stores which days of the week the habit is active (0=Sunday, 6=Saturday)
-- Default: all days {0,1,2,3,4,5,6}

ALTER TABLE public.timetrack_habits
ADD COLUMN IF NOT EXISTS week_days smallint[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}';
