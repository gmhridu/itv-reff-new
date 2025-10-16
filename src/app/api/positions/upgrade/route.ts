import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { PositionService } from "@/lib/position-service";
import { ReferralService } from "@/lib/referral-service";
import { UserNotificationService } from "@/lib/user-notification-service";

export async function POST(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetPositionId, depositAmount } = body;

    if (!targetPositionId || !depositAmount) {
      return NextResponse.json(
        { error: "Target position ID and deposit amount are required" },
        { status: 400 }
      );
    }

    // Attempt position upgrade
    const upgradeResult = await PositionService.upgradePosition(
      user.id,
      targetPositionId,
      depositAmount
    );

    if (!upgradeResult.success) {
      return NextResponse.json(
        { error: upgradeResult.message },
        { status: 400 }
      );
    }

    // If upgrade successful and user has referrers, process referral rewards
    if (upgradeResult.newPosition) {
      const referralResult = await ReferralService.processReferralQualification(
        user.id,
        upgradeResult.newPosition.name
      );

      if (referralResult.success && referralResult.rewards) {
        console.log(
          `Position upgrade commissions distributed: ${referralResult.rewards.reduce((sum, r) => sum + r.amount, 0)} PKR`
        );
      } else if (referralResult.reason) {
        console.log(
          `Position upgrade commissions not processed: ${referralResult.reason}`
        );
      }

      // Send position upgrade notification
      try {
        await UserNotificationService.notifyPositionUpgrade(
          user.id,
          upgradeResult.newPosition.name,
          0,
          [
            `${upgradeResult.newPosition.tasksPerDay} daily tasks`,
            `PKR ${upgradeResult.newPosition.unitPrice} per task`,
            `Level ${upgradeResult.newPosition.level} benefits`,
          ]
        );
        console.log(`Position upgrade notification sent to user ${user.id}`);
      } catch (notificationError) {
        console.error(
          "Failed to send position upgrade notification:",
          notificationError
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
          totalDistributed:
            referralResult.rewards?.reduce((sum, r) => sum + r.amount, 0) || 0,
          breakdown: referralResult.rewards || [],
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
      { status: 500 }
    );
  }
}
