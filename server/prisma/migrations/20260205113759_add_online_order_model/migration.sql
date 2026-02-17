-- CreateEnum
CREATE TYPE "OrderAggregator" AS ENUM ('BistroBill', 'Swiggy', 'Zomato', 'UberEats');

-- CreateEnum
CREATE TYPE "OnlineOrderStatus" AS ENUM ('Pending', 'Accepted', 'Rejected', 'Preparing', 'Ready', 'Completed');

-- CreateTable
CREATE TABLE "OnlineOrder" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "aggregator" "OrderAggregator" NOT NULL DEFAULT 'BistroBill',
    "externalOrderId" TEXT,
    "status" "OnlineOrderStatus" NOT NULL DEFAULT 'Pending',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "deliveryTime" TIMESTAMP(3),
    "prepTime" INTEGER,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlineOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnlineOrder_branchId_idx" ON "OnlineOrder"("branchId");

-- CreateIndex
CREATE INDEX "OnlineOrder_status_idx" ON "OnlineOrder"("status");

-- CreateIndex
CREATE INDEX "OnlineOrder_aggregator_idx" ON "OnlineOrder"("aggregator");

-- CreateIndex
CREATE INDEX "OnlineOrder_receivedAt_idx" ON "OnlineOrder"("receivedAt");

-- AddForeignKey
ALTER TABLE "OnlineOrder" ADD CONSTRAINT "OnlineOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
