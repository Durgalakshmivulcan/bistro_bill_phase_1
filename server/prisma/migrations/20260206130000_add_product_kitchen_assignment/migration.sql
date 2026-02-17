-- CreateTable
CREATE TABLE "ProductKitchen" (
    "productId" TEXT NOT NULL,
    "kitchenId" TEXT NOT NULL,

    CONSTRAINT "ProductKitchen_pkey" PRIMARY KEY ("productId","kitchenId")
);

-- CreateIndex
CREATE INDEX "ProductKitchen_productId_idx" ON "ProductKitchen"("productId");

-- CreateIndex
CREATE INDEX "ProductKitchen_kitchenId_idx" ON "ProductKitchen"("kitchenId");

-- AddForeignKey
ALTER TABLE "ProductKitchen" ADD CONSTRAINT "ProductKitchen_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductKitchen" ADD CONSTRAINT "ProductKitchen_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES "Kitchen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
