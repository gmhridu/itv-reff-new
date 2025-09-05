import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { EnhancedReferralService } from '@/lib/enhanced-referral-service';
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

    // Get referral hierarchy stats
    const hierarchyStats = await EnhancedReferralService.getReferralHierarchyStats(user.id);

    // Get detailed subordinate information
    const subordinates = await db.referralHierarchy.findMany({
      where: { referrerId: user.id },
      include: {
        user: {
          include: {
            currentPosition: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const subordinateDetails = subordinates.map(sub => ({
      id: sub.user.id,
      name: sub.user.name || 'Unknown',
      email: sub.user.email,
      level: sub.level,
      joinedAt: sub.createdAt,
      currentPosition: sub.user.currentPosition ? {
        name: sub.user.currentPosition.name,
        level: sub.user.currentPosition.level
      } : null,
      isActive: sub.user.status === 'ACTIVE',
      totalEarnings: sub.user.totalEarnings
    }));

    // Group subordinates by level
    const subordinatesByLevel = {
      aLevel: subordinateDetails.filter(s => s.level === 'A_LEVEL'),
      bLevel: subordinateDetails.filter(s => s.level === 'B_LEVEL'),
      cLevel: subordinateDetails.filter(s => s.level === 'C_LEVEL')
    };

    // Calculate team performance metrics
    const teamMetrics = {
      totalTeamSize: subordinateDetails.length,
      activeMembers: subordinateDetails.filter(s => s.isActive).length,
      totalTeamEarnings: subordinateDetails.reduce((sum, s) => sum + (s.totalEarnings || 0), 0),
      averageEarningsPerMember: subordinateDetails.length > 0
        ? subordinateDetails.reduce((sum, s) => sum + (s.totalEarnings || 0), 0) / subordinateDetails.length
        : 0
    };

    // Get position distribution
    const positionDistribution = subordinateDetails.reduce((acc, s) => {
      const positionName = s.currentPosition?.name || 'Intern';
      acc[positionName] = (acc[positionName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate growth metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentGrowth = subordinates.filter(s =>
      new Date(s.createdAt) >= thirtyDaysAgo
    );

    const growthMetrics = {
      aLevel: recentGrowth.filter(s => s.level === 'A_LEVEL').length,
      bLevel: recentGrowth.filter(s => s.level === 'B_LEVEL').length,
      cLevel: recentGrowth.filter(s => s.level === 'C_LEVEL').length,
      total: recentGrowth.length
    };

    return NextResponse.json({
      success: true,
      data: {
        hierarchyStats,
        subordinatesByLevel,
        teamMetrics,
        positionDistribution,
        growthMetrics,
        totalSubordinates: subordinateDetails.length
      }
    });

  } catch (error) {
    console.error('Get referral hierarchy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
