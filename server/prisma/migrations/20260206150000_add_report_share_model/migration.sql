-- CreateTable
CREATE TABLE "ReportShare" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "reportConfig" JSONB NOT NULL,
    "reportData" JSONB NOT NULL,
    "shareToken" TEXT NOT NULL,
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportShare_shareToken_key" ON "ReportShare"("shareToken");

-- CreateIndex
CREATE INDEX "ReportShare_businessOwnerId_idx" ON "ReportShare"("businessOwnerId");

-- CreateIndex
CREATE INDEX "ReportShare_shareToken_idx" ON "ReportShare"("shareToken");

-- CreateIndex
CREATE INDEX "ReportShare_expiresAt_idx" ON "ReportShare"("expiresAt");

-- AddForeignKey
ALTER TABLE "ReportShare" ADD CONSTRAINT "ReportShare_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
