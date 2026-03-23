-- Add new order status values to support draft and hold flows
DO $$ BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'Draft';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OnHold';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
