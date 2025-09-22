import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { userLifecycleService } from "@/lib/user-lifecycle";
import {
  UserLifecycleFilters,
  UserLifecycleStage,
  UserSegment,
  UserJourneyPhase,
} from "@/lib/user-lifecycle/types";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Parse filter parameters
    const filters: UserLifecycleFilters = {};

    // Stage filters
    const stages = searchParams.get("stages");
    if (stages) {
      filters.stages = stages
        .split(",")
        .filter((stage) =>
          Object.values(UserLifecycleStage).includes(
            stage as UserLifecycleStage,
          ),
        ) as UserLifecycleStage[];
    }

    // Segment filters
    const segments = searchParams.get("segments");
    if (segments) {
      filters.segments = segments
        .split(",")
        .filter((segment) =>
          Object.values(UserSegment).includes(segment as UserSegment),
        ) as UserSegment[];
    }

    // Journey phase filters
    const journeyPhases = searchParams.get("journeyPhases");
    if (journeyPhases) {
      filters.journeyPhases = journeyPhases
        .split(",")
        .filter((phase) =>
          Object.values(UserJourneyPhase).includes(phase as UserJourneyPhase),
        ) as UserJourneyPhase[];
    }

    // Date filters
    const registrationDateFrom = searchParams.get("registrationDateFrom");
    if (registrationDateFrom) {
      filters.registrationDateFrom = new Date(registrationDateFrom);
    }

    const registrationDateTo = searchParams.get("registrationDateTo");
    if (registrationDateTo) {
      filters.registrationDateTo = new Date(registrationDateTo);
    }

    const lastActivityFrom = searchParams.get("lastActivityFrom");
    if (lastActivityFrom) {
      filters.lastActivityFrom = new Date(lastActivityFrom);
    }

    const lastActivityTo = searchParams.get("lastActivityTo");
    if (lastActivityTo) {
      filters.lastActivityTo = new Date(lastActivityTo);
    }

    // Score filters
    const engagementScoreMin = searchParams.get("engagementScoreMin");
    if (engagementScoreMin) {
      filters.engagementScoreMin = parseInt(engagementScoreMin);
    }

    const engagementScoreMax = searchParams.get("engagementScoreMax");
    if (engagementScoreMax) {
      filters.engagementScoreMax = parseInt(engagementScoreMax);
    }

    const riskScoreMin = searchParams.get("riskScoreMin");
    if (riskScoreMin) {
      filters.riskScoreMin = parseInt(riskScoreMin);
    }

    const riskScoreMax = searchParams.get("riskScoreMax");
    if (riskScoreMax) {
      filters.riskScoreMax = parseInt(riskScoreMax);
    }

    // Lifetime value filters
    const lifetimeValueMin = searchParams.get("lifetimeValueMin");
    if (lifetimeValueMin) {
      filters.lifetimeValueMin = parseFloat(lifetimeValueMin);
    }

    const lifetimeValueMax = searchParams.get("lifetimeValueMax");
    if (lifetimeValueMax) {
      filters.lifetimeValueMax = parseFloat(lifetimeValueMax);
    }

    // Boolean filters
    const hasReferrals = searchParams.get("hasReferrals");
    if (hasReferrals) {
      filters.hasReferrals = hasReferrals === "true";
    }

    // Position level filters
    const positionLevels = searchParams.get("positionLevels");
    if (positionLevels) {
      filters.positionLevels = positionLevels.split(",");
    }

    // Search term
    const searchTerm = searchParams.get("searchTerm");
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }

    // Get lifecycle data
    const result = await userLifecycleService.getUsersLifecycleData(filters, {
      page,
      limit,
    });

    console.log("Lifecycle users API: Successfully fetched data", {
      totalUsers: result.pagination.total,
      page,
      limit,
      filtersApplied: Object.keys(filters).length,
    });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Lifecycle users API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}

// POST endpoint for bulk operations
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, userIds, data } = body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: "Invalid request body. Required: action, userIds" },
        { status: 400 },
      );
    }

    let results: Array<{
      userId: string;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];

    switch (action) {
      case "forceStageTransition":
        if (!data?.toStage || !data?.reason) {
          return NextResponse.json(
            { error: "Missing required data: toStage, reason" },
            { status: 400 },
          );
        }

        for (const userId of userIds) {
          try {
            const result = await userLifecycleService.forceStageTransition(
              userId,
              data.toStage,
              data.reason,
              session.user?.id || undefined,
            );
            results.push({
              userId,
              success: result.success,
              data: result.data,
            });
          } catch (error) {
            results.push({
              userId,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
        break;

      case "trackEvent":
        if (!data?.event) {
          return NextResponse.json(
            { error: "Missing required data: event" },
            { status: 400 },
          );
        }

        for (const userId of userIds) {
          try {
            const result = await userLifecycleService.trackLifecycleEvent(
              userId,
              data.event,
              data.eventData || {},
              data.source || "ADMIN_ACTION",
              {
                adminId: session.user?.id || undefined,
                ipAddress: request.headers.get("x-forwarded-for") || undefined,
                userAgent: request.headers.get("user-agent") || undefined,
              },
            );
            results.push({ userId, success: result.success });
          } catch (error) {
            results.push({
              userId,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }

    console.log("Lifecycle users bulk operation:", {
      action,
      userCount: userIds.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    });

    return NextResponse.json({
      success: true,
      data: {
        action,
        results,
        summary: {
          total: userIds.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Lifecycle users bulk operation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}
