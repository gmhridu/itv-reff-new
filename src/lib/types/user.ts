import { User } from "@prisma/client";

// Security Refund Request types
export interface SecurityRefundRequest {
  id: string;
  userId: string;
  fromLevel: number;
  toLevel: number;
  refundAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestNote?: string | null;
  adminNotes?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Extended User type that includes the new fields
export interface ExtendedUser extends User {
  securityRefundRequests?: SecurityRefundRequest[];
}

// Type for user with wallet balances
export interface UserWithBalances {
  id: string;
  walletBalance: number;
  commissionBalance: number;
  totalEarnings: number;
  fundPassword?: string | null;
}

// Type for fund password operations
export interface UserWithFundPassword {
  id: string;
  fundPassword?: string | null;
}

// Type for withdrawal operations
export interface UserWithWalletData {
  id: string;
  walletBalance: number;
  commissionBalance: number;
  fundPassword?: string | null;
}

// Type for security refund operations
export interface SecurityRefundData {
  hasUpgraded: boolean;
  canRequestRefund: boolean;
  currentLevel: number;
  currentLevelName: string;
  previousLevelDeposit: number;
  securityDeposited: number;
  refundRequests: SecurityRefundRequest[];
}

// Type for earnings data with security refunds
export interface EarningsWithSecurity {
  summary: {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
  };
  breakdown: {
    dailyTaskCommission: number;
    referralInviteCommission: {
      level1: number;
      level2: number;
      level3: number;
      total: number;
    };
    referralTaskCommission: {
      level1: number;
      level2: number;
      level3: number;
      total: number;
    };
    topupBonus: number;
    specialCommission: number;
    totalEarning: number;
  };
  security: {
    totalRefunds: number;
    refundHistory: SecurityRefundRequest[];
  };
  wallet: {
    mainWallet: number;
    commissionWallet: number;
    totalAvailableForWithdrawal: number;
  };
}
