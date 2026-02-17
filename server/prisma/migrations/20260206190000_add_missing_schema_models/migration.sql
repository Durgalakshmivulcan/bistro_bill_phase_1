-- Migration: Sync missing schema models, enums, and columns
-- Description: Adds models and enum values from schema.prisma that were added
--              during Phases 10-12 without corresponding migrations.

-- CreateEnum
CREATE TYPE "AutoPayStatus" AS ENUM ('Created', 'Authenticated', 'Active', 'Paused', 'Cancelled', 'Completed', 'Expired');

-- AlterEnum
ALTER TYPE "IntegrationProvider" ADD VALUE 'google_my_business';
ALTER TYPE "IntegrationProvider" ADD VALUE 'email_marketing';
ALTER TYPE "IntegrationProvider" ADD VALUE 'loyalty_points';
ALTER TYPE "IntegrationProvider" ADD VALUE 'hubspot';
ALTER TYPE "IntegrationProvider" ADD VALUE 'salesforce';
ALTER TYPE "IntegrationProvider" ADD VALUE 'slack';
ALTER TYPE "IntegrationProvider" ADD VALUE 'supplier_portal';
ALTER TYPE "IntegrationProvider" ADD VALUE 'cctv';
ALTER TYPE "IntegrationProvider" ADD VALUE 'pos_hardware';
ALTER TYPE "IntegrationProvider" ADD VALUE 'biometric';
ALTER TYPE "IntegrationProvider" ADD VALUE 'voice_ordering';

-- AlterEnum
ALTER TYPE "IntegrationType" ADD VALUE 'review_management';
ALTER TYPE "IntegrationType" ADD VALUE 'loyalty';
ALTER TYPE "IntegrationType" ADD VALUE 'crm';
ALTER TYPE "IntegrationType" ADD VALUE 'notifications';
ALTER TYPE "IntegrationType" ADD VALUE 'inventory';
ALTER TYPE "IntegrationType" ADD VALUE 'security';
ALTER TYPE "IntegrationType" ADD VALUE 'hardware';
ALTER TYPE "IntegrationType" ADD VALUE 'attendance';
ALTER TYPE "IntegrationType" ADD VALUE 'voice_assistant';

-- AlterEnum
ALTER TYPE "OrderSource" ADD VALUE 'VoiceAssistant';

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "parentBranchId" TEXT;

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PermissionAuditLog" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RolePermission" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserRoleAssignment" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "inventoryProductId" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "AuditUserType" NOT NULL,
    "oldStock" DECIMAL(10,2) NOT NULL,
    "newStock" DECIMAL(10,2) NOT NULL,
    "adjustment" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "undone" BOOLEAN NOT NULL DEFAULT false,
    "undoneAt" TIMESTAMP(3),
    "undoneBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPIAutoPaySubscription" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "customerId" TEXT,
    "gatewaySubscriptionId" TEXT,
    "gatewayProvider" "GatewayProvider" NOT NULL DEFAULT 'Razorpay',
    "upiId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "interval" TEXT NOT NULL DEFAULT 'monthly',
    "status" "AutoPayStatus" NOT NULL DEFAULT 'Created',
    "currentStart" TIMESTAMP(3),
    "currentEnd" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "totalCount" INTEGER,
    "paidCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lastPaymentAt" TIMESTAMP(3),
    "lastPaymentId" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UPIAutoPaySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReview" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "externalReviewId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'google',
    "reviewerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "replyText" TEXT,
    "repliedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityCamera" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "streamUrl" TEXT,
    "nvrHost" TEXT,
    "nvrPort" INTEGER,
    "protocol" TEXT NOT NULL DEFAULT 'http',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityCamera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "punchType" TEXT NOT NULL,
    "punchTime" TIMESTAMP(3) NOT NULL,
    "deviceId" TEXT,
    "verifyMode" TEXT,
    "workHours" DOUBLE PRECISION,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAdjustment_inventoryProductId_idx" ON "StockAdjustment"("inventoryProductId");

-- CreateIndex
CREATE INDEX "StockAdjustment_businessOwnerId_idx" ON "StockAdjustment"("businessOwnerId");

-- CreateIndex
CREATE INDEX "StockAdjustment_createdAt_idx" ON "StockAdjustment"("createdAt");

-- CreateIndex
CREATE INDEX "UPIAutoPaySubscription_businessOwnerId_idx" ON "UPIAutoPaySubscription"("businessOwnerId");

-- CreateIndex
CREATE INDEX "UPIAutoPaySubscription_planId_idx" ON "UPIAutoPaySubscription"("planId");

-- CreateIndex
CREATE INDEX "UPIAutoPaySubscription_gatewaySubscriptionId_idx" ON "UPIAutoPaySubscription"("gatewaySubscriptionId");

-- CreateIndex
CREATE INDEX "UPIAutoPaySubscription_status_idx" ON "UPIAutoPaySubscription"("status");

-- CreateIndex
CREATE INDEX "UPIAutoPaySubscription_nextBillingDate_idx" ON "UPIAutoPaySubscription"("nextBillingDate");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReview_externalReviewId_key" ON "CustomerReview"("externalReviewId");

-- CreateIndex
CREATE INDEX "CustomerReview_businessOwnerId_idx" ON "CustomerReview"("businessOwnerId");

-- CreateIndex
CREATE INDEX "CustomerReview_publishedAt_idx" ON "CustomerReview"("publishedAt");

-- CreateIndex
CREATE INDEX "CustomerReview_rating_idx" ON "CustomerReview"("rating");

-- CreateIndex
CREATE INDEX "SecurityCamera_businessOwnerId_idx" ON "SecurityCamera"("businessOwnerId");

-- CreateIndex
CREATE INDEX "SecurityCamera_branchId_idx" ON "SecurityCamera"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityCamera_businessOwnerId_cameraId_key" ON "SecurityCamera"("businessOwnerId", "cameraId");

-- CreateIndex
CREATE INDEX "StaffAttendance_businessOwnerId_idx" ON "StaffAttendance"("businessOwnerId");

-- CreateIndex
CREATE INDEX "StaffAttendance_branchId_idx" ON "StaffAttendance"("branchId");

-- CreateIndex
CREATE INDEX "StaffAttendance_staffId_idx" ON "StaffAttendance"("staffId");

-- CreateIndex
CREATE INDEX "StaffAttendance_shiftDate_idx" ON "StaffAttendance"("shiftDate");

-- CreateIndex
CREATE INDEX "StaffAttendance_punchTime_idx" ON "StaffAttendance"("punchTime");

-- CreateIndex
CREATE INDEX "Branch_parentBranchId_idx" ON "Branch"("parentBranchId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_parentBranchId_fkey" FOREIGN KEY ("parentBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_inventoryProductId_fkey" FOREIGN KEY ("inventoryProductId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPIAutoPaySubscription" ADD CONSTRAINT "UPIAutoPaySubscription_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPIAutoPaySubscription" ADD CONSTRAINT "UPIAutoPaySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReview" ADD CONSTRAINT "CustomerReview_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityCamera" ADD CONSTRAINT "SecurityCamera_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityCamera" ADD CONSTRAINT "SecurityCamera_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
