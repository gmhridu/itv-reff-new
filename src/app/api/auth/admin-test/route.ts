import { adminAuthMiddleware } from "@/lib/api/api-auth";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Admin test endpoint called");

    // Test 1: Check if token exists
    const token = request.cookies.get("access_token")?.value ||
                  request.headers.get("authorization")?.replace("Bearer ", "");

    console.log("📝 Token exists:", !!token);
    if (token) {
      console.log("📝 Token (first 20 chars):", token.substring(0, 20) + "...");
    }

    // Test 2: Try admin middleware
    const admin = await adminAuthMiddleware(request);
    console.log("👤 Admin from middleware:", admin);

    if (!admin) {
      // Test 3: Check database directly
      const adminCount = await db.adminUser.count();
      console.log("📊 Total admin users in database:", adminCount);

      const response = NextResponse.json({
        success: false,
        debug: {
          tokenExists: !!token,
          adminCount,
          middleware: "failed",
        },
        error: "Admin authentication failed",
      }, { status: 401 });

      return addAPISecurityHeaders(response);
    }

    // Test 4: Success response
    const response = NextResponse.json({
      success: true,
      debug: {
        tokenExists: !!token,
        middlewareResult: "success",
      },
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      message: "Admin authentication test successful",
    });

    return addAPISecurityHeaders(response);

  } catch (error) {
    console.error("🚨 Admin test error:", error);

    const response = NextResponse.json({
      success: false,
      error: "Test failed",
      debug: {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    }, { status: 500 });

    return addAPISecurityHeaders(response);
  }
}
