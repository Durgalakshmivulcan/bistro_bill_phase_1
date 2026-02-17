-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NewRequest', 'InitialContacted', 'ScheduledDemo', 'Completed', 'ClosedWin', 'ClosedLoss');

-- CreateEnum
CREATE TYPE "AuditUserType" AS ENUM ('SuperAdmin', 'BusinessOwner', 'Staff');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "businessType" TEXT,
    "inquiryType" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "zipCode" TEXT,
    "address" TEXT,
    "description" TEXT,
    "stage" "LeadStage" NOT NULL DEFAULT 'NewRequest',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT,
    "userId" TEXT NOT NULL,
    "userType" "AuditUserType" NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_businessOwnerId_idx" ON "AuditLog"("businessOwnerId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userType_idx" ON "AuditLog"("userType");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
