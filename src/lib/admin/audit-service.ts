import { db as prisma } from "@/lib/db";

// Define AuditAction enum since it's not exported yet
export enum AuditAction {
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_STATUS_CHANGED = "USER_STATUS_CHANGED",
  USER_BALANCE_UPDATED = "USER_BALANCE_UPDATED",
  VIDEO_CREATED = "VIDEO_CREATED",
  VIDEO_UPDATED = "VIDEO_UPDATED",
  VIDEO_DELETED = "VIDEO_DELETED",
  VIDEO_STATUS_CHANGED = "VIDEO_STATUS_CHANGED",
  WITHDRAWAL_APPROVED = "WITHDRAWAL_APPROVED",
  WITHDRAWAL_REJECTED = "WITHDRAWAL_REJECTED",
  SETTINGS_UPDATED = "SETTINGS_UPDATED",
  ADMIN_LOGIN = "ADMIN_LOGIN",
  ADMIN_LOGOUT = "ADMIN_LOGOUT",
  BULK_UPDATE = "BULK_UPDATE",
  DATA_EXPORT = "DATA_EXPORT",
}

export interface AuditLogEntry {
  id: string;
  adminId: string | null;
  admin: {
    id: string;
    name: string;
    email: string;
  } | null;
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  description: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AuditFilters {
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class AuditService {
  /**
   * Log an audit event
   */
  async log(
    action: AuditAction,
    targetType: string,
    description: string,
    options: {
      adminId?: string;
      targetId?: string;
      details?: any;
      ipAddress?: string;
      userAgent?: string;
    } = {},
  ): Promise<void> {
    try {
      await (prisma as any).auditLog.create({
        data: {
          adminId: options.adminId || null,
          action,
          targetType,
          targetId: options.targetId || null,
          description,
          details: options.details ? JSON.stringify(options.details) : null,
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null,
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw error to prevent breaking the main operation
    }
  }

  /**
   * Get paginated audit logs with filters
   */
  async getAuditLogs(
    filters: AuditFilters = {},
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedAuditLogs> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.adminId) {
      where.adminId = filters.adminId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters.targetId) {
      where.targetId = filters.targetId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [logs, totalCount] = await Promise.all([
      (prisma as any).auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      (prisma as any).auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      logs: logs.map(this.mapAuditLog),
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Get audit logs for specific target
   */
  async getTargetAuditLogs(
    targetType: string,
    targetId: string,
    limit: number = 20,
  ): Promise<AuditLogEntry[]> {
    const logs = await (prisma as any).auditLog.findMany({
      where: {
        targetType,
        targetId,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map(this.mapAuditLog);
  }

  /**
   * Get admin activity summary
   */
  async getAdminActivity(
    adminId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalActions: number;
    actionsByType: { action: AuditAction; count: number }[];
    recentActions: AuditLogEntry[];
  }> {
    const where: any = { adminId };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [totalActions, actionsByType, recentActions] = await Promise.all([
      (prisma as any).auditLog.count({ where }),
      (prisma as any).auditLog.groupBy({
        by: ["action"],
        where,
        _count: true,
        orderBy: { _count: { action: "desc" } },
      }),
      (prisma as any).auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      totalActions,
      actionsByType: actionsByType.map((item: any) => ({
        action: item.action,
        count: item._count,
      })),
      recentActions: recentActions.map(this.mapAuditLog),
    };
  }

  /**
   * Get system-wide audit statistics
   */
  async getAuditStatistics(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    totalLogs: number;
    logsByAction: { action: AuditAction; count: number }[];
    logsByTargetType: { targetType: string; count: number }[];
    mostActiveAdmins: {
      adminId: string;
      adminName: string;
      actionCount: number;
    }[];
  }> {
    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [totalLogs, logsByAction, logsByTargetType, mostActiveAdmins] =
      await Promise.all([
        (prisma as any).auditLog.count({ where }),
        (prisma as any).auditLog.groupBy({
          by: ["action"],
          where,
          _count: true,
          orderBy: { _count: { action: "desc" } },
        }),
        (prisma as any).auditLog.groupBy({
          by: ["targetType"],
          where,
          _count: true,
          orderBy: { _count: { targetType: "desc" } },
        }),
        this.getMostActiveAdmins(where),
      ]);

    return {
      totalLogs,
      logsByAction: logsByAction.map((item: any) => ({
        action: item.action,
        count: item._count,
      })),
      logsByTargetType: logsByTargetType.map((item: any) => ({
        targetType: item.targetType,
        count: item._count,
      })),
      mostActiveAdmins,
    };
  }

  /**
   * Export audit logs as CSV
   */
  async exportAuditLogs(filters: AuditFilters = {}): Promise<string> {
    const where: any = {};

    if (filters.adminId) where.adminId = filters.adminId;
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const logs = await (prisma as any).auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10000, // Limit for performance
    });

    // CSV headers
    const csvHeaders = [
      "Date/Time",
      "Admin Name",
      "Admin Email",
      "Action",
      "Target Type",
      "Target ID",
      "Description",
      "IP Address",
      "User Agent",
    ];

    // CSV rows
    const csvRows = logs.map((log: any) => [
      log.createdAt.toISOString(),
      log.admin?.name || "System",
      log.admin?.email || "",
      log.action,
      log.targetType,
      log.targetId || "",
      `"${log.description.replace(/"/g, '""')}"`, // Escape quotes
      log.ipAddress || "",
      log.userAgent || "",
    ]);

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.join(","))
      .join("\n");

    return csvContent;
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await (prisma as any).auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Convenience methods for common audit actions
   */
  async logUserAction(
    adminId: string,
    action: AuditAction,
    userId: string,
    description: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log(action, "user", description, {
      adminId,
      targetId: userId,
      details,
      ipAddress,
      userAgent,
    });
  }

  async logVideoAction(
    adminId: string,
    action: AuditAction,
    videoId: string,
    description: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log(action, "video", description, {
      adminId,
      targetId: videoId,
      details,
      ipAddress,
      userAgent,
    });
  }

  async logWithdrawalAction(
    adminId: string,
    action: AuditAction,
    withdrawalId: string,
    description: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log(action, "withdrawal", description, {
      adminId,
      targetId: withdrawalId,
      details,
      ipAddress,
      userAgent,
    });
  }

  async logSettingsAction(
    adminId: string,
    description: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log(AuditAction.SETTINGS_UPDATED, "settings", description, {
      adminId,
      details,
      ipAddress,
      userAgent,
    });
  }

  async logAdminLogin(
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log(AuditAction.ADMIN_LOGIN, "admin", "Admin logged in", {
      adminId,
      targetId: adminId,
      ipAddress,
      userAgent,
    });
  }

  async logAdminLogout(
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log(AuditAction.ADMIN_LOGOUT, "admin", "Admin logged out", {
      adminId,
      targetId: adminId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Private helper methods
   */
  private mapAuditLog(log: any): AuditLogEntry {
    return {
      id: log.id,
      adminId: log.adminId,
      admin: log.admin,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      description: log.description,
      details: log.details ? JSON.parse(log.details) : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    };
  }

  private async getMostActiveAdmins(where: any): Promise<
    {
      adminId: string;
      adminName: string;
      actionCount: number;
    }[]
  > {
    try {
      const result = await (prisma as any).auditLog.groupBy({
        by: ["adminId"],
        where: {
          ...where,
          adminId: { not: null },
        },
        _count: true,
        orderBy: { _count: { adminId: "desc" } },
        take: 10,
      });

      // Get admin details
      const adminIds = result.map((item: any) => item.adminId).filter(Boolean);
      const admins = await prisma.adminUser.findMany({
        where: { id: { in: adminIds as string[] } },
        select: { id: true, name: true },
      });

      const adminMap = new Map(admins.map((admin) => [admin.id, admin.name]));

      return result
        .filter((item: any) => item.adminId)
        .map((item: any) => ({
          adminId: item.adminId as string,
          adminName: adminMap.get(item.adminId as string) || "Unknown",
          actionCount: item._count,
        }));
    } catch (error) {
      console.error("Error getting most active admins:", error);
      return [];
    }
  }
}

export const auditService = new AuditService();
