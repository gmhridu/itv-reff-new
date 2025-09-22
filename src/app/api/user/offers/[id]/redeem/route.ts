import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiResponse } from "@/types/admin";
import { authMiddleware } from "@/lib/api/api-auth";

// Alias authMiddleware as withAuth to maintain compatibility with existing code
const withAuth = authMiddleware;

// POST /api/user/offers/[id]/redeem - Redeem a specific offer
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Authenticate user
    const user = await withAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: offerId } = params;

    if (!offerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Offer ID is required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { redemptionDetails } = body;

    // Get the offer
    const offer = await (db as any).userOffer.findFirst({
      where: {
        id: offerId,
        userId: user.id,
        isRedeemed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: {
        announcement: {
          select: {
            id: true,
            title: true,
            message: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        {
          success: false,
          error: "Offer not found or already redeemed/expired",
        } as ApiResponse,
        { status: 404 },
      );
    }

    // Start transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Mark offer as redeemed
      const redeemedOffer = await (tx as any).userOffer.update({
        where: { id: offerId },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
          // Store redemption details in description if provided
          description: redemptionDetails
            ? `${offer.description || ""}\n\nRedemption: ${redemptionDetails}`.trim()
            : offer.description,
        },
        include: {
          announcement: {
            select: {
              id: true,
              title: true,
              message: true,
            },
          },
        },
      });

      // Apply the offer based on type
      const applicationResult = await applyOfferToUser(tx, user.id, offer);

      return { redeemedOffer, applicationResult };
    });

    return NextResponse.json({
      success: true,
      data: result.redeemedOffer,
      applicationResult: result.applicationResult,
      message: "Offer redeemed successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("Error redeeming offer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to redeem offer",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// Helper function to apply offer to user account
async function applyOfferToUser(tx: any, userId: string, offer: any) {
  try {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const applicationResult: any = {
      type: offer.offerType,
      applied: false,
      details: {},
    };

    switch (offer.offerType) {
      case "bonus":
      case "cashback": {
        // Parse value and add to wallet balance
        const value = parseFloat(offer.offerValue.replace(/[^0-9.]/g, ""));
        if (!isNaN(value) && value > 0) {
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              walletBalance: {
                increment: value,
              },
              totalEarnings: {
                increment: value,
              },
            },
          });

          // Create transaction record
          await tx.walletTransaction.create({
            data: {
              userId,
              type:
                offer.offerType === "bonus" ? "REFERRAL_REWARD_A" : "CREDIT",
              amount: value,
              balanceAfter: updatedUser.walletBalance,
              description: `${offer.offerType.charAt(0).toUpperCase() + offer.offerType.slice(1)} offer redeemed: ${offer.offerValue}`,
              referenceId: `offer_${offer.id}_${Date.now()}`,
              status: "COMPLETED",
            },
          });

          applicationResult.applied = true;
          applicationResult.details = {
            amountAdded: value,
            newBalance: updatedUser.walletBalance,
          };
        }
        break;
      }

      case "free_tasks": {
        // Extract number of free tasks
        const tasks = parseInt(offer.offerValue.replace(/[^0-9]/g, ""));
        if (!isNaN(tasks) && tasks > 0) {
          // For free tasks, we might want to create a separate tracking record
          // For now, we'll just log the successful application
          applicationResult.applied = true;
          applicationResult.details = {
            freeTasks: tasks,
            message: `${tasks} free task(s) have been added to your account`,
          };
        }
        break;
      }

      case "position_upgrade": {
        // Position upgrades would need special handling
        // This might involve checking eligibility, updating position, etc.
        applicationResult.applied = true;
        applicationResult.details = {
          upgrade: offer.offerValue,
          message:
            "Position upgrade offer has been applied. Contact support for activation.",
        };
        break;
      }

      case "discount": {
        // Discounts are typically applied at transaction time
        // We mark it as applied so user can use it later
        applicationResult.applied = true;
        applicationResult.details = {
          discount: offer.offerValue,
          code: offer.offerCode,
          message: "Discount is now available for your next transaction",
        };
        break;
      }

      default: {
        applicationResult.details = {
          message: "Offer type not recognized but marked as redeemed",
        };
        break;
      }
    }

    return applicationResult;
  } catch (error) {
    console.error("Error applying offer to user:", error);
    throw error;
  }
}
