import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type'); // TASK_INCOME, DEBIT, etc.
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.walletTransaction.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await db.walletTransaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get credit and debit totals separately
    const creditSummary = await db.walletTransaction.aggregate({
      where: {
        ...where,
        amount: { gt: 0 },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const debitSummary = await db.walletTransaction.aggregate({
      where: {
        ...where,
        amount: { lt: 0 },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    return NextResponse.json({
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        referenceId: transaction.referenceId,
        status: transaction.status,
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
        createdAt: transaction.createdAt.toISOString(),
      })),
      summary: {
        totalCredits: creditSummary._sum.amount || 0,
        totalDebits: Math.abs(debitSummary._sum.amount || 0),
        creditCount: creditSummary._count.id || 0,
        debitCount: debitSummary._count.id || 0,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Get wallet transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
