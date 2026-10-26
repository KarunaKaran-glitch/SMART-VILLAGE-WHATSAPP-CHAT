-- AlterTable
ALTER TABLE "User" ADD COLUMN     "shopCode" TEXT,
ADD COLUMN     "shopId" INTEGER,
ADD COLUMN     "shopLanguage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_shopCode_key" ON "User"("shopCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
