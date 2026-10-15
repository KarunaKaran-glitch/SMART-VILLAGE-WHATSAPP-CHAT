-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'UPI_DIRECT';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'AWAITING_CONFIRMATION';

-- AlterEnum
ALTER TYPE "UserState" ADD VALUE 'CHOOSING_PAYMENT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "upiId" TEXT;
