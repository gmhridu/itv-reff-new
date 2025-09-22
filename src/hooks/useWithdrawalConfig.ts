"use client";

import { useState, useEffect } from "react";
import { useToast } from "./use-toast";

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

export interface WithdrawalValidation {
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

export interface WithdrawalStats {
  totalWithdrawals: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  processedWithdrawals: number;
  rejectedWithdrawals: number;
  pendingAmount: number;
  processedAmount: number;
  todaysWithdrawals: number;
  todaysAmount: number;
}

export interface UserWithdrawalLimit {
  dailyCount: number;
  maxDailyWithdrawals: number;
  canWithdrawToday: boolean;
  remainingWithdrawals: number;
}

export const useWithdrawalConfig = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<WithdrawalConfig | null>(null);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch withdrawal configuration
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/withdrawal-config");
      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        setStats(data.data.stats);
      } else {
        // Handle admin authentication errors gracefully
        if (response.status === 401) {
          setError("Admin authentication required. Please log in as admin.");
        } else {
          setError(data.error || "Failed to fetch withdrawal configuration");
        }
      }
    } catch (err) {
      console.error("Error fetching withdrawal config:", err);
      setError("Failed to load withdrawal configuration");
    } finally {
      setLoading(false);
    }
  };

  // Update withdrawal configuration
  const updateConfig = async (updates: Partial<WithdrawalConfig>) => {
    try {
      const response = await fetch("/api/admin/withdrawal-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
        toast({
          title: "Configuration Updated",
          description: data.message,
          variant: "default",
        });
        return true;
      } else {
        const errorMessage =
          response.status === 401
            ? "Admin authentication required"
            : data.error || "Failed to update configuration";
        toast({
          title: "Update Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      console.error("Error updating withdrawal config:", err);
      toast({
        title: "Update Error",
        description: "An error occurred while updating the configuration",
        variant: "destructive",
      });
      return false;
    }
  };

  // Validate withdrawal request
  const validateWithdrawal = async (
    userId: string,
    amount: number,
    walletType: "Main Wallet" | "Commission Wallet",
    paymentMethodId: string,
  ): Promise<WithdrawalValidation> => {
    try {
      const response = await fetch(
        "/api/admin/withdrawal-config?action=validate-user-withdrawal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            amount,
            walletType,
            paymentMethodId,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        const errorMessage =
          response.status === 401
            ? "Admin authentication required"
            : data.error || "Validation failed";
        return {
          isValid: false,
          error: errorMessage,
        };
      }
    } catch (err) {
      console.error("Error validating withdrawal:", err);
      return {
        isValid: false,
        error: "Failed to validate withdrawal request",
      };
    }
  };

  // Calculate withdrawal fees and amounts
  const calculateWithdrawal = async (
    amount: number,
    isUsdtWithdrawal: boolean = false,
  ): Promise<WithdrawalCalculation | null> => {
    try {
      const response = await fetch(
        "/api/admin/withdrawal-config?action=calculate-withdrawal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            isUsdtWithdrawal,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        const errorMessage =
          response.status === 401
            ? "Admin authentication required"
            : data.error || "Calculation failed";
        console.error("Calculation failed:", errorMessage);
        return null;
      }
    } catch (err) {
      console.error("Error calculating withdrawal:", err);
      return null;
    }
  };

  // Check user's daily withdrawal limit
  const checkUserDailyLimit = async (
    userId: string,
  ): Promise<UserWithdrawalLimit | null> => {
    try {
      const response = await fetch(
        "/api/admin/withdrawal-config?action=check-user-daily-limit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        const errorMessage =
          response.status === 401
            ? "Admin authentication required"
            : data.error || "Failed to check daily limit";
        console.error("Failed to check daily limit:", errorMessage);
        return null;
      }
    } catch (err) {
      console.error("Error checking user daily limit:", err);
      return null;
    }
  };

  // Client-side validation helpers
  const isAmountValid = (amount: number): boolean => {
    if (!config) return false;
    return (
      amount >= config.minimumWithdrawal &&
      config.predefinedAmounts.includes(amount)
    );
  };

  const getProcessingTime = (isUsdtWithdrawal: boolean): string => {
    if (!config) return "Processing time unavailable";
    return isUsdtWithdrawal
      ? config.usdtProcessingTime
      : config.withdrawalProcessingTime;
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatUsdtAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  // Get fee description for display
  const getFeeDescription = (isUsdtWithdrawal: boolean): string => {
    if (!config) return "";

    if (isUsdtWithdrawal) {
      return config.usdtNetworkFee > 0
        ? `Network fee: ${formatUsdtAmount(config.usdtNetworkFee)} USDT`
        : "No fees";
    } else {
      return `${config.withdrawalFeePercentage}% handling fee`;
    }
  };

  // Refresh configuration and stats
  const refresh = () => {
    fetchConfig();
  };

  // Initialize on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    stats,
    loading,
    error,
    updateConfig,
    validateWithdrawal,
    calculateWithdrawal,
    checkUserDailyLimit,
    isAmountValid,
    getProcessingTime,
    formatAmount,
    formatUsdtAmount,
    getFeeDescription,
    refresh,
  };
};

// Public hook for client-side withdrawal operations (no admin access required)
export const useWithdrawalInfo = () => {
  const [config, setConfig] = useState<Partial<WithdrawalConfig>>({
    minimumWithdrawal: 500,
    predefinedAmounts: [500, 3000, 10000, 30000, 70000, 100000, 250000, 500000],
    withdrawalFeePercentage: 10,
    usdtToPkrRate: 295,
    usdtNetworkFee: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch public withdrawal info (from topup API for rates)
  const fetchPublicInfo = async () => {
    try {
      setLoading(true);

      // Get USDT rate from topup API
      const response = await fetch("/api/user/topup");
      const data = await response.json();

      if (data.success && data.data.usdtToPkrRate) {
        setConfig((prev) => ({
          ...prev,
          usdtToPkrRate: data.data.usdtToPkrRate,
        }));
      }
    } catch (err) {
      console.warn("Failed to fetch public withdrawal info:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate fees for display
  const calculateDisplayFees = (amount: number, isUsdtWithdrawal: boolean) => {
    if (!config.withdrawalFeePercentage || !config.usdtToPkrRate) return null;

    const withdrawalAmount = amount;
    let handlingFee = 0;
    let totalDeduction = withdrawalAmount;
    let usdtAmount;
    let usdtAmountAfterFee;

    if (isUsdtWithdrawal) {
      // USDT: No PKR handling fee
      handlingFee = 0;
      totalDeduction = withdrawalAmount;
      usdtAmount = withdrawalAmount / config.usdtToPkrRate;
      usdtAmountAfterFee = usdtAmount - (config.usdtNetworkFee || 0);
    } else {
      // Bank: Apply handling fee
      handlingFee = withdrawalAmount * (config.withdrawalFeePercentage / 100);
      totalDeduction = withdrawalAmount + handlingFee;
    }

    return {
      withdrawalAmount,
      handlingFee,
      totalDeduction,
      netAmount: withdrawalAmount,
      usdtAmount,
      usdtAmountAfterFee,
      isUsdtWithdrawal,
    };
  };

  useEffect(() => {
    fetchPublicInfo();
  }, []);

  return {
    config,
    loading,
    calculateDisplayFees,
    refresh: fetchPublicInfo,
  };
};
