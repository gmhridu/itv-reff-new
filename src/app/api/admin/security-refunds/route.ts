import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/security-refunds - Fetch security refunds with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    if (search) {
      whereClause.OR = [
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
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            phone: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    try {
      // Get security refunds using dynamic table access
      const securityRefunds = await (
        db as any
      ).securityRefundRequest.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      });

      const totalCount = await (db as any).securityRefundRequest.count({
        where: whereClause,
      });

      const totalPages = Math.ceil(totalCount / limit);

      // Get statistics
      const stats = {
        total: await (db as any).securityRefundRequest.count(),
        pending: await (db as any).securityRefundRequest.count({
          where: { status: "PENDING" },
        }),
        approved: await (db as any).securityRefundRequest.count({
          where: { status: "APPROVED" },
        }),
        rejected: await (db as any).securityRefundRequest.count({
          where: { status: "REJECTED" },
        }),
      };

      // Format the refunds
      const formattedRefunds = securityRefunds.map((refund: any) => ({
        id: refund.id,
        userId: refund.userId,
        userName: refund.user.name,
        userEmail: refund.user.email,
        userPhone: refund.user.phone,
        amount: refund.refundAmount,
        reason: `Level downgrade refund (${refund.fromLevel} → ${refund.toLevel})`,
        description:
          refund.requestNote || "Security refund request for level downgrade",
        status: refund.status,
        securityType: "LEVEL_DOWNGRADE",
        evidence: [],
        createdAt: refund.createdAt.toISOString(),
        updatedAt: refund.updatedAt.toISOString(),
        processedBy: null,
        processedAt: refund.processedAt?.toISOString(),
        refundMethod: "WALLET",
        originalTransactionId: null,
        adminNotes: refund.adminNotes,
        fromLevel: refund.fromLevel,
        toLevel: refund.toLevel,
      }));

      return NextResponse.json({
        success: true,
        data: {
          securityRefunds: formattedRefunds,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
          stats,
        },
      });
    } catch (error) {
      // If SecurityRefundRequest table doesn't exist, return empty data
      console.warn("SecurityRefundRequest table not available:", error);

      return NextResponse.json({
        success: true,
        data: {
          securityRefunds: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            limit,
            hasNext: false,
            hasPrev: false,
          },
          stats: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
          },
        },
      });
    }
  } catch (error) {
    console.error("Error fetching security refunds:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/security-refunds - Create new security refund request
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const {
      userId,
      amount,
      reason,
      description,
      securityType,
      evidence,
      refundMethod = "WALLET",
    } = await request.json();

    // Validate required fields
    if (!userId || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    try {
      // Create security refund request
      const securityRefund = await (db as any).securityRefundRequest.create(
        {
          data: {
            userId,
            fromLevel: 1, // Default level
            toLevel: 1, // Default level
            refundAmount: amount,
            status: "PENDING",
            requestNote: description || reason,
            adminNotes: `Created by admin: ${session.user.name}`,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      );

      return NextResponse.json({
        success: true,
        data: {
          securityRefund: {
            id: securityRefund.id,
            userId: securityRefund.userId,
            userName: securityRefund.user.name,
            userEmail: securityRefund.user.email,
            userPhone: securityRefund.user.phone,
            amount: securityRefund.refundAmount,
            reason,
            description: description || reason,
            status: securityRefund.status,
            securityType: securityType || "MANUAL",
            evidence: evidence || [],
            createdAt: securityRefund.createdAt.toISOString(),
            updatedAt: securityRefund.updatedAt.toISOString(),
            refundMethod,
            adminNotes: securityRefund.adminNotes,
            fromLevel: securityRefund.fromLevel,
            toLevel: securityRefund.toLevel,
          },
        },
        message: "Security refund request created successfully",
      });
    } catch (error) {
      console.error("Error creating security refund request:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            "SecurityRefundRequest table not available. Please ensure database migration is complete.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error processing security refund request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

