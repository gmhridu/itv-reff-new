import { db as prisma } from "@/lib/db";
import {
  UserManagement,
  UserFilters,
  PaginatedUsers,
  UserUpdateForm,
  UserStatus,
  PaginationParams,
  UserAnalytics,
} from "@/types/admin";
import { Prisma } from "@prisma/client";
import { auditService, AuditAction } from "./audit-service";

export class UserManagementService {
  /**
   * Get paginated users with filters
   */
  async getUsers(
    filters: UserFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 },
  ): Promise<PaginatedUsers> {
    const {
      page,
      limit,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const whereClause = this.buildWhereClause(filters);

    // Build order by clause
    const orderBy = this.buildOrderByClause(sortBy, sortOrder);

    const [users, totalCount] = await Promise.all([
      this.getUsersWithDetails(whereClause, orderBy, skip, limit),
      prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      users,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Get single user by ID with full details
   */
  async getUserById(userId: string): Promise<UserManagement | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        currentPosition: true,
        videoTasks: {
          where: { isVerified: true },
          select: { id: true, rewardEarned: true },
        },
        referrals: { select: { id: true } },
        transactions: {
          where: { status: "COMPLETED" },
          select: { amount: true, type: true },
        },
      },
    });

    if (!user) return null;

    return this.mapUserToUserManagement(user);
  }

  /**
   * Update user details
   */
  async updateUser(
    userId: string,
    updateData: UserUpdateForm,
    adminId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserManagement> {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, status: true, walletBalance: true },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        currentPosition: true,
        videoTasks: {
          where: { isVerified: true },
          select: { id: true, rewardEarned: true },
        },
        referrals: { select: { id: true } },
        transactions: {
          where: { status: "COMPLETED" },
          select: { amount: true, type: true },
        },
      },
    });

    // Log audit event
    if (adminId) {
      const changes = this.getChangedFields(existingUser, updateData);
      await auditService.logUserAction(
        adminId,
        AuditAction.USER_UPDATED,
        userId,
        `Updated user ${existingUser?.name || userId}: ${changes.join(", ")}`,
        { changes: updateData, previousValues: existingUser },
        ipAddress,
        userAgent,
      );
    }

    return this.mapUserToUserManagement(updatedUser);
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    userId: string,
    status: UserStatus,
    adminNotes?: string,
    adminId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserManagement> {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, status: true },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        updatedAt: new Date(),
        // Add admin notes to metadata if needed
        ...(adminNotes && {
          transactions: {
            create: {
              type: "CREDIT",
              amount: 0,
              balanceAfter: 0,
              description: `Status changed to ${status}. Admin notes: ${adminNotes}`,
              referenceId: `status-change-${Date.now()}`,
              status: "COMPLETED",
            },
          },
        }),
      },
      include: {
        currentPosition: true,
        videoTasks: {
          where: { isVerified: true },
          select: { id: true, rewardEarned: true },
        },
        referrals: { select: { id: true } },
        transactions: {
          where: { status: "COMPLETED" },
          select: { amount: true, type: true },
        },
      },
    });

    // Log audit event
    if (adminId) {
      await auditService.logUserAction(
        adminId,
        AuditAction.USER_STATUS_CHANGED,
        userId,
        `Changed user ${existingUser?.name || userId} status from ${existingUser?.status} to ${status}${adminNotes ? `. Notes: ${adminNotes}` : ""}`,
        { previousStatus: existingUser?.status, newStatus: status, adminNotes },
        ipAddress,
        userAgent,
      );
    }

    return this.mapUserToUserManagement(updatedUser);
  }

  /**
   * Update user wallet balance
   */
  async updateWalletBalance(
    userId: string,
    newBalance: number,
    reason: string,
    adminId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserManagement> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, walletBalance: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const balanceDifference = newBalance - user.walletBalance;

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user balance
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: newBalance,
          updatedAt: new Date(),
        },
        include: {
          currentPosition: true,
          videoTasks: {
            where: { isVerified: true },
            select: { id: true, rewardEarned: true },
          },
          referrals: { select: { id: true } },
          transactions: {
            where: { status: "COMPLETED" },
            select: { amount: true, type: true },
          },
        },
      });

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          userId,
          type: balanceDifference > 0 ? "CREDIT" : "DEBIT",
          amount: Math.abs(balanceDifference),
          balanceAfter: newBalance,
          description: `Admin adjustment: ${reason}`,
          referenceId: `admin-adjustment-${Date.now()}`,
          status: "COMPLETED",
        },
      });

      return updated;
    });

    // Log audit event
    if (adminId) {
      await auditService.logUserAction(
        adminId,
        AuditAction.USER_BALANCE_UPDATED,
        userId,
        `Updated balance for ${user.name || userId} from ${user.walletBalance} to ${newBalance}. Reason: ${reason}`,
        {
          previousBalance: user.walletBalance,
          newBalance,
          difference: balanceDifference,
          reason,
        },
        ipAddress,
        userAgent,
      );
    }

    return this.mapUserToUserManagement(updatedUser);
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    internsCount: number;
    paidPositionsCount: number;
    averageBalance: number;
    totalEarnings: number;
  }> {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      internsCount,
      paidPositionsCount,
      balanceStats,
      earningsStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { status: "BANNED" } }),
      prisma.user.count({ where: { isIntern: true } }),
      prisma.user.count({ where: { isIntern: false } }),
      prisma.user.aggregate({
        _avg: { walletBalance: true },
      }),
      prisma.user.aggregate({
        _sum: { totalEarnings: true },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      internsCount,
      paidPositionsCount,
      averageBalance: balanceStats._avg.walletBalance || 0,
      totalEarnings: earningsStats._sum.totalEarnings || 0,
    };
  }

  /**
   * Get user referral tree
   */
  async getUserReferralTree(
    userId: string,
    depth: number = 3,
  ): Promise<{
    user: UserManagement;
    referrals: UserManagement[];
    totalReferrals: number;
    totalReferralEarnings: number;
  }> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const referrals = await this.getReferralsByLevel(userId, depth);
    const totalReferralEarnings = await this.getTotalReferralEarnings(userId);

    return {
      user,
      referrals,
      totalReferrals: referrals.length,
      totalReferralEarnings,
    };
  }

  /**
   * Export users data
   */
  async exportUsers(filters: UserFilters = {}): Promise<UserManagement[]> {
    const whereClause = this.buildWhereClause(filters);

    return this.getUsersWithDetails(
      whereClause,
      { createdAt: "desc" },
      0,
      10000, // Large limit for export
    );
  }

  /**
   * Private helper methods
   */
  private buildWhereClause(filters: UserFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.positionLevel) {
      where.currentPosition = {
        name: filters.positionLevel,
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm, mode: "insensitive" } },
        { email: { contains: filters.searchTerm, mode: "insensitive" } },
        { phone: { contains: filters.searchTerm, mode: "insensitive" } },
        { referralCode: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    if (filters.isIntern !== undefined) {
      where.isIntern = filters.isIntern;
    }

    if (filters.hasReferrals) {
      where.referrals = {
        some: {},
      };
    }

    return where;
  }

  private buildOrderByClause(
    sortBy: string,
    sortOrder: "asc" | "desc",
  ): Prisma.UserOrderByWithRelationInput {
    const validSortFields = [
      "createdAt",
      "name",
      "email",
      "walletBalance",
      "totalEarnings",
      "lastLoginAt",
    ];

    if (!validSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    return { [sortBy]: sortOrder };
  }

  private async getUsersWithDetails(
    where: Prisma.UserWhereInput,
    orderBy: Prisma.UserOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<UserManagement[]> {
    const users = await prisma.user.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        currentPosition: true,
        videoTasks: {
          where: { isVerified: true },
          select: { id: true, rewardEarned: true },
        },
        referrals: { select: { id: true } },
        transactions: {
          where: { status: "COMPLETED" },
          select: { amount: true, type: true },
        },
      },
    });

    return users.map(this.mapUserToUserManagement);
  }

  private mapUserToUserManagement(user: any): UserManagement {
    const totalVideosTasks = user.videoTasks?.length || 0;
    const totalReferrals = user.referrals?.length || 0;

    // Calculate engagement score based on video tasks completed
    const engagement = Math.min((totalVideosTasks / 30) * 100, 100);

    return {
      id: user.id,
      name: user.name || "",
      email: user.email,
      phone: user.phone,
      registrationDate: user.createdAt,
      lastLogin: user.lastLoginAt,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      walletBalance: user.walletBalance,
      totalEarnings: user.totalEarnings,
      currentPosition: user.currentPosition?.id || null,
      positionLevel: user.currentPosition?.name || null,
      engagement: Math.round(engagement),
      totalVideosTasks,
      totalReferrals,
      ipAddress: user.ipAddress,
      deviceId: user.deviceId,
      isIntern: user.isIntern,
      depositPaid: user.depositPaid,
    };
  }

  private async getReferralsByLevel(
    userId: string,
    maxDepth: number,
  ): Promise<UserManagement[]> {
    const referrals: UserManagement[] = [];

    const directReferrals = await prisma.user.findMany({
      where: { referredBy: userId },
      include: {
        currentPosition: true,
        videoTasks: {
          where: { isVerified: true },
          select: { id: true, rewardEarned: true },
        },
        referrals: { select: { id: true } },
        transactions: {
          where: { status: "COMPLETED" },
          select: { amount: true, type: true },
        },
      },
    });

    for (const referral of directReferrals) {
      referrals.push(this.mapUserToUserManagement(referral));

      if (maxDepth > 1) {
        const subReferrals = await this.getReferralsByLevel(
          referral.id,
          maxDepth - 1,
        );
        referrals.push(...subReferrals);
      }
    }

    return referrals;
  }

  private async getTotalReferralEarnings(userId: string): Promise<number> {
    const result = await prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: {
          in: ["REFERRAL_REWARD_A", "REFERRAL_REWARD_B", "REFERRAL_REWARD_C"],
        },
        status: "COMPLETED",
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Helper method to track changed fields for audit logging
   */
  private getChangedFields(existingData: any, updateData: any): string[] {
    const changes: string[] = [];

    if (!existingData) return Object.keys(updateData);

    for (const [key, value] of Object.entries(updateData)) {
      if (existingData[key] !== value) {
        changes.push(`${key}: ${existingData[key]} → ${value}`);
      }
    }

    return changes;
  }
}

export const userManagementService = new UserManagementService();
