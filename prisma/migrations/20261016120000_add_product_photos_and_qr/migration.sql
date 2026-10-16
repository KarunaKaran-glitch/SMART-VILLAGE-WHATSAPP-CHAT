-- CreateEnum
CREATE TYPE "ProductApproval" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserState" ADD VALUE 'ADDING_PRODUCT_PHOTO';
ALTER TYPE "UserState" ADD VALUE 'SETTING_UPI_QR';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "approval" "ProductApproval" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "imageKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "upiQrKey" TEXT;

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_key_key" ON "Image"("key");

