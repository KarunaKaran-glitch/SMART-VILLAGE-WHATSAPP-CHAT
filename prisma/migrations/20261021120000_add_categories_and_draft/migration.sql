-- AlterEnum
ALTER TYPE "ProductApproval" ADD VALUE 'DRAFT';

-- AlterEnum
ALTER TYPE "UserState" ADD VALUE 'CHOOSING_CATEGORY';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "categoryId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "categoryId" INTEGER;

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "names" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Starting categories (names in English, with Hindi, Odia and Assamese translations)
INSERT INTO "Category" ("name", "names") VALUES
  ('Keychains', '{"hi": "चाबी के छल्ले", "or": "ଚାବି ରିଙ୍ଗ", "as": "চাবিৰ ৰিং"}'),
  ('Handbags',  '{"hi": "हैंडबैग", "or": "ହ୍ୟାଣ୍ଡବ୍ୟାଗ", "as": "হাতবেগ"}'),
  ('Wallets',   '{"hi": "बटुए", "or": "ୱାଲେଟ୍", "as": "মানিবেগ"}');

-- Everything sold so far is a bag
UPDATE "Product" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Handbags');
UPDATE "User" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Handbags') WHERE "role" = 'SELLER';