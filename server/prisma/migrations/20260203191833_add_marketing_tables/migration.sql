-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('ProductCategory', 'OrderType', 'Custom');

-- CreateEnum
CREATE TYPE "DiscountValueType" AS ENUM ('Percentage', 'Fixed', 'BOGO');

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL DEFAULT 'Custom',
    "valueType" "DiscountValueType" NOT NULL DEFAULT 'Percentage',
    "value" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountProduct" (
    "discountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "DiscountProduct_pkey" PRIMARY KEY ("discountId","productId")
);

-- CreateTable
CREATE TABLE "DiscountCategory" (
    "discountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "DiscountCategory_pkey" PRIMARY KEY ("discountId","categoryId")
);

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvertisementDiscount" (
    "advertisementId" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,

    CONSTRAINT "AdvertisementDiscount_pkey" PRIMARY KEY ("advertisementId","discountId")
);

-- CreateTable
CREATE TABLE "FeedbackForm" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "questions" JSONB NOT NULL,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackResponse" (
    "id" TEXT NOT NULL,
    "feedbackFormId" TEXT NOT NULL,
    "customerId" TEXT,
    "responses" JSONB NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Discount_businessOwnerId_idx" ON "Discount"("businessOwnerId");

-- CreateIndex
CREATE INDEX "DiscountProduct_discountId_idx" ON "DiscountProduct"("discountId");

-- CreateIndex
CREATE INDEX "DiscountProduct_productId_idx" ON "DiscountProduct"("productId");

-- CreateIndex
CREATE INDEX "DiscountCategory_discountId_idx" ON "DiscountCategory"("discountId");

-- CreateIndex
CREATE INDEX "DiscountCategory_categoryId_idx" ON "DiscountCategory"("categoryId");

-- CreateIndex
CREATE INDEX "Advertisement_businessOwnerId_idx" ON "Advertisement"("businessOwnerId");

-- CreateIndex
CREATE INDEX "AdvertisementDiscount_advertisementId_idx" ON "AdvertisementDiscount"("advertisementId");

-- CreateIndex
CREATE INDEX "AdvertisementDiscount_discountId_idx" ON "AdvertisementDiscount"("discountId");

-- CreateIndex
CREATE INDEX "FeedbackForm_businessOwnerId_idx" ON "FeedbackForm"("businessOwnerId");

-- CreateIndex
CREATE INDEX "FeedbackResponse_feedbackFormId_idx" ON "FeedbackResponse"("feedbackFormId");

-- CreateIndex
CREATE INDEX "FeedbackResponse_customerId_idx" ON "FeedbackResponse"("customerId");

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCategory" ADD CONSTRAINT "DiscountCategory_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCategory" ADD CONSTRAINT "DiscountCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementDiscount" ADD CONSTRAINT "AdvertisementDiscount_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvertisementDiscount" ADD CONSTRAINT "AdvertisementDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackForm" ADD CONSTRAINT "FeedbackForm_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackResponse" ADD CONSTRAINT "FeedbackResponse_feedbackFormId_fkey" FOREIGN KEY ("feedbackFormId") REFERENCES "FeedbackForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackResponse" ADD CONSTRAINT "FeedbackResponse_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
