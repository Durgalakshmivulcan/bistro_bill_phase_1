-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('Regular', 'Corporate', 'VIP');

-- CreateTable
CREATE TABLE "CustomerGroup" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "type" "CustomerType" NOT NULL DEFAULT 'Regular',
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "customerGroupId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerGroup_businessOwnerId_idx" ON "CustomerGroup"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Customer_businessOwnerId_idx" ON "Customer"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Customer_customerGroupId_idx" ON "Customer"("customerGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessOwnerId_phone_key" ON "Customer"("businessOwnerId", "phone");

-- AddForeignKey
ALTER TABLE "CustomerGroup" ADD CONSTRAINT "CustomerGroup_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
