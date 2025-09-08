import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SecureTokenManager } from "@/lib/token-manager";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Schema for validating user profile data
const userProfileSchema = z.object({
  realName: z
    .string()
    .min(2, "Real name must be at least 2 characters")
    .max(50, "Real name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Real name can only contain letters and spaces"),
});

// Authentication middleware function
async function authenticate(request: NextRequest) {
  let token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    token = request.cookies.get("access_token")?.value;
  }

  if (!token) {
    return { error: "No authentication token found", status: 401 };
  }

  const payload = SecureTokenManager.verifyAccessToken(token);
  if (!payload) {
    return { error: "Invalid or expired token", status: 401 };
  }

  return { userId: payload.userId };
}

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate user
    const authResult = await authenticate(request);
    if ("error" in authResult) {
      response = NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
      return addAPISecurityHeaders(response);
    }

    const userId = authResult.userId;

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    response = NextResponse.json({
      success: true,
      data: userProfile,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    response = NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// POST - Create or update user profile
export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate user
    const authResult = await authenticate(request);
    if ("error" in authResult) {
      response = NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
      return addAPISecurityHeaders(response);
    }

    const userId = authResult.userId;
    const body = await request.json();
    const profileData = body;

    // Validate profile data
    const validatedData = userProfileSchema.parse(profileData);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or update user profile
    const userProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: validatedData,
      create: {
        userId,
        ...validatedData,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    response = NextResponse.json({
      success: true,
      message: "User profile saved successfully",
      data: userProfile,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      response = NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    console.error("Error saving user profile:", error);
    response = NextResponse.json(
      { error: "Failed to save user profile" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate user
    const authResult = await authenticate(request);
    if ("error" in authResult) {
      response = NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
      return addAPISecurityHeaders(response);
    }

    const userId = authResult.userId;
    const body = await request.json();
    const profileData = body;

    // Validate profile data
    const validatedData = userProfileSchema.parse(profileData);

    // Check if profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Update user profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    response = NextResponse.json({
      success: true,
      message: "User profile updated successfully",
      data: updatedProfile,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      response = NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 },
      );
      return addAPISecurityHeaders(response);
    }

    console.error("Error updating user profile:", error);
    response = NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}
