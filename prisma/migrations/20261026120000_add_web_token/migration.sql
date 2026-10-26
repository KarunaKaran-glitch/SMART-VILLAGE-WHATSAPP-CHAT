-- AlterTable
ALTER TABLE "User" ADD COLUMN     "webToken" TEXT,
ADD COLUMN     "webTokenAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_webToken_key" ON "User"("webToken");
