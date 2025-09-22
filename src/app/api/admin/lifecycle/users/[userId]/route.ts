import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { userLifecycleService } from "@/lib/user-lifecycle";
import {
  UserLifecycleEvent,
  UserLifecycleStage,
  EventSource,
} from "@/lib/user-lifecycle/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get comprehensive lifecycle data for the user
    const lifecycleData =
      await userLifecycleService.getUserLifecycleData(userId);

    if (!lifecycleData) {
      return NextResponse.json(
        { error: "User not found or no lifecycle data available" },
        { status: 404 },
      );
    }

    console.log("User lifecycle data API: Successfully fetched data", {
      userId,
      currentStage: lifecycleData.currentStage,
      segment: lifecycleData.segment,
      engagementScore: lifecycleData.engagementScore,
      riskScore: lifecycleData.riskScore,
    });

    return NextResponse.json({
      success: true,
      data: lifecycleData,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("User lifecycle data API error:", error);

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

// PATCH endpoint for updating user lifecycle data
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    let result;

    switch (action) {
      case "forceStageTransition":
        const { toStage, reason } = data;

        if (!toStage || !reason) {
          return NextResponse.json(
            { error: "Missing required data: toStage, reason" },
            { status: 400 },
          );
        }

        if (!Object.values(UserLifecycleStage).includes(toStage)) {
          return NextResponse.json(
            { error: "Invalid stage provided" },
            { status: 400 },
          );
        }

        result = await userLifecycleService.forceStageTransition(
          userId,
          toStage,
          reason,
          session.user?.id,
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        console.log("Forced stage transition:", {
          userId,
          toStage,
          reason,
          adminId: session.user?.id,
        });

        break;

      case "trackEvent":
        const { event, eventData, source } = data;

        if (!event) {
          return NextResponse.json(
            { error: "Event is required" },
            { status: 400 },
          );
        }

        if (!Object.values(UserLifecycleEvent).includes(event)) {
          return NextResponse.json(
            { error: "Invalid event type provided" },
            { status: 400 },
          );
        }

        const eventSource =
          source && Object.values(EventSource).includes(source)
            ? source
            : EventSource.ADMIN_ACTION;

        result = await userLifecycleService.trackLifecycleEvent(
          userId,
          event,
          eventData || {},
          eventSource,
          {
            adminId: session.user?.id,
            ipAddress: request.headers.get("x-forwarded-for") || undefined,
            userAgent: request.headers.get("user-agent") || undefined,
          },
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        console.log("Tracked lifecycle event:", {
          userId,
          event,
          source: eventSource,
          adminId: session.user?.id,
        });

        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data: result?.data || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("User lifecycle update API error:", error);

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
