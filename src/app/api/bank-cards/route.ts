import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SecureTokenManager } from "@/lib/token-manager";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { db } from "@/lib/db";

// Schema for validating bank card data
const bankCardSchema = z
  .object({
    cardHolderName: z
      .string()
      .min(2, "Card holder name must be at least 2 characters")
      .max(50, "Card holder name must not exceed 50 characters"),
    bankName: z.enum(["JAZZCASH", "EASYPAISA", "USDT_TRC20"]),
    accountNumber: z.string().min(1, "Account number is required"),
  })
  .superRefine((data, ctx) => {
    const { bankName, accountNumber } = data;

    if (bankName !== "USDT_TRC20") {
      // Traditional bank account validation (10-15 digits)
      if (!/^\d{10,15}$/.test(accountNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accountNumber"],
          message: "Account number must be 10-15 digits",
        });
      }
    }
    // No validation for USDT_TRC20 addresses - unrestricted as per requirements
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

// GET - Fetch user's bank cards
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

    const bankCards = await db.bankCard.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mask account numbers for security
    const maskedBankCards = bankCards.map((card) => ({
      ...card,
      accountNumber: maskAccountNumber(card.accountNumber, card.bankName),
    }));

    response = NextResponse.json({
      success: true,
      data: maskedBankCards,
    });
    return addAPISecurityHeaders(response);
  } catch (error: any) {
    console.error("Error fetching bank cards:", error);

    // Handle specific database connection errors
    if (
      error.message?.includes("Database connection failed") ||
      error.message?.includes("Can't reach database server")
    ) {
      response = NextResponse.json(
        {
          error:
            "Database temporarily unavailable. Please try again in a few moments.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 },
      );
      return addAPISecurityHeaders(response);
    }

    response = NextResponse.json(
      {
        error: "Failed to fetch bank cards",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// POST - Create new bank card
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
    const cardData = body;

    // Validate card data
    const validatedData = bankCardSchema.parse(cardData);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a card with the same account number
    const existingCard = await db.bankCard.findFirst({
      where: {
        userId,
        accountNumber: validatedData.accountNumber,
        isActive: true,
      },
    });

    if (existingCard) {
      return NextResponse.json(
        { error: "A bank card with this account number already exists" },
        { status: 409 },
      );
    }

    // Create new bank card
    const bankCard = await db.bankCard.create({
      data: {
        userId,
        ...validatedData,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Return masked account number
    const maskedBankCard = {
      ...bankCard,
      accountNumber: maskAccountNumber(
        bankCard.accountNumber,
        bankCard.bankName,
      ),
    };

    response = NextResponse.json({
      success: true,
      message: "Bank card added successfully",
      data: maskedBankCard,
    });
    return addAPISecurityHeaders(response);
  } catch (error: any) {
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

    console.error("Error creating bank card:", error);

    // Handle specific database connection errors
    if (
      error.message?.includes("Database connection failed") ||
      error.message?.includes("Can't reach database server")
    ) {
      response = NextResponse.json(
        {
          error:
            "Database temporarily unavailable. Please try again in a few moments.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 },
      );
      return addAPISecurityHeaders(response);
    }

    response = NextResponse.json(
      {
        error: "Failed to add bank card",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// DELETE - Deactivate bank card
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId");

    if (!cardId) {
      return NextResponse.json(
        { error: "Card ID is required" },
        { status: 400 },
      );
    }

    // Check if card exists and belongs to user
    const existingCard = await db.bankCard.findFirst({
      where: {
        id: cardId,
        userId,
        isActive: true,
      },
    });

    if (!existingCard) {
      return NextResponse.json(
        { error: "Bank card not found" },
        { status: 404 },
      );
    }

    // Deactivate the card instead of deleting
    const deactivatedCard = await db.bankCard.update({
      where: { id: cardId },
      data: { isActive: false },
    });

    response = NextResponse.json({
      success: true,
      message: "Bank card removed successfully",
      data: deactivatedCard,
    });
    return addAPISecurityHeaders(response);
  } catch (error: any) {
    console.error("Error deleting bank card:", error);

    // Handle specific database connection errors
    if (
      error.message?.includes("Database connection failed") ||
      error.message?.includes("Can't reach database server")
    ) {
      response = NextResponse.json(
        {
          error:
            "Database temporarily unavailable. Please try again in a few moments.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 },
      );
      return addAPISecurityHeaders(response);
    }

    response = NextResponse.json(
      {
        error: "Failed to remove bank card",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// Utility function to mask account number
function maskAccountNumber(accountNumber: string, bankName?: string): string {
  if (bankName === "USDT_TRC20") {
    // For USDT addresses, show first 6 and last 6 characters
    if (accountNumber.length <= 12) {
      return accountNumber;
    }
    const start = accountNumber.slice(0, 6);
    const end = accountNumber.slice(-6);
    const middle = "*".repeat(6);
    return `${start}${middle}${end}`;
  }

  // For traditional bank accounts
  if (accountNumber.length <= 4) {
    return accountNumber;
  }

  const start = accountNumber.slice(0, 4);
  const end = accountNumber.slice(-4);
  const middle = "*".repeat(Math.min(4, accountNumber.length - 8));

  return `${start} ${middle} ${end}`;
}
