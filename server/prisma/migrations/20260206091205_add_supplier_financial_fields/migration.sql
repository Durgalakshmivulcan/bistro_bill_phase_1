-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "taxStateCode" TEXT,
ADD COLUMN     "tinNumber" TEXT;

-- CreateTable
CREATE TABLE "MeasuringUnit" (
    "id" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeasuringUnit_pkey" PRIMARY KEY ("id")
);
