/*
  Warnings:

  - You are about to drop the column `youtubeVideoId` on the `videos` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."BankType" ADD VALUE 'USDT_TRC20';

-- AlterTable
ALTER TABLE "public"."admin_wallets" ADD COLUMN     "qrCodeUrl" TEXT,
ADD COLUMN     "usdtWalletAddress" TEXT,
ALTER COLUMN "walletNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."videos" DROP COLUMN "youtubeVideoId";

-- CreateTable
CREATE TABLE "public"."slider_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slider_images_pkey" PRIMARY KEY ("id")
);
