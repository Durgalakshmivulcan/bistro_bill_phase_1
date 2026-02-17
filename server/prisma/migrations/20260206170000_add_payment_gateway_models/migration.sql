-- CreateEnum
CREATE TYPE "GatewayProvider" AS ENUM ('Razorpay', 'Stripe', 'PayU');

-- CreateEnum
CREATE TYPE "OnlinePaymentStatus" AS ENUM ('Created', 'Processing', 'Completed', 'Failed', 'Refunded', 'PartiallyRefunded');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('Initiated', 'Processing', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('Pending', 'Reconciled', 'Disputed', 'Settled');

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "provider" "GatewayProvider" NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isTestMode" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlinePayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gatewayProvider" "GatewayProvider" NOT NULL,
    "gatewayTransactionId" TEXT,
    "gatewayOrderId" TEXT,
    "status" "OnlinePaymentStatus" NOT NULL DEFAULT 'Created',
    "paymentMethod" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnlinePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "onlinePaymentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'Initiated',
    "gatewayRefundId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReconciliation" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "settlementDate" DATE NOT NULL,
    "gatewayProvider" "GatewayProvider" NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "settledAmount" DECIMAL(12,2) NOT NULL,
    "fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'Pending',
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayConfig_businessOwnerId_provider_key" ON "PaymentGatewayConfig"("businessOwnerId", "provider");

-- CreateIndex
CREATE INDEX "PaymentGatewayConfig_businessOwnerId_idx" ON "PaymentGatewayConfig"("businessOwnerId");

-- CreateIndex
CREATE INDEX "OnlinePayment_orderId_idx" ON "OnlinePayment"("orderId");

-- CreateIndex
CREATE INDEX "OnlinePayment_gatewayTransactionId_idx" ON "OnlinePayment"("gatewayTransactionId");

-- CreateIndex
CREATE INDEX "OnlinePayment_gatewayOrderId_idx" ON "OnlinePayment"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "OnlinePayment_status_idx" ON "OnlinePayment"("status");

-- CreateIndex
CREATE INDEX "Refund_onlinePaymentId_idx" ON "Refund"("onlinePaymentId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_businessOwnerId_idx" ON "PaymentReconciliation"("businessOwnerId");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_settlementDate_idx" ON "PaymentReconciliation"("settlementDate");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_gatewayProvider_idx" ON "PaymentReconciliation"("gatewayProvider");

-- CreateIndex
CREATE INDEX "PaymentReconciliation_status_idx" ON "PaymentReconciliation"("status");

-- AddForeignKey
ALTER TABLE "PaymentGatewayConfig" ADD CONSTRAINT "PaymentGatewayConfig_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlinePayment" ADD CONSTRAINT "OnlinePayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_onlinePaymentId_fkey" FOREIGN KEY ("onlinePaymentId") REFERENCES "OnlinePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReconciliation" ADD CONSTRAINT "PaymentReconciliation_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
