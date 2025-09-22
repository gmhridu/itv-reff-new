import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiResponse } from "@/types/admin";
import { authMiddleware } from "@/lib/api/api-auth";

// Alias authMiddleware as withAuth to maintain compatibility with existing code
const withAuth = authMiddleware;

// GET /api/user/offers - Get user's active offers
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const includeRedeemed = searchParams.get("includeRedeemed") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {
      userId: user.id,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    };

    if (!includeRedeemed) {
      where.isRedeemed = false;
    }

    // Get user's offers
    const [offers, totalCount] = await Promise.all([
      (db as any).userOffer.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
        include: {
          announcement: {
            select: {
              id: true,
              title: true,
              message: true,
              imageUrl: true,
            },
          },
        },
      }),
      (db as any).userOffer.count({ where }),
    ]);

    // Get counts by status
    const [activeCount, redeemedCount, expiredCount] = await Promise.all([
      (db as any).userOffer.count({
        where: {
          userId: user.id,
          isRedeemed: false,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      }),
      (db as any).userOffer.count({
        where: {
          userId: user.id,
          isRedeemed: true,
        },
      }),
      (db as any).userOffer.count({
        where: {
          userId: user.id,
          isRedeemed: false,
          expiresAt: { lt: new Date() },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        offers,
        totalCount,
        stats: {
          active: activeCount,
          redeemed: redeemedCount,
          expired: expiredCount,
        },
        pagination: {
          limit,
          offset,
          hasMore: totalCount > offset + limit,
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching user offers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch offers",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// POST /api/user/offers/[id]/redeem - Redeem an offer
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { offerId, redemptionDetails } = body;

    if (!offerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Offer ID is required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Get the offer
    const offer = await (db as any).userOffer.findFirst({
      where: {
        id: offerId,
        userId: user.id,
        isRedeemed: false,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
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

    // Mark offer as redeemed
    const redeemedOffer = await (db as any).userOffer.update({
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
    await applyOfferToUser(user.id, offer);

    return NextResponse.json({
      success: true,
      data: redeemedOffer,
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
async function applyOfferToUser(userId: string, offer: any) {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return;

    switch (offer.offerType) {
      case "bonus":
      case "cashback":
        // Parse value and add to wallet balance
        const value = parseFloat(offer.offerValue.replace(/[^0-9.]/g, ""));
        if (!isNaN(value)) {
          await db.user.update({
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
          await db.walletTransaction.create({
            data: {
              userId,
              type:
                offer.offerType === "bonus" ? "REFERRAL_REWARD_A" : "CREDIT",
              amount: value,
              balanceAfter: user.walletBalance + value,
              description: `${offer.offerType} offer redeemed: ${offer.offerValue}`,
              referenceId: `offer_${offer.id}_${Date.now()}`,
              status: "COMPLETED",
            },
          });
        }
        break;

      case "free_tasks":
        // This would be handled by the task system
        // For now, we just log it
        console.log(
          `Free tasks offer applied to user ${userId}: ${offer.offerValue}`,
        );
        break;

      case "position_upgrade":
        // This would be handled by the position management system
        console.log(
          `Position upgrade offer applied to user ${userId}: ${offer.offerValue}`,
        );
        break;

      case "discount":
        // Discounts are typically applied at checkout/transaction time
        // For now, we just mark it as applied
        console.log(
          `Discount offer applied to user ${userId}: ${offer.offerValue}`,
        );
        break;
    }
  } catch (error) {
    console.error("Error applying offer to user:", error);
  }
}
