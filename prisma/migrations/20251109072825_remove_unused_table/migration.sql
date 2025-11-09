/*
  Warnings:

  - You are about to drop the `api_keys` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dashboard_cache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `file_uploads` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_offers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."api_keys" DROP CONSTRAINT "api_keys_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."file_uploads" DROP CONSTRAINT "file_uploads_uploadedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_offers" DROP CONSTRAINT "user_offers_announcementId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_offers" DROP CONSTRAINT "user_offers_userId_fkey";

-- DropTable
DROP TABLE "public"."api_keys";

-- DropTable
DROP TABLE "public"."dashboard_cache";

-- DropTable
DROP TABLE "public"."file_uploads";

-- DropTable
DROP TABLE "public"."user_offers";
