-- When the seller marked the order delivered (shown on the customer's thank-you page)
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
