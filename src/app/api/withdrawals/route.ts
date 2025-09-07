import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { db } from '@/lib/db';
import { NotificationService } from '@/lib/notification-service';
import { NotificationType, NotificationSeverity } from '@prisma/client';

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
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED, PROCESSED
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };

    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'].includes(status)) {
      where.status = status;
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

    // Get withdrawal requests with pagination
    const [withdrawals, totalCount] = await Promise.all([
      db.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.withdrawalRequest.count({ where })
    ]);

    // Calculate weekly withdrawal limit and amount
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyWithdrawals = await db.withdrawalRequest.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: startOfWeek },
        status: { in: ['APPROVED', 'PROCESSED'] }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const weeklyLimit = 100.00; // PKR 100 weekly limit
    const weeklyWithdrawn = weeklyWithdrawals._sum.amount || 0;
    const weeklyRemaining = Math.max(0, weeklyLimit - weeklyWithdrawn);

    return NextResponse.json({
      withdrawals: withdrawals.map(withdrawal => ({
        id: withdrawal.id,
        amount: withdrawal.amount,
        paymentMethod: withdrawal.paymentMethod,
        status: withdrawal.status,
        adminNotes: withdrawal.adminNotes,
        processedAt: withdrawal.processedAt?.toISOString(),
        transactionId: withdrawal.transactionId,
        createdAt: withdrawal.createdAt.toISOString(),
        updatedAt: withdrawal.updatedAt.toISOString(),
      })),
      weeklyLimit,
      weeklyWithdrawn,
      weeklyRemaining,
      weeklyCount: weeklyWithdrawals._count.id,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, paymentMethod, paymentDetails } = body;

    // Validate input
    if (!amount || !paymentMethod || !paymentDetails) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const withdrawalAmount = parseFloat(amount);
    const minimumWithdrawal = 10.00;
    const weeklyLimit = 100.00;

    // Check minimum withdrawal amount
    if (withdrawalAmount < minimumWithdrawal) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is $${minimumWithdrawal.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Check if user has sufficient balance
    if (withdrawalAmount > user.walletBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Check weekly withdrawal limit
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyWithdrawals = await db.withdrawalRequest.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: startOfWeek },
        status: { in: ['APPROVED', 'PROCESSED'] }
      },
      _sum: { amount: true }
    });

    const weeklyWithdrawn = weeklyWithdrawals._sum.amount || 0;

    if (weeklyWithdrawn + withdrawalAmount > weeklyLimit) {
      const remaining = weeklyLimit - weeklyWithdrawn;
      return NextResponse.json(
        { error: `Weekly withdrawal limit exceeded. You can withdraw up to $${remaining.toFixed(2)} more this week.` },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawal = await db.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount: withdrawalAmount,
        paymentMethod,
        paymentDetails: JSON.stringify(paymentDetails),
        status: 'PENDING'
      }
    });

    // Create transaction record
    await db.walletTransaction.create({
      data: {
        userId: user.id,
        type: 'DEBIT',
        amount: withdrawalAmount,
        balanceAfter: user.walletBalance - withdrawalAmount,
        description: `Withdrawal request: ${paymentMethod}`,
        referenceId: `WITHDRAWAL_${withdrawal.id}`,
        status: 'PENDING',
        metadata: JSON.stringify({
          withdrawalId: withdrawal.id,
          paymentMethod,
          paymentDetails
        })
      }
    });

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        paymentMethod: withdrawal.paymentMethod,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt.toISOString(),
      }
    });

  } catch (error) {
    console.error('Create withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendWithdrawalNotification(
  userId: string,
  status: string,
  amount: number
) {
  let title = '';
  let message = '';
  let severity: NotificationSeverity = 'INFO';

  switch (status) {
    case 'APPROVED':
      title = 'Withdrawal Approved';
      message = `Your withdrawal request for $${amount.toFixed(2)} has been approved.`;
      severity = 'SUCCESS';
      break;
    case 'REJECTED':
      title = 'Withdrawal Rejected';
      message = `Your withdrawal request for $${amount.toFixed(2)} has been rejected.`;
      severity = 'WARNING';
      break;
    case 'PROCESSED':
      title = 'Withdrawal Processed';
      message = `Your withdrawal request for $${amount.toFixed(2)} has been processed successfully.`;
      severity = 'SUCCESS';
      break;
    default:
      title = 'Withdrawal Status Updated';
      message = `Your withdrawal request status has been updated to ${status}.`;
  }

  try {
    await NotificationService.createNotification({
      type: NotificationType.WITHDRAWAL_REQUEST,
      title,
      message,
      severity,
      actionUrl: '/dashboard/withdraw',
    }, userId);
  } catch (error) {
    console.error('Error sending withdrawal notification:', error);
  }
}
