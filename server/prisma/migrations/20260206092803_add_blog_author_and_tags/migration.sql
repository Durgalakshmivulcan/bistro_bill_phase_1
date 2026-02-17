-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "authorId" TEXT;

-- CreateTable
CREATE TABLE "BlogTag" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BlogToBlogTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "BlogTag_businessOwnerId_idx" ON "BlogTag"("businessOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_businessOwnerId_slug_key" ON "BlogTag"("businessOwnerId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "_BlogToBlogTag_AB_unique" ON "_BlogToBlogTag"("A", "B");

-- CreateIndex
CREATE INDEX "_BlogToBlogTag_B_index" ON "_BlogToBlogTag"("B");

-- CreateIndex
CREATE INDEX "Blog_authorId_idx" ON "Blog"("authorId");

-- AddForeignKey
ALTER TABLE "BlogTag" ADD CONSTRAINT "BlogTag_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToBlogTag" ADD CONSTRAINT "_BlogToBlogTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogToBlogTag" ADD CONSTRAINT "_BlogToBlogTag_B_fkey" FOREIGN KEY ("B") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
