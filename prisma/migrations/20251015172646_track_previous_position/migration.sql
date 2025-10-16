-- AlterTable
ALTER TABLE "users" ADD COLUMN     "previousPositionId" TEXT;

-- RenameForeignKey
ALTER TABLE "users" RENAME CONSTRAINT "users_currentPositionId_fkey" TO "user_current_position_fkey";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "user_previous_position_fkey" FOREIGN KEY ("previousPositionId") REFERENCES "position_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
