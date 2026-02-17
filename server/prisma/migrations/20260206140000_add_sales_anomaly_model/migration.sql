-- CreateTable
CREATE TABLE "SalesAnomaly" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "actualValue" DECIMAL(12,2) NOT NULL,
    "expectedValue" DECIMAL(12,2) NOT NULL,
    "deviation" DECIMAL(10,2) NOT NULL,
    "standardDeviations" DECIMAL(6,2) NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesAnomaly_businessOwnerId_branchId_date_key" ON "SalesAnomaly"("businessOwnerId", "branchId", "date");

-- CreateIndex
CREATE INDEX "SalesAnomaly_businessOwnerId_idx" ON "SalesAnomaly"("businessOwnerId");

-- CreateIndex
CREATE INDEX "SalesAnomaly_date_idx" ON "SalesAnomaly"("date");

-- CreateIndex
CREATE INDEX "SalesAnomaly_resolved_idx" ON "SalesAnomaly"("resolved");

-- AddForeignKey
ALTER TABLE "SalesAnomaly" ADD CONSTRAINT "SalesAnomaly_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
