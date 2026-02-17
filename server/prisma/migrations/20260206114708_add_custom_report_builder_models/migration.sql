-- CreateTable
CREATE TABLE "CustomReport" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" JSONB NOT NULL,
    "schedule" JSONB,
    "createdBy" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "customReportId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "emails" JSONB NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'CSV',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomReport_businessOwnerId_idx" ON "CustomReport"("businessOwnerId");

-- CreateIndex
CREATE INDEX "CustomReport_reportType_idx" ON "CustomReport"("reportType");

-- CreateIndex
CREATE INDEX "ReportTemplate_reportType_idx" ON "ReportTemplate"("reportType");

-- CreateIndex
CREATE INDEX "ScheduledReport_businessOwnerId_idx" ON "ScheduledReport"("businessOwnerId");

-- CreateIndex
CREATE INDEX "ScheduledReport_nextRunAt_idx" ON "ScheduledReport"("nextRunAt");

-- AddForeignKey
ALTER TABLE "CustomReport" ADD CONSTRAINT "CustomReport_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReport" ADD CONSTRAINT "ScheduledReport_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
