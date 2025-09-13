-- CreateEnum
CREATE TYPE "public"."AnnouncementTargetType" AS ENUM ('ALL', 'SPECIFIC_USERS', 'SPECIFIC_LEVELS', 'SPECIFIC_ROLES');

-- CreateTable
CREATE TABLE "public"."user_announcements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "targetType" TEXT DEFAULT 'all',
    "targetId" TEXT,
    "scheduleType" TEXT NOT NULL DEFAULT 'immediate',
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_announcements_isRead_idx" ON "public"."user_announcements"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "user_announcements_userId_announcementId_key" ON "public"."user_announcements"("userId", "announcementId");

-- CreateIndex
CREATE INDEX "announcements_isActive_idx" ON "public"."announcements"("isActive");

-- CreateIndex
CREATE INDEX "announcements_scheduledAt_idx" ON "public"."announcements"("scheduledAt");

-- CreateIndex
CREATE INDEX "announcements_expiresAt_idx" ON "public"."announcements"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."user_announcements" ADD CONSTRAINT "user_announcements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_announcements" ADD CONSTRAINT "user_announcements_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "public"."announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
