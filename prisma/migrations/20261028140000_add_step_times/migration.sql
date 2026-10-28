-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "shippedAt" TIMESTAMP(3);
