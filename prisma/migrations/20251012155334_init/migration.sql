/*
  Warnings:

  - You are about to drop the column `securityDeposited` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SecurityRefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'TOPUP_BONUS';
ALTER TYPE "TransactionType" ADD VALUE 'SPECIAL_COMMISSION';
ALTER TYPE "TransactionType" ADD VALUE 'SECURITY_REFUND';

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "metadata" TEXT;

-- AlterTable
ALTER TABLE "referral_activities" ADD COLUMN     "qualifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "securityDeposited",
ADD COLUMN     "securityRefund" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_offers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "announcementId" TEXT,
    "offerType" TEXT NOT NULL,
    "offerValue" TEXT NOT NULL,
    "offerCode" TEXT,
    "description" TEXT,
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_refund_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromLevel" INTEGER NOT NULL,
    "toLevel" INTEGER NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "status" "SecurityRefundStatus" NOT NULL DEFAULT 'PENDING',
    "requestNote" TEXT,
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_offers_userId_idx" ON "user_offers"("userId");

-- CreateIndex
CREATE INDEX "user_offers_isRedeemed_idx" ON "user_offers"("isRedeemed");

-- CreateIndex
CREATE INDEX "user_offers_expiresAt_idx" ON "user_offers"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_userId_idx" ON "password_resets"("userId");

-- CreateIndex
CREATE INDEX "password_resets_expiresAt_idx" ON "password_resets"("expiresAt");

-- CreateIndex
CREATE INDEX "whatsapp_otps_phone_idx" ON "whatsapp_otps"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_otps_otp_idx" ON "whatsapp_otps"("otp");

-- CreateIndex
CREATE INDEX "whatsapp_otps_userId_idx" ON "whatsapp_otps"("userId");

-- CreateIndex
CREATE INDEX "whatsapp_otps_expiresAt_idx" ON "whatsapp_otps"("expiresAt");

-- AddForeignKey
ALTER TABLE "user_offers" ADD CONSTRAINT "user_offers_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_offers" ADD CONSTRAINT "user_offers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_refund_requests" ADD CONSTRAINT "security_refund_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_otps" ADD CONSTRAINT "whatsapp_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
