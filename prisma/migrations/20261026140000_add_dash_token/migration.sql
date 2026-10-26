-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dashToken" TEXT,
ADD COLUMN     "dashTokenAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_dashToken_key" ON "User"("dashToken");
