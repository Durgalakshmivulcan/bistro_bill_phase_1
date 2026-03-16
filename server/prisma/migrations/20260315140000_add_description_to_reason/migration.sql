-- Add description column to Reason
ALTER TABLE "Reason" ADD COLUMN IF NOT EXISTS "description" TEXT;
