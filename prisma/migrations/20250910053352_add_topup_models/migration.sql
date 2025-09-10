-- CreateEnum
CREATE TYPE "public"."TopupStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "commissionBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fundPassword" TEXT;

-- CreateTable
CREATE TABLE "public"."admin_wallets" (
    "id" TEXT NOT NULL,
    "walletType" "public"."BankType" NOT NULL,
    "walletNumber" TEXT NOT NULL,
    "walletHolderName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."topup_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "selectedWalletId" TEXT NOT NULL,
    "paymentProof" TEXT,
    "status" "public"."TopupStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topup_requests_transactionId_key" ON "public"."topup_requests"("transactionId");

-- AddForeignKey
ALTER TABLE "public"."topup_requests" ADD CONSTRAINT "topup_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."topup_requests" ADD CONSTRAINT "topup_requests_selectedWalletId_fkey" FOREIGN KEY ("selectedWalletId") REFERENCES "public"."admin_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
