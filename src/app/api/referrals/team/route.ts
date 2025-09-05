import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/api/api-auth';
import { addAPISecurityHeaders } from '@/lib/security-headers';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  let response: NextResponse;

  try {
    // Authenticate user
    const user = await authMiddleware(request);
    if (!user || !user.id) {
      response = NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
      return addAPISecurityHeaders(response);
    }

    const url = new URL(request.url);
    const level = url.searchParams.get('level'); // A_LEVEL, B_LEVEL, C_LEVEL
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: any = {
      referrerId: user.id
    };

    if (level) {
      whereClause.level = level;
    }

    // Get team members with detailed information
    const teamMembers = await db.referralHierarchy.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            lastLoginAt: true,
            status: true,
            totalEarnings: true,
            walletBalance: true,
            currentPosition: {
              select: {
                name: true,
                level: true,
                unitPrice: true,
                dailyTaskLimit: true
              }
            },
            // Get recent activity
            userVideoTasks: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
              },
              select: {
                createdAt: true,
                rewardAmount: true
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await db.referralHierarchy.count({
      where: whereClause
    });

    // Format team member data with performance metrics
    const formattedTeamMembers = teamMembers.map(member => {
      const user = member.user;
      const recentTasks = user.userVideoTasks || [];
      
      // Calculate performance metrics
      const weeklyTaskCount = recentTasks.length;
      const weeklyEarnings = recentTasks.reduce((sum, task) => sum + (task.rewardAmount || 0), 0);
      const averageDailyTasks = weeklyTaskCount / 7;
      const lastActivityDate = recentTasks.length > 0 ? recentTasks[0].createdAt : user.lastLoginAt;

      // Calculate activity status
      const daysSinceLastActivity = lastActivityDate 
        ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let activityStatus = 'inactive';
      if (daysSinceLastActivity !== null) {
        if (daysSinceLastActivity <= 1) activityStatus = 'very_active';
        else if (daysSinceLastActivity <= 3) activityStatus = 'active';
        else if (daysSinceLastActivity <= 7) activityStatus = 'moderate';
        else activityStatus = 'inactive';
      }

      return {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        level: member.level,
        joinedAt: member.createdAt,
        lastActivity: lastActivityDate,
        activityStatus,
        daysSinceLastActivity,
        isActive: user.status === 'ACTIVE',
        currentPosition: user.currentPosition ? {
          name: user.currentPosition.name,
          level: user.currentPosition.level,
          unitPrice: user.currentPosition.unitPrice,
          dailyTaskLimit: user.currentPosition.dailyTaskLimit
        } : null,
        performance: {
          totalEarnings: user.totalEarnings || 0,
          walletBalance: user.walletBalance || 0,
          weeklyTaskCount,
          weeklyEarnings,
          averageDailyTasks: Math.round(averageDailyTasks * 100) / 100
        }
      };
    });

    // Calculate team statistics
    const teamStats = {
      totalMembers: totalCount,
      activeMembers: formattedTeamMembers.filter(m => m.isActive).length,
      veryActiveMembers: formattedTeamMembers.filter(m => m.activityStatus === 'very_active').length,
      inactiveMembers: formattedTeamMembers.filter(m => m.activityStatus === 'inactive').length,
      totalTeamEarnings: formattedTeamMembers.reduce((sum, m) => sum + m.performance.totalEarnings, 0),
      averageEarningsPerMember: formattedTeamMembers.length > 0 
        ? formattedTeamMembers.reduce((sum, m) => sum + m.performance.totalEarnings, 0) / formattedTeamMembers.length 
        : 0
    };

    // Get position distribution
    const positionDistribution = formattedTeamMembers.reduce((acc, member) => {
      const positionName = member.currentPosition?.name || 'Intern';
      acc[positionName] = (acc[positionName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top performers (by weekly earnings)
    const topPerformers = [...formattedTeamMembers]
      .sort((a, b) => b.performance.weeklyEarnings - a.performance.weeklyEarnings)
      .slice(0, 5);

    response = NextResponse.json({
      success: true,
      data: {
        teamMembers: formattedTeamMembers,
        teamStats,
        positionDistribution,
        topPerformers,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Team management error:', error);
    response = NextResponse.json(
      { success: false, error: 'Failed to fetch team data' },
      { status: 500 }
    );
  }

  return addAPISecurityHeaders(response);
}
