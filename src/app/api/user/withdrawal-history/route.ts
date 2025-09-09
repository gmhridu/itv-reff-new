import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate the user
    const user = await authMiddleware(request);
    if (!user) {
      response = NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
      return addAPISecurityHeaders(response);
    }

    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filter parameters
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build where clause
    const where: any = {
      userId: user.id
    };

    if (status && ["PENDING", "APPROVED", "REJECTED", "PROCESSED"].includes(status)) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Fetch withdrawal requests for the user
    const [withdrawalRequests, totalCount] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.withdrawalRequest.count({ where })
    ]);

    // Parse payment details for each request
    const processedRequests = withdrawalRequests.map(request => ({
      ...request,
      paymentDetails: typeof request.paymentDetails === 'string'
        ? JSON.parse(request.paymentDetails)
        : request.paymentDetails
    }));

    // Get statistics for the user
    const stats = await prisma.withdrawalRequest.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: {
        status: true
      },
      _sum: {
        amount: true
      }
    });

    const statistics = {
      total: totalCount,
      pending: stats.find(s => s.status === 'PENDING')?._count?.status || 0,
      approved: stats.find(s => s.status === 'APPROVED')?._count?.status || 0,
      rejected: stats.find(s => s.status === 'REJECTED')?._count?.status || 0,
      processed: stats.find(s => s.status === 'PROCESSED')?._count?.status || 0,
      totalAmount: stats.reduce((sum, s) => sum + (s._sum?.amount || 0), 0),
      pendingAmount: stats.find(s => s.status === 'PENDING')?._sum?.amount || 0
    };

    response = NextResponse.json({
      success: true,
      data: {
        withdrawalRequests: processedRequests,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        statistics
      }
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching withdrawal history:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return addAPISecurityHeaders(response);
  }
}
