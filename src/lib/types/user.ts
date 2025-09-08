import { User } from '@prisma/client';

// Extended User type that includes the new fields
export interface ExtendedUser extends User {
  fundPassword?: string | null;
  commissionBalance?: number;
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
