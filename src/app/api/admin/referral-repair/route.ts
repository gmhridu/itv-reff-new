import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { ReferralRepairService } from "@/lib/referral-repair-service";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getAdminSession();
    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      const response = NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const { action, userId } = body;

    let result;

    switch (action) {
      case "repair_all":
        console.log(`🔧 Admin ${session.user.id} initiated full referral system repair`);
        result = await ReferralRepairService.repairAllReferralCommissions();
        break;

      case "repair_user":
        if (!userId) {
          const response = NextResponse.json(
            { success: false, error: "userId is required for user repair" },
            { status: 400 }
          );
          return addAPISecurityHeaders(response);
        }
        console.log(`🔧 Admin ${session.user.id} initiated repair for user ${userId}`);
        result = await ReferralRepairService.repairUserReferralCommissions(userId);
        break;

      case "validate_system":
        console.log(`🔍 Admin ${session.user.id} initiated system validation`);
        result = await ReferralRepairService.validateReferralSystemIntegrity();
        break;

      default:
        const response = NextResponse.json(
          { success: false, error: "Invalid action. Use: repair_all, repair_user, or validate_system" },
          { status: 400 }
        );
        return addAPISecurityHeaders(response);
    }

    // Log the repair activity
    console.log(`✅ Referral repair completed by admin ${session.user.id}:`, {
      action,
      userId: userId || "all",
      success: result.success,
      repairsPerformed: result.repairsPerformed || 0,
      errorsCount: result.errors?.length || 0,
    });

    const response = NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
      adminId: session.user.id,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("❌ Referral repair API error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addAPISecurityHeaders(response);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getAdminSession();
    if (
      !session?.user?.role ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      const response = NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get system validation report
    const validationResult = await ReferralRepairService.validateReferralSystemIntegrity();

    const response = NextResponse.json({
      success: true,
      validation: validationResult,
      timestamp: new Date().toISOString(),
      adminId: session.user.id,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("❌ Referral validation API error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addAPISecurityHeaders(response);
  }
}
