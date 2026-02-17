-- CreateTable
CREATE TABLE "SalesChannel" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aggregator" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "merchantId" TEXT,
    "apiKey" TEXT,
    "apiEndpoint" TEXT,
    "callbackUrl" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aggregator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesChannel_businessOwnerId_idx" ON "SalesChannel"("businessOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesChannel_businessOwnerId_name_key" ON "SalesChannel"("businessOwnerId", "name");

-- CreateIndex
CREATE INDEX "Aggregator_businessOwnerId_idx" ON "Aggregator"("businessOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Aggregator_businessOwnerId_name_key" ON "Aggregator"("businessOwnerId", "name");

-- AddForeignKey
ALTER TABLE "SalesChannel" ADD CONSTRAINT "SalesChannel_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aggregator" ADD CONSTRAINT "Aggregator_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
