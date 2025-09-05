-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "public"."PlanStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'POSITION_DEPOSIT', 'REFERRAL_REWARD_A', 'REFERRAL_REWARD_B', 'REFERRAL_REWARD_C', 'MANAGEMENT_BONUS_A', 'MANAGEMENT_BONUS_B', 'MANAGEMENT_BONUS_C', 'TASK_INCOME');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'REGISTERED', 'QUALIFIED', 'REWARDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."ReferralLevel" AS ENUM ('A_LEVEL', 'B_LEVEL', 'C_LEVEL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentPositionId" TEXT,
    "positionStartDate" TIMESTAMP(3),
    "positionEndDate" TIMESTAMP(3),
    "depositPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isIntern" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER DEFAULT 0,
    "lastFailedLogin" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."position_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "deposit" DOUBLE PRECISION NOT NULL,
    "tasksPerDay" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "dailyVideoLimit" INTEGER NOT NULL,
    "rewardPerVideo" DOUBLE PRECISION NOT NULL,
    "referralBonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" INTEGER NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "positionLevelId" TEXT,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_video_tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL,
    "watchDuration" INTEGER NOT NULL,
    "rewardEarned" DOUBLE PRECISION NOT NULL,
    "positionLevel" TEXT,
    "ipAddress" TEXT,
    "deviceId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_video_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."withdrawal_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDetails" TEXT NOT NULL,
    "status" "public"."WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_activities" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referralCode" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardAmount" DOUBLE PRECISION,
    "rewardPaidAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_rewards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerEvent" TEXT NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "maxRewards" INTEGER,
    "currentRewards" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL DEFAULT 'ADMIN',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referral_hierarchy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "level" "public"."ReferralLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_hierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_management_bonuses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subordinateId" TEXT NOT NULL,
    "subordinateLevel" "public"."ReferralLevel" NOT NULL,
    "bonusAmount" DOUBLE PRECISION NOT NULL,
    "taskDate" TIMESTAMP(3) NOT NULL,
    "taskIncome" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_management_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "public"."users"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "position_levels_name_key" ON "public"."position_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "position_levels_level_key" ON "public"."position_levels"("level");

-- CreateIndex
CREATE UNIQUE INDEX "user_plans_userId_key" ON "public"."user_plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_video_tasks_userId_videoId_key" ON "public"."user_video_tasks"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_referenceId_key" ON "public"."wallet_transactions"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "public"."admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "public"."settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "referral_hierarchy_userId_referrerId_key" ON "public"."referral_hierarchy"("userId", "referrerId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_currentPositionId_fkey" FOREIGN KEY ("currentPositionId") REFERENCES "public"."position_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_plans" ADD CONSTRAINT "user_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_plans" ADD CONSTRAINT "user_plans_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."videos" ADD CONSTRAINT "videos_positionLevelId_fkey" FOREIGN KEY ("positionLevelId") REFERENCES "public"."position_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_video_tasks" ADD CONSTRAINT "user_video_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_video_tasks" ADD CONSTRAINT "user_video_tasks_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_activities" ADD CONSTRAINT "referral_activities_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_hierarchy" ADD CONSTRAINT "referral_hierarchy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referral_hierarchy" ADD CONSTRAINT "referral_hierarchy_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_management_bonuses" ADD CONSTRAINT "task_management_bonuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_management_bonuses" ADD CONSTRAINT "task_management_bonuses_subordinateId_fkey" FOREIGN KEY ("subordinateId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
