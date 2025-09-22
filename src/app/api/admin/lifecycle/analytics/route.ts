import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { userLifecycleAnalyticsService } from "@/lib/user-lifecycle";
import { UserLifecycleEvent, UserSegment } from "@/lib/user-lifecycle/types";

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse date range parameters
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    // Default to last 30 days if no dates provided
    const dateTo = dateToParam ? new Date(dateToParam) : new Date();
    const dateFrom = dateFromParam
      ? new Date(dateFromParam)
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parse groupBy parameter (day, week, month)
    const groupBy = searchParams.get("groupBy") || "day";

    // Parse comparison flag
    const compareWithPrevious =
      searchParams.get("compareWithPrevious") === "true";

    // Parse segments filter
    const segmentsParam = searchParams.get("segments");
    const segments = segmentsParam
      ? (segmentsParam
          .split(",")
          .filter((segment) =>
            Object.values(UserSegment).includes(segment as UserSegment),
          ) as UserSegment[])
      : undefined;

    // Parse cohorts filter
    const cohortsParam = searchParams.get("cohorts");
    const cohorts = cohortsParam ? cohortsParam.split(",") : undefined;

    // Get analytics type from query parameter
    const analyticsType = searchParams.get("type") || "dashboard";

    let result;

    switch (analyticsType) {
      case "dashboard":
        result = await userLifecycleAnalyticsService.getDashboardMetrics({
          dateFrom,
          dateTo,
          segments,
          cohorts,
          compareWithPrevious,
          groupBy: groupBy as "day" | "week" | "month",
        });
        break;

      case "heatmap":
        const eventTypesParam = searchParams.get("eventTypes");
        const eventTypes = eventTypesParam
          ? (eventTypesParam
              .split(",")
              .filter((event) =>
                Object.values(UserLifecycleEvent).includes(
                  event as UserLifecycleEvent,
                ),
              ) as UserLifecycleEvent[])
          : undefined;

        result = await userLifecycleAnalyticsService.getUserActivityHeatmap(
          dateFrom,
          dateTo,
          eventTypes,
        );
        break;

      case "journey":
        result = await userLifecycleAnalyticsService.analyzeUserJourneyFlow(
          dateFrom,
          dateTo,
        );
        break;

      case "cohort":
        const cohortPeriod =
          (searchParams.get("cohortPeriod") as "weekly" | "monthly") ||
          "monthly";
        result = await userLifecycleAnalyticsService.analyzeCohortRetention(
          dateFrom,
          dateTo,
          cohortPeriod,
        );
        break;

      case "insights":
        result = await userLifecycleAnalyticsService.generateInsights(
          dateFrom,
          dateTo,
        );
        break;

      case "segments":
        result = await userLifecycleAnalyticsService.getSegmentAnalysis(
          dateFrom,
          dateTo,
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown analytics type: ${analyticsType}` },
          { status: 400 },
        );
    }

    console.log("Lifecycle analytics API: Successfully fetched data", {
      analyticsType,
      dateRange: { from: dateFrom, to: dateTo },
      groupBy,
      compareWithPrevious,
      segmentsCount: segments?.length || 0,
      cohortsCount: cohorts?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        analyticsType,
        dateRange: { from: dateFrom, to: dateTo },
        groupBy,
        compareWithPrevious,
        segments,
        cohorts,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Lifecycle analytics API error:", error);

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

// POST endpoint for complex analytics queries
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { analyticsType, dateFrom, dateTo, filters, options } = body;

    if (!analyticsType || !dateFrom || !dateTo) {
      return NextResponse.json(
        {
          error: "Missing required parameters: analyticsType, dateFrom, dateTo",
        },
        { status: 400 },
      );
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    let result;

    switch (analyticsType) {
      case "custom_funnel":
        // Custom funnel analysis with specific stages
        const { stages, includeDropoffs } = options || {};

        if (!stages || !Array.isArray(stages)) {
          return NextResponse.json(
            { error: "Stages array is required for funnel analysis" },
            { status: 400 },
          );
        }

        // This would be implemented to analyze specific stage sequences
        result = {
          funnelStages: stages,
          conversionRates: [],
          dropoffPoints: includeDropoffs ? [] : undefined,
          totalUsers: 0,
        };
        break;

      case "segment_comparison":
        // Compare multiple segments
        const { compareSegments, metrics } = options || {};

        if (!compareSegments || !Array.isArray(compareSegments)) {
          return NextResponse.json(
            { error: "Segments array is required for comparison" },
            { status: 400 },
          );
        }

        result = await userLifecycleAnalyticsService.getSegmentAnalysis(
          fromDate,
          toDate,
        );
        break;

      case "predictive_analytics":
        // Churn and LTV predictions
        const { userIds, predictionType } = options || {};

        if (!userIds || !Array.isArray(userIds)) {
          return NextResponse.json(
            { error: "User IDs array is required for predictions" },
            { status: 400 },
          );
        }

        // This would implement predictive analytics
        result = {
          predictionType,
          predictions: [],
          accuracy: 0.85,
          confidence: 0.75,
        };
        break;

      case "retention_analysis":
        // Deep retention analysis
        const { cohortPeriod, retentionDays } = options || {};

        result = await userLifecycleAnalyticsService.analyzeCohortRetention(
          fromDate,
          toDate,
          cohortPeriod || "monthly",
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown analytics type: ${analyticsType}` },
          { status: 400 },
        );
    }

    console.log("Custom lifecycle analytics:", {
      analyticsType,
      dateRange: { from: fromDate, to: toDate },
      filtersApplied: Object.keys(filters || {}).length,
      optionsProvided: Object.keys(options || {}).length,
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        analyticsType,
        dateRange: { from: fromDate, to: toDate },
        filters,
        options,
        generatedAt: new Date(),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Custom lifecycle analytics API error:", error);

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
