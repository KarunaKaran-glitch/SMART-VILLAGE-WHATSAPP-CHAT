ALTER TABLE "Payment" ADD COLUMN "disputedAt" TIMESTAMP(3),
ADD COLUMN "disputeProofKey" TEXT,
ADD COLUMN "disputeResult" TEXT;
