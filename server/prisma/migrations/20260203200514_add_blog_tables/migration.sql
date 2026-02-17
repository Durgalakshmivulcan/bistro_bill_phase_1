-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('Draft', 'Published');

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "author" TEXT,
    "status" "BlogStatus" NOT NULL DEFAULT 'Draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogCategory_businessOwnerId_idx" ON "BlogCategory"("businessOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_businessOwnerId_slug_key" ON "BlogCategory"("businessOwnerId", "slug");

-- CreateIndex
CREATE INDEX "Blog_businessOwnerId_idx" ON "Blog"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Blog_categoryId_idx" ON "Blog"("categoryId");

-- CreateIndex
CREATE INDEX "Blog_status_idx" ON "Blog"("status");

-- CreateIndex
CREATE INDEX "Blog_publishedAt_idx" ON "Blog"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_businessOwnerId_slug_key" ON "Blog"("businessOwnerId", "slug");

-- AddForeignKey
ALTER TABLE "BlogCategory" ADD CONSTRAINT "BlogCategory_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
