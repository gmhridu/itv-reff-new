-- AlterEnum
-- This migration adds more than one value to an enum.
-- The migration adds TASK_COMPLETED to the NotificationType enum.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TASK_COMPLETED';