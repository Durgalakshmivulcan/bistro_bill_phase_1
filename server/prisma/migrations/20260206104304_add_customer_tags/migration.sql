-- CreateTable
CREATE TABLE "CustomerTag" (
    "customerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("customerId","tagId")
);

-- CreateIndex
CREATE INDEX "CustomerTag_customerId_idx" ON "CustomerTag"("customerId");

-- CreateIndex
CREATE INDEX "CustomerTag_tagId_idx" ON "CustomerTag"("tagId");

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
