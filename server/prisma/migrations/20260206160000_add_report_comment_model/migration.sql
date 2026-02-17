-- CreateTable
CREATE TABLE "ReportComment" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "reportConfig" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "mentions" JSONB,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportComment_businessOwnerId_idx" ON "ReportComment"("businessOwnerId");

-- CreateIndex
CREATE INDEX "ReportComment_reportType_idx" ON "ReportComment"("reportType");

-- CreateIndex
CREATE INDEX "ReportComment_createdAt_idx" ON "ReportComment"("createdAt");

-- AddForeignKey
ALTER TABLE "ReportComment" ADD CONSTRAINT "ReportComment_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
