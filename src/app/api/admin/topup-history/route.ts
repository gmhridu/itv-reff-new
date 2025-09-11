import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      console.error("Admin topup-history access denied", {
        hasSession: !!session,
        userId: session?.user?.id,
        userRole: session?.user?.role,
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 },
      );
    }

    console.log("Admin topup-history request from:", {
      adminId: session.user.id,
      adminRole: session.user.role,
      adminName: session.user.name,
    });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const walletId = searchParams.get("walletId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (walletId && walletId !== "ALL") {
      where.selectedWalletId = walletId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Search functionality
    if (search) {
      where.OR = [
        {
          id: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          transactionId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            phone: {
              contains: search,
            },
          },
        },
        {
          amount: {
            equals: parseFloat(search) || 0,
          },
        },
      ];
    }

    console.log("Fetching topup requests with filters:", {
      where,
      page,
      limit,
      skip,
    });

    // Get topup requests with pagination
    const [topupRequests, total] = await Promise.all([
      prisma.topupRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              referralCode: true,
            },
          },
          selectedWallet: {
            select: {
              id: true,
              walletType: true,
              walletNumber: true,
              walletHolderName: true,
            },
          },
        },
      }),
      prisma.topupRequest.count({ where }),
    ]);

    console.log("Topup requests fetched:", {
      totalFound: total,
      requestsInPage: topupRequests.length,
      firstRequestUserId: topupRequests[0]?.userId,
      firstRequestUserName: topupRequests[0]?.user?.name,
      firstRequestUserPhone: topupRequests[0]?.user?.phone,
    });

    // Get statistics
    const [
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalAmount,
      pendingAmount,
      approvedAmount,
    ] = await Promise.all([
      prisma.topupRequest.count(),
      prisma.topupRequest.count({ where: { status: "PENDING" } }),
      prisma.topupRequest.count({ where: { status: "APPROVED" } }),
      prisma.topupRequest.count({ where: { status: "REJECTED" } }),
      prisma.topupRequest
        .aggregate({
          _sum: { amount: true },
        })
        .then((result) => result._sum.amount || 0),
      prisma.topupRequest
        .aggregate({
          _sum: { amount: true },
          where: { status: "PENDING" },
        })
        .then((result) => result._sum.amount || 0),
      prisma.topupRequest
        .aggregate({
          _sum: { amount: true },
          where: { status: "APPROVED" },
        })
        .then((result) => result._sum.amount || 0),
    ]);

    // Verify data integrity
    const requestsWithIssues = topupRequests.filter((req) => !req.user);
    if (requestsWithIssues.length > 0) {
      console.error("Found topup requests with missing user data:", {
        requestIds: requestsWithIssues.map((r) => r.id),
        userIds: requestsWithIssues.map((r) => r.userId),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        topupRequests: topupRequests.map((request) => ({
          ...request,
          // Ensure user data is present
          user: request.user || {
            id: request.userId,
            name: "Unknown User",
            phone: "N/A",
            email: "N/A",
            referralCode: "N/A",
          },
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        statistics: {
          total: totalCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          totalAmount: totalAmount,
          pendingAmount: pendingAmount,
          approvedAmount: approvedAmount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching topup history:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
