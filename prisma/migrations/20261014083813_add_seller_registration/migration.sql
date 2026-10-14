-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "UserState" ADD VALUE 'ENTERING_SHOP_NAME';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sellerStatus" "SellerStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "shopName" TEXT;
