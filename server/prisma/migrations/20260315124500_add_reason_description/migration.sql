-- Placeholder migration (original file missing)
-- If not already present, add description column to Reason
ALTER TABLE "Reason" ADD COLUMN IF NOT EXISTS "description" TEXT;
