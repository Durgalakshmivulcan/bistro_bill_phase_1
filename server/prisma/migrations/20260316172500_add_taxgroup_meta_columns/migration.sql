-- Add tax group meta columns if missing
ALTER TABLE "TaxGroup"
  ADD COLUMN IF NOT EXISTS "symbol" TEXT,
  ADD COLUMN IF NOT EXISTS "percentage" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT;
