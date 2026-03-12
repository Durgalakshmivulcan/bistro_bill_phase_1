-- Add optional description column to discounts
ALTER TABLE "Discount"
ADD COLUMN IF NOT EXISTS "description" TEXT;
