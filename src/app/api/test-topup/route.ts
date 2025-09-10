import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test if adminWallet model exists and is accessible
    const walletCount = await prisma.adminWallet.count();
    const topupCount = await prisma.topupRequest.count();

    return NextResponse.json({
      success: true,
      data: {
        adminWallets: walletCount,
        topupRequests: topupCount,
        message: "Prisma models working correctly"
      }
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
