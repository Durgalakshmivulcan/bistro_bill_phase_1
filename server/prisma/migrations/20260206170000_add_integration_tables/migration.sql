-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('accounting', 'delivery', 'marketing', 'payment');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('tally', 'quickbooks', 'zoho_books', 'dunzo', 'porter', 'whatsapp_business', 'sms_gateway');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('active', 'inactive', 'error');

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "config" JSONB NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'inactive',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Integration_businessOwnerId_idx" ON "Integration"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_businessOwnerId_provider_key" ON "Integration"("businessOwnerId", "provider");

-- CreateIndex
CREATE INDEX "IntegrationLog_integrationId_idx" ON "IntegrationLog"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationLog_createdAt_idx" ON "IntegrationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
