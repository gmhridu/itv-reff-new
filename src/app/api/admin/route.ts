import { adminAuthMiddleware } from "@/lib/api/api-auth";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await adminAuthMiddleware(request);

    if (!admin) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    // Only SUPER_ADMIN can view all admin details
    if (admin.role !== "SUPER_ADMIN") {
      const response = NextResponse.json(
        {
          success: false,
          error: "Forbidden - Super Admin access required",
        },
        { status: 403 }
      );
      return addAPISecurityHeaders(response);
    }

    // Get all admin users with their details
    const admins = await db.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get admin statistics
    const stats = {
      totalAdmins: admins.length,
      superAdmins: admins.filter((a) => a.role === "SUPER_ADMIN").length,
      regularAdmins: admins.filter((a) => a.role === "ADMIN").length,
      recentLogins: admins.filter(
        (a) => a.lastLogin && a.lastLogin > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    };

    const response = NextResponse.json({
      success: true,
      message: "Admin list retrieved successfully",
      data: {
        admins,
        statistics: stats,
        requestedBy: {
          id: admin.id,
          name: admin.name,
          role: admin.role,
        },
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Admin management API error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );

    return addAPISecurityHeaders(response);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const admin = await adminAuthMiddleware(request);

    if (!admin) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    // Only SUPER_ADMIN can create new admins
    if (admin.role !== "SUPER_ADMIN") {
      const response = NextResponse.json(
        {
          success: false,
          error: "Forbidden - Super Admin access required to create new admins",
        },
        { status: 403 }
      );
      return addAPISecurityHeaders(response);
    }

    const body = await request.json();
    const { name, email, password, role = "ADMIN" } = body;

    // Validate required fields
    if (!name || !email || !password) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, email, password",
        },
        { status: 400 }
      );
      return addAPISecurityHeaders(response);
    }

    // Check if admin already exists
    const existingAdmin = await db.adminUser.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Admin user with this email already exists",
        },
        { status: 409 }
      );
      return addAPISecurityHeaders(response);
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new admin
    const newAdmin = await db.adminUser.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      data: {
        admin: newAdmin,
        createdBy: {
          id: admin.id,
          name: admin.name,
        },
      },
    });

    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Create admin API error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error: "Failed to create admin user",
      },
      { status: 500 }
    );

    return addAPISecurityHeaders(response);
  }
}
