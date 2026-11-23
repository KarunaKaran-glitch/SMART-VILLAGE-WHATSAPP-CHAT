-- Warnings the admin sends to a seller (WhatsApp message with their score and what to fix)
CREATE TABLE "SellerWarning" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "problems" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerWarning_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SellerWarning_sellerId_idx" ON "SellerWarning"("sellerId");

ALTER TABLE "SellerWarning" ADD CONSTRAINT "SellerWarning_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
