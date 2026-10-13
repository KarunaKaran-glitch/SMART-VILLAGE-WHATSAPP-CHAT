-- AlterEnum
ALTER TYPE "UserState" ADD VALUE 'ENTERING_ADDRESS';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryAddress" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT;
