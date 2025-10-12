import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clearAllLockoutStatus, clearLockoutStatusByPhone } from "@/lib/api/auth";
import { addAPISecurityHeaders } from "@/lib/security-headers";

const clearLockoutSchema = z.object({
  phone: z.string().optional(),
  clearAll: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = clearLockoutSchema.parse(body);

    // If clearing all lockout status
    if (validatedData.clearAll) {
      const clearedCount = await clearAllLockoutStatus();
      return NextResponse.json({
        success: true,
        message: `Cleared lockout status for ${clearedCount} user(s)`,
        clearedCount,
      });
    }

    // If clearing lockout status for specific phone
    if (validatedData.phone) {
      const cleared = await clearLockoutStatusByPhone(validatedData.phone);
      if (cleared) {
        return NextResponse.json({
          success: true,
          message: `Lockout status cleared for phone number: ${validatedData.phone}`,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: "User not found or no lockout status to clear",
        }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: false,
      error: "Please provide either 'phone' number or set 'clearAll' to true",
    }, { status: 400 });

  } catch (error) {
    console.error("Clear lockout error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
