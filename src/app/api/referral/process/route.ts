import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { ReferralService } from "@/lib/referral-service";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";

interface MissingInviteCommission {
  referralId: string;
  referralName: string;
  planAmount: number;
  subscribedAt: Date;
}

interface MissingTaskCommission {
  referralId: string;
  referralName: string;
  totalTaskEarnings: number;
  taskCount: number;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin or system access
    const user = await authMiddleware(request);
    if (!user) {
      const response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const { action, userId, amount } = body;

    if (!action || !userId) {
      const response = NextResponse.json(
        { error: "Action and userId are required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    let result: any = {};

    switch (action) {
      case "process_invite_commission":
        if (!amount) {
          const response = NextResponse.json(
            { error: "Amount is required for invite commission" },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        result = await ReferralService.processReferralQualification(
          userId,
          amount,
        );
        break;

      case "process_task_commission":
        if (!amount) {
          const response = NextResponse.json(
            { error: "Amount is required for task commission" },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        result = await ReferralService.processReferralTaskCommission(
          userId,
          amount,
        );
        break;

      case "register_referral":
        const { referralCode, ipAddress } = body;
        if (!referralCode) {
          const response = NextResponse.json(
            { error: "Referral code is required for registration" },
            { status: 400 },
          );
          return addAPISecurityHeaders(response);
        }

        result = await ReferralService.processReferralRegistration(
          referralCode,
          userId,
          ipAddress || "system",
        );
        break;

      case "rebuild_hierarchy":
        // Find user's referrer and rebuild hierarchy
        const userWithReferrer = await db.user.findUnique({
          where: { id: userId },
          select: { referredBy: true },
        });

        if (userWithReferrer?.referredBy) {
          try {
            // Build referral hierarchy manually since buildReferralHierarchy is private
            // First, clean existing hierarchy
            await db.referralHierarchy.deleteMany({
              where: { userId: userId },
            });

            // Level A - Direct referrer
            await db.referralHierarchy.create({
              data: {
                userId: userId,
                referrerId: userWithReferrer.referredBy,
                level: "A_LEVEL",
              },
            });

            // Find Level B - Direct referrer's referrer
            const levelBReferrer = await db.user.findUnique({
              where: { id: userWithReferrer.referredBy },
              select: { referredBy: true },
            });

            if (levelBReferrer?.referredBy) {
              await db.referralHierarchy.create({
                data: {
                  userId: userId,
                  referrerId: levelBReferrer.referredBy,
                  level: "B_LEVEL",
                },
              });

              // Find Level C - Level B referrer's referrer
              const levelCReferrer = await db.user.findUnique({
                where: { id: levelBReferrer.referredBy },
                select: { referredBy: true },
              });

              if (levelCReferrer?.referredBy) {
                await db.referralHierarchy.create({
                  data: {
                    userId: userId,
                    referrerId: levelCReferrer.referredBy,
                    level: "C_LEVEL",
                  },
                });
              }
            }

            result = {
              success: true,
              message: "Hierarchy rebuilt successfully",
            };
          } catch (error) {
            console.error("Error rebuilding hierarchy:", error);
            result = { success: false, message: "Failed to rebuild hierarchy" };
          }
        } else {
          result = { success: false, message: "User has no referrer" };
        }
        break;

      default:
        const response = NextResponse.json(
          { error: "Invalid action" },
          { status: 400 },
        );
        return addAPISecurityHeaders(response);
    }

    const response = NextResponse.json({
      success: result.success || false,
      data: result,
      message: `${action} processed successfully`,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Process referral commission error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// GET endpoint to check referral status and missing commissions
export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);
    if (!user) {
      const response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || user.id;

    // Check if user has referrals that haven't been properly processed
    const userReferrals = await db.user.findMany({
      where: { referredBy: targetUserId },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    // Get user plans data
    const userPlansMap = new Map<
      string,
      Array<{
        id: string;
        amountPaid: number;
        status: string;
        createdAt: Date;
      }>
    >();

    for (const referral of userReferrals) {
      const plans = await db.userPlan.findMany({
        where: {
          userId: referral.id,
          status: "ACTIVE",
        },
        select: {
          id: true,
          amountPaid: true,
          status: true,
          createdAt: true,
        },
      });
      userPlansMap.set(referral.id, plans);
    }

    // Get user video tasks data
    const userTasksMap = new Map<
      string,
      Array<{
        rewardEarned: number;
        watchedAt: Date;
      }>
    >();

    for (const referral of userReferrals) {
      const tasks = await db.userVideoTask.findMany({
        where: {
          userId: referral.id,
          watchedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: {
          rewardEarned: true,
          watchedAt: true,
        },
      });
      userTasksMap.set(referral.id, tasks);
    }

    // Check referral activities
    const referralActivities = await db.referralActivity.findMany({
      where: { referrerId: targetUserId },
      select: {
        id: true,
        referredUserId: true,
        status: true,
        createdAt: true,
      },
    });

    // Check existing commission transactions
    const existingCommissions = await db.walletTransaction.findMany({
      where: {
        userId: targetUserId,
        type: {
          in: [
            "REFERRAL_REWARD_A",
            "REFERRAL_REWARD_B",
            "REFERRAL_REWARD_C",
            "MANAGEMENT_BONUS_A",
            "MANAGEMENT_BONUS_B",
            "MANAGEMENT_BONUS_C",
          ],
        },
      },
      select: {
        type: true,
        amount: true,
        createdAt: true,
        metadata: true,
      },
    });

    // Identify missing commissions
    const missingInviteCommissions: MissingInviteCommission[] = [];
    const missingTaskCommissions: MissingTaskCommission[] = [];

    for (const referral of userReferrals) {
      const userPlans = userPlansMap.get(referral.id) || [];
      const userTasks = userTasksMap.get(referral.id) || [];

      if (userPlans.length > 0) {
        // Check if invite commission was paid
        const hasInviteCommission = existingCommissions.some((commission) => {
          try {
            if (commission.metadata) {
              const metadata = JSON.parse(commission.metadata as string);
              return metadata.referredUserId === referral.id;
            }
            return false;
          } catch {
            return false;
          }
        });

        if (!hasInviteCommission) {
          missingInviteCommissions.push({
            referralId: referral.id,
            referralName: referral.name || referral.phone || "Unknown",
            planAmount: userPlans[0].amountPaid,
            subscribedAt: userPlans[0].createdAt,
          });
        }
      }

      // Check for task commissions
      const totalTaskEarnings = userTasks.reduce(
        (sum, task) => sum + task.rewardEarned,
        0,
      );

      if (totalTaskEarnings > 0) {
        const hasTaskCommissions = existingCommissions.some((commission) => {
          try {
            if (
              commission.metadata &&
              commission.type.includes("MANAGEMENT_BONUS")
            ) {
              const metadata = JSON.parse(commission.metadata as string);
              return metadata.referredUserId === referral.id;
            }
            return false;
          } catch {
            return false;
          }
        });

        if (!hasTaskCommissions) {
          missingTaskCommissions.push({
            referralId: referral.id,
            referralName: referral.name || referral.phone || "Unknown",
            totalTaskEarnings,
            taskCount: userTasks.length,
          });
        }
      }
    }

    const activePlansCount = Array.from(userPlansMap.values()).filter(
      (plans) => plans.length > 0,
    ).length;

    const response = NextResponse.json({
      success: true,
      data: {
        totalReferrals: userReferrals.length,
        activePlans: activePlansCount,
        referralActivities: referralActivities.length,
        existingCommissions: existingCommissions.length,
        missingInviteCommissions,
        missingTaskCommissions,
        summary: {
          inviteCommissionsDue: missingInviteCommissions.length,
          taskCommissionsDue: missingTaskCommissions.length,
          totalCommissionsPaid: existingCommissions.reduce(
            (sum, c) => sum + c.amount,
            0,
          ),
        },
      },
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Get referral status error:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
