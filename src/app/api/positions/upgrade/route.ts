import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { PositionService } from "@/lib/position-service";
import { EnhancedReferralService } from "@/lib/enhanced-referral-service";
import { UserNotificationService } from "@/lib/user-notification-service";

export async function POST(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { targetPositionId, depositAmount } = body;

    if (!targetPositionId || !depositAmount) {
      return NextResponse.json(
        { error: "Target position ID and deposit amount are required" },
        { status: 400 },
      );
    }

    // Attempt position upgrade
    const upgradeResult = await PositionService.upgradePosition(
      user.id,
      targetPositionId,
      depositAmount,
    );

    if (!upgradeResult.success) {
      return NextResponse.json(
        { error: upgradeResult.message },
        { status: 400 },
      );
    }

    // If upgrade successful and user has referrers, process referral rewards
    if (upgradeResult.newPosition) {
      const referralResult =
        await EnhancedReferralService.processThreeTierReferralRewards(
          user.id,
          upgradeResult.newPosition.name,
        );

      if (
        referralResult.success &&
        referralResult.totalRewardsDistributed > 0
      ) {
        console.log(
          `Referral rewards distributed for position upgrade: ${referralResult.totalRewardsDistributed} PKR`,
        );
      }

      // Send position upgrade notification
      try {
        await UserNotificationService.notifyPositionUpgrade(
          user.id,
          "Previous Position", // oldPosition not available in upgrade result
          upgradeResult.newPosition.name,
          0, // No bonus amount in this case
          [
            `${upgradeResult.newPosition.tasksPerDay} daily tasks`,
            `PKR ${upgradeResult.newPosition.unitPrice} per task`,
            `Level ${upgradeResult.newPosition.level} benefits`,
          ],
        );
        console.log(`Position upgrade notification sent to user ${user.id}`);
      } catch (notificationError) {
        console.error(
          "Failed to send position upgrade notification:",
          notificationError,
        );
      }

      return NextResponse.json({
        message: upgradeResult.message,
        newPosition: {
          id: upgradeResult.newPosition.id,
          name: upgradeResult.newPosition.name,
          level: upgradeResult.newPosition.level,
          deposit: upgradeResult.newPosition.deposit,
          tasksPerDay: upgradeResult.newPosition.tasksPerDay,
          unitPrice: upgradeResult.newPosition.unitPrice,
        },
        referralRewards: {
          totalDistributed: referralResult.totalRewardsDistributed,
          breakdown: referralResult.rewardsBreakdown,
        },
      });
    }

    return NextResponse.json({
      message: upgradeResult.message,
    });
  } catch (error) {
    console.error("Position upgrade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
