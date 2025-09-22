import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AdminMiddleware } from "@/lib/admin-middleware";
import { ApiResponse } from "@/types/admin";

// POST /api/admin/announcements/expire - Mark expired announcements as inactive
export async function POST(req: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const now = new Date();

    // Find all active announcements that have expired
    const expiredAnnouncements = await db.announcement.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        expiresAt: true,
      },
    });

    if (expiredAnnouncements.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          expiredCount: 0,
          message: "No expired announcements found",
        },
      } as ApiResponse);
    }

    // Update expired announcements to inactive
    const updateResult = await db.announcement.updateMany({
      where: {
        id: {
          in: expiredAnnouncements.map((a) => a.id),
        },
      },
      data: {
        isActive: false,
        updatedAt: now,
      },
    });

    // Log the expiry action
    const expiredTitles = expiredAnnouncements
      .map((a) => a.title)
      .join(", ");

    console.log(
      `Auto-expired ${updateResult.count} announcements: ${expiredTitles}`,
    );

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: updateResult.count,
        expiredAnnouncements: expiredAnnouncements.map((a) => ({
          id: a.id,
          title: a.title,
          expiredAt: a.expiresAt,
        })),
        message: `Successfully marked ${updateResult.count} expired announcements as inactive`,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error handling announcement expiry:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process expired announcements",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

// GET /api/admin/announcements/expire - Get expired announcements info
export async function GET(req: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await AdminMiddleware.authenticateAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const now = new Date();

    // Get announcements that are about to expire (next 24 hours)
    const soonToExpire = await db.announcement.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gte: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
      },
      select: {
        id: true,
        title: true,
        expiresAt: true,
        targetType: true,
        createdAt: true,
      },
      orderBy: {
        expiresAt: "asc",
      },
    });

    // Get already expired but still active announcements
    const expiredButActive = await db.announcement.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: now,
        },
      },
      select: {
        id: true,
        title: true,
        expiresAt: true,
        targetType: true,
        createdAt: true,
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    // Get recently expired announcements (last 7 days)
    const recentlyExpired = await db.announcement.findMany({
      where: {
        isActive: false,
        expiresAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          lt: now,
        },
      },
      select: {
        id: true,
        title: true,
        expiresAt: true,
        targetType: true,
        updatedAt: true,
      },
      orderBy: {
        expiresAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        soonToExpire: {
          count: soonToExpire.length,
          announcements: soonToExpire,
        },
        expiredButActive: {
          count: expiredButActive.length,
          announcements: expiredButActive,
        },
        recentlyExpired: {
          count: recentlyExpired.length,
          announcements: recentlyExpired,
        },
        summary: {
          needsAttention: expiredButActive.length,
          upcomingExpirations: soonToExpire.length,
          totalProcessed: recentlyExpired.length,
        },
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching expiry information:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch expiry information",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
