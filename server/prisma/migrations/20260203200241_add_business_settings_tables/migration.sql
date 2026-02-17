-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('Cash', 'Card', 'UPI', 'Wallet', 'Other');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('Percentage', 'Fixed');

-- CreateEnum
CREATE TYPE "ChargeApplyTo" AS ENUM ('All', 'DineIn', 'TakeAway', 'Delivery');

-- CreateEnum
CREATE TYPE "ReasonType" AS ENUM ('Discount', 'BranchClose', 'OrderCancel', 'Refund', 'NonChargeable', 'InventoryAdjustment', 'Reservation', 'SalesReturn');

-- CreateTable
CREATE TABLE "Tax" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxGroup" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxGroupItem" (
    "taxGroupId" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,

    CONSTRAINT "TaxGroupItem_pkey" PRIMARY KEY ("taxGroupId","taxId")
);

-- CreateTable
CREATE TABLE "PaymentOption" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'Cash',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChargeType" NOT NULL DEFAULT 'Fixed',
    "value" DECIMAL(10,2) NOT NULL,
    "applyTo" "ChargeApplyTo" NOT NULL DEFAULT 'All',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reason" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "type" "ReasonType" NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPreference" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "kotPrefix" TEXT NOT NULL DEFAULT 'KOT',
    "autoAcceptOrders" BOOLEAN NOT NULL DEFAULT false,
    "enableReservations" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tax_businessOwnerId_idx" ON "Tax"("businessOwnerId");

-- CreateIndex
CREATE INDEX "TaxGroup_businessOwnerId_idx" ON "TaxGroup"("businessOwnerId");

-- CreateIndex
CREATE INDEX "TaxGroupItem_taxGroupId_idx" ON "TaxGroupItem"("taxGroupId");

-- CreateIndex
CREATE INDEX "TaxGroupItem_taxId_idx" ON "TaxGroupItem"("taxId");

-- CreateIndex
CREATE INDEX "PaymentOption_businessOwnerId_idx" ON "PaymentOption"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Charge_businessOwnerId_idx" ON "Charge"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Reason_businessOwnerId_idx" ON "Reason"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Reason_type_idx" ON "Reason"("type");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPreference_businessOwnerId_key" ON "BusinessPreference"("businessOwnerId");

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_taxGroupId_fkey" FOREIGN KEY ("taxGroupId") REFERENCES "TaxGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_paymentOptionId_fkey" FOREIGN KEY ("paymentOptionId") REFERENCES "PaymentOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tax" ADD CONSTRAINT "Tax_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxGroup" ADD CONSTRAINT "TaxGroup_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxGroupItem" ADD CONSTRAINT "TaxGroupItem_taxGroupId_fkey" FOREIGN KEY ("taxGroupId") REFERENCES "TaxGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxGroupItem" ADD CONSTRAINT "TaxGroupItem_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOption" ADD CONSTRAINT "PaymentOption_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reason" ADD CONSTRAINT "Reason_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPreference" ADD CONSTRAINT "BusinessPreference_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
