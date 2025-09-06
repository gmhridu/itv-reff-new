/*
  Warnings:

  - You are about to drop the column `admin_id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `session_id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `last_used_at` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `admin_id` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `target_id` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `cache_key` on the `dashboard_cache` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `dashboard_cache` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `dashboard_cache` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `dashboard_cache` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `file_name` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `file_path` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `file_size` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `is_processed` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `mime_type` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `original_name` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `processing_status` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `upload_type` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_by` on the `file_uploads` table. All the data in the column will be lost.
  - You are about to drop the column `admin_id` on the `system_logs` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `system_logs` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `system_logs` table. All the data in the column will be lost.
  - You are about to drop the column `action_url` on the `system_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `system_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `is_read` on the `system_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `read_at` on the `system_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `target_id` on the `system_notifications` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `system_notifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `admin_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cacheKey]` on the table `dashboard_cache` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `admin_users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetType` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cacheKey` to the `dashboard_cache` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `dashboard_cache` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `dashboard_cache` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `file_uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `file_uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `file_uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `file_uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `file_uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `file_uploads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadType` to the `file_uploads` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."activity_logs" DROP CONSTRAINT "activity_logs_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."activity_logs" DROP CONSTRAINT "activity_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."api_keys" DROP CONSTRAINT "api_keys_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."file_uploads" DROP CONSTRAINT "file_uploads_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."system_logs" DROP CONSTRAINT "system_logs_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."system_logs" DROP CONSTRAINT "system_logs_user_id_fkey";

-- DropIndex
DROP INDEX "public"."activity_logs_admin_id_idx";

-- DropIndex
DROP INDEX "public"."activity_logs_created_at_idx";

-- DropIndex
DROP INDEX "public"."activity_logs_user_id_idx";

-- DropIndex
DROP INDEX "public"."dashboard_cache_cache_key_idx";

-- DropIndex
DROP INDEX "public"."dashboard_cache_cache_key_key";

-- DropIndex
DROP INDEX "public"."dashboard_cache_expires_at_idx";

-- DropIndex
DROP INDEX "public"."system_logs_created_at_idx";

-- AlterTable
ALTER TABLE "public"."activity_logs" DROP COLUMN "admin_id",
DROP COLUMN "created_at",
DROP COLUMN "ip_address",
DROP COLUMN "session_id",
DROP COLUMN "user_agent",
DROP COLUMN "user_id",
ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "public"."admin_users" ADD COLUMN     "phone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."api_keys" DROP COLUMN "created_at",
DROP COLUMN "created_by",
DROP COLUMN "expires_at",
DROP COLUMN "is_active",
DROP COLUMN "last_used_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."audit_logs" DROP COLUMN "admin_id",
DROP COLUMN "created_at",
DROP COLUMN "ip_address",
DROP COLUMN "target_id",
DROP COLUMN "target_type",
DROP COLUMN "user_agent",
ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "targetType" TEXT NOT NULL,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "public"."dashboard_cache" DROP COLUMN "cache_key",
DROP COLUMN "created_at",
DROP COLUMN "expires_at",
DROP COLUMN "updated_at",
ADD COLUMN     "cacheKey" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."file_uploads" DROP COLUMN "created_at",
DROP COLUMN "file_name",
DROP COLUMN "file_path",
DROP COLUMN "file_size",
DROP COLUMN "is_processed",
DROP COLUMN "mime_type",
DROP COLUMN "original_name",
DROP COLUMN "processing_status",
DROP COLUMN "updated_at",
DROP COLUMN "upload_type",
DROP COLUMN "uploaded_by",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "processingStatus" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadType" "public"."FileUploadType" NOT NULL,
ADD COLUMN     "uploadedBy" TEXT;

-- AlterTable
ALTER TABLE "public"."system_logs" DROP COLUMN "admin_id",
DROP COLUMN "created_at",
DROP COLUMN "user_id",
ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "public"."system_notifications" DROP COLUMN "action_url",
DROP COLUMN "created_at",
DROP COLUMN "is_read",
DROP COLUMN "read_at",
DROP COLUMN "target_id",
DROP COLUMN "target_type",
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "targetType" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."videos" ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "tags" TEXT,
ADD COLUMN     "uploadMethod" TEXT NOT NULL DEFAULT 'file',
ADD COLUMN     "youtubeVideoId" TEXT;

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "public"."activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_adminId_idx" ON "public"."activity_logs"("adminId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "public"."activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_phone_key" ON "public"."admin_users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_cache_cacheKey_key" ON "public"."dashboard_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "dashboard_cache_cacheKey_idx" ON "public"."dashboard_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "dashboard_cache_expiresAt_idx" ON "public"."dashboard_cache"("expiresAt");

-- CreateIndex
CREATE INDEX "system_logs_createdAt_idx" ON "public"."system_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_uploads" ADD CONSTRAINT "file_uploads_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system_logs" ADD CONSTRAINT "system_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system_logs" ADD CONSTRAINT "system_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
