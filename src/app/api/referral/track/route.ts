import { NextRequest, NextResponse } from "next/server";
import { ReferralService } from "@/lib/referral-service";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    const body = await request.json();
    const { referralCode, source = "link" } = body;

    if (!referralCode) {
      response = NextResponse.json(
        { success: false, error: "Referral code is required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get client information
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Track the referral visit
    const result = await ReferralService.trackReferralVisit({
      referralCode,
      ipAddress,
      userAgent,
      source,
      metadata: {
        timestamp: new Date().toISOString(),
        referer: request.headers.get("referer"),
      },
    });

    if (result.success) {
      response = NextResponse.json({
        success: true,
        message: "Referral tracked successfully",
        activityId: result.activityId,
      });
    } else {
      response = NextResponse.json(
        { success: false, error: "Invalid referral code" },
        { status: 404 },
      );
    }

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Referral tracking error:", error);
    response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
