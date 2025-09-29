import { User } from "@prisma/client";
import { settingsService } from "./settings-service";
import { db as prisma } from "@/lib/db";

export interface WithdrawalConfig {
  minimumWithdrawal: number;
  maxDailyWithdrawals: number;
  withdrawalFeePercentage: number;
  usdtWithdrawalEnabled: boolean;
  bankWithdrawalEnabled: boolean;
  withdrawalProcessingTime: string;
  usdtProcessingTime: string;
  predefinedAmounts: number[];
  usdtToPkrRate: number;
  usdtNetworkFee: number;
}

export interface WithdrawalValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface WithdrawalCalculation {
  withdrawalAmount: number;
  handlingFee: number;
  totalDeduction: number;
  netAmount: number;
  usdtAmount?: number;
  usdtAmountAfterFee?: number;
  isUsdtWithdrawal: boolean;
}

export class WithdrawalConfigService {
  private static instance: WithdrawalConfigService;

  public static getInstance(): WithdrawalConfigService {
    if (!WithdrawalConfigService.instance) {
      WithdrawalConfigService.instance = new WithdrawalConfigService();
    }
    return WithdrawalConfigService.instance;
  }

  /**
   * Get current withdrawal configuration
   */
  async getWithdrawalConfig(): Promise<WithdrawalConfig> {
    const systemSettings =
      await settingsService.getSettingsByCategory("system");

    // Get dynamic USDT rate from topup API or use fallback
    const usdtRate = await this.getCurrentUsdtRate();

    return {
      minimumWithdrawal: systemSettings.minimumWithdrawal || 500,
      maxDailyWithdrawals: systemSettings.maxDailyWithdrawals || 5,
      withdrawalFeePercentage: systemSettings.withdrawalFeePercentage || 10,
      usdtWithdrawalEnabled: systemSettings.usdtWithdrawalEnabled ?? true,
      bankWithdrawalEnabled: systemSettings.bankWithdrawalEnabled ?? true,
      withdrawalProcessingTime:
        systemSettings.withdrawalProcessingTime || "0-72 hours",
      usdtProcessingTime: systemSettings.usdtProcessingTime || "0-30 minutes",
      predefinedAmounts: [
        500, 3000, 10000, 30000, 70000, 100000, 250000, 500000,
      ],
      usdtToPkrRate: usdtRate,
      usdtNetworkFee: 0, // Currently no network fee for USDT
    };
  }

  /**
   * Get current USDT to PKR rate
   */
  private async getCurrentUsdtRate(): Promise<number> {
    try {
      // Try to get rate from database settings first
      const rateSetting = await settingsService.getSetting(
        "system.usdtToPkrRate"
      );
      if (rateSetting && rateSetting.value > 0) {
        return rateSetting.value;
      }

      // Fallback to default rate
      return 295;
    } catch (error) {
      console.warn("Failed to get USDT rate, using fallback:", error);
      return 295;
    }
  }

  /**
   * Update withdrawal configuration
   */
  async updateWithdrawalConfig(
    config: Partial<WithdrawalConfig>
  ): Promise<WithdrawalConfig> {
    const updates: any = {};

    if (config.minimumWithdrawal !== undefined) {
      updates.minimumWithdrawal = config.minimumWithdrawal;
    }
    if (config.maxDailyWithdrawals !== undefined) {
      updates.maxDailyWithdrawals = config.maxDailyWithdrawals;
    }
    if (config.withdrawalFeePercentage !== undefined) {
      updates.withdrawalFeePercentage = config.withdrawalFeePercentage;
    }
    if (config.usdtWithdrawalEnabled !== undefined) {
      updates.usdtWithdrawalEnabled = config.usdtWithdrawalEnabled;
    }
    if (config.bankWithdrawalEnabled !== undefined) {
      updates.bankWithdrawalEnabled = config.bankWithdrawalEnabled;
    }
    if (config.withdrawalProcessingTime !== undefined) {
      updates.withdrawalProcessingTime = config.withdrawalProcessingTime;
    }
    if (config.usdtProcessingTime !== undefined) {
      updates.usdtProcessingTime = config.usdtProcessingTime;
    }
    if (config.usdtToPkrRate !== undefined) {
      updates.usdtToPkrRate = config.usdtToPkrRate;
    }

    // Update system settings
    await settingsService.updateSettingsByCategory("system", updates);

    return this.getWithdrawalConfig();
  }

  /**
   * Validate withdrawal request
   */
  async validateWithdrawal(
    user: User,
    amount: number,
    paymentMethodId: string
  ): Promise<WithdrawalValidationResult> {
    const config = await this.getWithdrawalConfig();
    const warnings: string[] = [];

    // Check minimum withdrawal amount
    if (amount < config.minimumWithdrawal) {
      return {
        isValid: false,
        error: `Minimum withdrawal amount is PKR ${config.minimumWithdrawal}`,
      };
    }

    if (!user) {
      return {
        isValid: false,
        error: "User not found",
      };
    }
    // Get payment method details
    const bankCard = await prisma.bankCard.findFirst({
      where: {
        id: paymentMethodId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!bankCard) {
      return {
        isValid: false,
        error: "Invalid payment method selected",
      };
    }

    // Check if withdrawal method is enabled
    const isUsdtWithdrawal = bankCard.bankName === "USDT_TRC20";

    if (isUsdtWithdrawal && !config.usdtWithdrawalEnabled) {
      return {
        isValid: false,
        error: "USDT withdrawals are currently disabled",
      };
    }

    if (!isUsdtWithdrawal && !config.bankWithdrawalEnabled) {
      return {
        isValid: false,
        error: "Bank withdrawals are currently disabled",
      };
    }

    // check if user has enough balance
    const totalAvailableBalance = user.securityRefund + user.commissionBalance;
    if (totalAvailableBalance < amount) {
      return {
        isValid: false,
        error: `Insufficient balance. Available: PKR ${totalAvailableBalance.toFixed(
          2
        )}, Required: PKR ${amount.toFixed(2)}`,
      };
    }

    // Check daily withdrawal limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysWithdrawals = await prisma.withdrawalRequest.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["PENDING", "APPROVED", "PROCESSED"],
        },
      },
    });

    if (todaysWithdrawals >= config.maxDailyWithdrawals) {
      return {
        isValid: false,
        error: `Daily withdrawal limit exceeded. Maximum ${config.maxDailyWithdrawals} withdrawals per day.`,
      };
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Calculate withdrawal fees and amounts
   */
  async calculateWithdrawal(
    amount: number,
    isUsdtWithdrawal: boolean = false
  ): Promise<WithdrawalCalculation> {
    const config = await this.getWithdrawalConfig();

    let handlingFee: number;
    let totalDeduction: number;
    let netAmount: number;
    let usdtAmount: number | undefined;
    let usdtAmountAfterFee: number | undefined;

    if (isUsdtWithdrawal) {
      // USDT: No handling fee in PKR, but may have network fees in USDT
      handlingFee = 0;
      totalDeduction = amount;
      netAmount = amount;
      usdtAmount = amount / config.usdtToPkrRate;
      usdtAmountAfterFee = usdtAmount - config.usdtNetworkFee;
    } else {
      // Bank withdrawal: Apply handling fee
      handlingFee = amount * (config.withdrawalFeePercentage / 100);
      totalDeduction = amount + handlingFee;
      netAmount = amount;
    }

    return {
      withdrawalAmount: amount,
      handlingFee,
      totalDeduction,
      netAmount,
      usdtAmount,
      usdtAmountAfterFee,
      isUsdtWithdrawal,
    };
  }

  /**
   * Get withdrawal statistics
   */
  async getWithdrawalStats() {
    const totalWithdrawals = await prisma.withdrawalRequest.count();

    const statusCounts = await prisma.withdrawalRequest.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum: { amount: true },
    });

    const pendingAmount =
      statusCounts.find((s) => s.status === "PENDING")?._sum?.amount || 0;
    const processedAmount =
      statusCounts.find((s) => s.status === "PROCESSED")?._sum?.amount || 0;

    // Get today's withdrawals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysWithdrawals = await prisma.withdrawalRequest.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todaysAmount = await prisma.withdrawalRequest.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["PROCESSED"],
        },
      },
      _sum: { amount: true },
    });

    return {
      totalWithdrawals,
      pendingWithdrawals:
        statusCounts.find((s) => s.status === "PENDING")?._count?.status || 0,
      approvedWithdrawals:
        statusCounts.find((s) => s.status === "APPROVED")?._count?.status || 0,
      processedWithdrawals:
        statusCounts.find((s) => s.status === "PROCESSED")?._count?.status || 0,
      rejectedWithdrawals:
        statusCounts.find((s) => s.status === "REJECTED")?._count?.status || 0,
      pendingAmount,
      processedAmount,
      todaysWithdrawals,
      todaysAmount: todaysAmount._sum?.amount || 0,
    };
  }

  /**
   * Get user's daily withdrawal count
   */
  async getUserDailyWithdrawalCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.withdrawalRequest.count({
      where: {
        userId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["PENDING", "APPROVED", "PROCESSED"],
        },
      },
    });
  }

  /**
   * Check if user can make withdrawal today
   */
  async canUserWithdrawToday(userId: string): Promise<boolean> {
    const config = await this.getWithdrawalConfig();
    const todaysCount = await this.getUserDailyWithdrawalCount(userId);
    return todaysCount < config.maxDailyWithdrawals;
  }
}

export const withdrawalConfigService = WithdrawalConfigService.getInstance();
