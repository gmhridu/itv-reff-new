import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { AdminMiddleware } from "@/lib/admin-middleware";
import { ApiResponse } from "@/types/admin";

// GET /api/admin/announcements/targets - Get available target options for announcements
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let targetOptions = {};

    if (type === "all" || type === "users") {
      // Get users for specific targeting
      const userWhere: any = {};
      if (search) {
        userWhere.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { id: { contains: search, mode: "insensitive" } },
        ];
      }

      const users = await prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          currentPositionId: true,
          isIntern: true,
          status: true,
          currentPosition: {
            select: {
              name: true,
              level: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        take: limit,
      });

      targetOptions = {
        ...targetOptions,
        users: users.map((user) => ({
          id: user.id,
          name: user.name || `User ${user.phone}`,
          email: user.email,
          phone: user.phone,
          position: user.isIntern
            ? "Intern"
            : user.currentPosition?.name || "No Position",
          level: user.currentPosition?.level || 0,
          status: user.status,
        })),
      };
    }

    if (type === "all" || type === "levels") {
      // Get position levels for level-based targeting
      const positionLevels = await prisma.positionLevel.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          level: true,
          deposit: true,
          tasksPerDay: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          level: "asc",
        },
      });

      targetOptions = {
        ...targetOptions,
        levels: positionLevels.map((level) => ({
          id: level.id,
          name: level.name,
          level: level.level,
          deposit: level.deposit,
          tasksPerDay: level.tasksPerDay,
          userCount: level._count.users,
        })),
      };
    }

    if (type === "all" || type === "stats") {
      // Get overall statistics
      const [totalUsers, activeUsers, inactiveUsers, internUsers] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { status: "ACTIVE" } }),
          prisma.user.count({ where: { status: { not: "ACTIVE" } } }),
          prisma.user.count({ where: { isIntern: true } }),
        ]);

      targetOptions = {
        ...targetOptions,
        stats: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          internUsers,
          paidUsers: totalUsers - internUsers,
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: targetOptions,
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching announcement targets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch announcement targets",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
