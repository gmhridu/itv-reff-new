/*
  Warnings:

  - You are about to drop the column `validityDays` on the `position_levels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."position_levels" DROP COLUMN "validityDays";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "commissionBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fundPassword" TEXT;
