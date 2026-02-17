-- AlterTable
ALTER TABLE "Advertisement" ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "conversions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BlogRevision" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogRevision_blogId_idx" ON "BlogRevision"("blogId");

-- CreateIndex
CREATE INDEX "BlogRevision_createdAt_idx" ON "BlogRevision"("createdAt");

-- AddForeignKey
ALTER TABLE "BlogRevision" ADD CONSTRAINT "BlogRevision_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogRevision" ADD CONSTRAINT "BlogRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
