-- AlterEnum
ALTER TYPE "UserState" ADD VALUE 'ADDING_PRODUCT_DESCRIPTION';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT;

