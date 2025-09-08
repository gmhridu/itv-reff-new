import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SecureTokenManager } from "@/lib/token-manager";
import { addAPISecurityHeaders } from "@/lib/security-headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Schema for validating bank card data
const bankCardSchema = z.object({
  cardHolderName: z
    .string()
    .min(2, "Card holder name must be at least 2 characters")
    .max(50, "Card holder name must not exceed 50 characters"),
  bankName: z.enum(["JAZZCASH", "EASYPAISA"]),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .max(15, "Account number must not exceed 15 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
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

    const bankCards = await prisma.bankCard.findMany({
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
      accountNumber: maskAccountNumber(card.accountNumber),
    }));

    response = NextResponse.json({
      success: true,
      data: maskedBankCards,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching bank cards:", error);
    response = NextResponse.json(
      { error: "Failed to fetch bank cards" },
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a card with the same account number
    const existingCard = await prisma.bankCard.findFirst({
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
    const bankCard = await prisma.bankCard.create({
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
      accountNumber: maskAccountNumber(bankCard.accountNumber),
    };

    response = NextResponse.json({
      success: true,
      message: "Bank card added successfully",
      data: maskedBankCard,
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

    console.error("Error creating bank card:", error);
    response = NextResponse.json(
      { error: "Failed to add bank card" },
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
    const existingCard = await prisma.bankCard.findFirst({
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
    const deactivatedCard = await prisma.bankCard.update({
      where: { id: cardId },
      data: { isActive: false },
    });

    response = NextResponse.json({
      success: true,
      message: "Bank card removed successfully",
      data: deactivatedCard,
    });
    return addAPISecurityHeaders(response);
  } catch (error) {
    console.error("Error deleting bank card:", error);
    response = NextResponse.json(
      { error: "Failed to remove bank card" },
      { status: 500 },
    );
    return addAPISecurityHeaders(response);
  }
}

// Utility function to mask account number
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }

  const start = accountNumber.slice(0, 4);
  const end = accountNumber.slice(-4);
  const middle = "*".repeat(Math.min(4, accountNumber.length - 8));

  return `${start} ${middle} ${end}`;
}
