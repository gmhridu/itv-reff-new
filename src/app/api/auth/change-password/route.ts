import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/api/api-auth";
import { hashPassword, verifyPassword } from "@/lib/api/auth";
import { db as prisma } from "@/lib/db";
import { addAPISecurityHeaders } from "@/lib/security-headers";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      response = NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      response = NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Get user with password from database
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true },
    });

    if (!userWithPassword) {
      response = NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
      return addAPISecurityHeaders(response);
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      userWithPassword.password,
    );

    if (!isCurrentPasswordValid) {
      response = NextResponse.json(
        { error: "Invalid current password" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Check if new password is the same as current password
    const isSamePassword = await verifyPassword(
      newPassword,
      userWithPassword.password,
    );

    if (isSamePassword) {
      response = NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update the user's password in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    // Log the password change activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: "password_change",
        description: "User changed their login password",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
        }),
      },
    });

    response = NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Change password error:", error);
    response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
