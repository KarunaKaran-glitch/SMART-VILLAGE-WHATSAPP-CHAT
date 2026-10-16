-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "reference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");