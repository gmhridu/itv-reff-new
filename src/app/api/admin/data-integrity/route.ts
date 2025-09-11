import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  checkTopupDataIntegrity,
  fixOrphanedTopupRequests,
  generateDataHealthReport,
  verifyUserSessionData,
} from "@/lib/utils/data-integrity";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "check";
    const userId = searchParams.get("userId");

    console.log(`Admin ${session.user.id} requested data integrity ${action}`);

    switch (action) {
      case "check":
        const integrityReport = await checkTopupDataIntegrity();
        return NextResponse.json({
          success: true,
          data: integrityReport,
          message: "Data integrity check completed",
        });

      case "health-report":
        const healthReport = await generateDataHealthReport();
        return NextResponse.json({
          success: true,
          data: healthReport,
          message: "Data health report generated",
        });

      case "verify-user":
        if (!userId) {
          return NextResponse.json(
            { success: false, error: "User ID is required for verification" },
            { status: 400 },
          );
        }
        const userVerification = await verifyUserSessionData(userId);
        return NextResponse.json({
          success: true,
          data: userVerification,
          message: "User verification completed",
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in data integrity check:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (!session?.user?.role || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Super admin access required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action, dryRun = true } = body;

    console.log(`Super admin ${session.user.id} requested ${action} (dryRun: ${dryRun})`);

    switch (action) {
      case "fix-orphaned":
        const result = await fixOrphanedTopupRequests(dryRun);
        return NextResponse.json({
          success: true,
          data: result,
          message: dryRun
            ? "Dry run completed - no changes made"
            : `Fixed ${result.fixedCount} orphaned requests`,
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in data integrity fix:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
