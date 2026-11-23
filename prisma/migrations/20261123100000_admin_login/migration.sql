-- Admin login on the website: a unique Admin ID and a password (stored only as a scrypt hash)
ALTER TABLE "User" ADD COLUMN "adminCode" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
CREATE UNIQUE INDEX "User_adminCode_key" ON "User"("adminCode");
