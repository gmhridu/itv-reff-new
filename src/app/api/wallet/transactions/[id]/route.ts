import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const transactionId = params.id;

    const transaction = await db.walletTransaction.findFirst({
      where: {
        id: transactionId,
        userId: user.id
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        referenceId: transaction.referenceId,
        status: transaction.status,
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
        createdAt: transaction.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Get transaction details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
