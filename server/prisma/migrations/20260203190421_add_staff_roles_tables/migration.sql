-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Role_businessOwnerId_idx" ON "Role"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Staff_businessOwnerId_idx" ON "Staff"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Staff_branchId_idx" ON "Staff"("branchId");

-- CreateIndex
CREATE INDEX "Staff_roleId_idx" ON "Staff"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_businessOwnerId_email_key" ON "Staff"("businessOwnerId", "email");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "BusinessOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
