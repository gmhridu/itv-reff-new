"use client";

import { useEffect, useState, useCallback } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  commissionBalance: number;
  referralCode?: string;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalReferralEarnings: number;
  referralCommissionEarnings: number;
  bonusEarnings: number;
  monthlyReferrals: number;
  topReferrals: Array<{
    id: string;
    name: string;
    earnings: number;
    joinedAt: string;
  }>;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    level: string;
    earnings: number;
    balance: number;
    joinedAt: string;
    isActive: boolean;
  }>;
  stats?: {
    totalReferrals: number;
    registeredReferrals: number;
    qualifiedReferrals: number;
    rewardedReferrals: number;
    totalEarnings: number;
    monthlyReferrals: number;
    activities: Array<any>;
  };
}

interface UseReferralDataReturn {
  userData: UserData | null;
  referralData: ReferralData | null;
  referralStats: ReferralStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  copyToClipboard: (text: string) => Promise<boolean>;
  shareReferralLink: () => Promise<void>;
}

export function useReferralData(): UseReferralDataReturn {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        return data;
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load user data");
      return null;
    }
  };

  const fetchReferralData = async () => {
    try {
      const response = await fetch("/api/referral/code");
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
        return data;
      } else {
        throw new Error("Failed to fetch referral code");
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      setError("Failed to load referral code");
      return null;
    }
  };

  const fetchReferralStats = async () => {
    try {
      const response = await fetch("/api/referral/stats");
      if (response.ok) {
        const data = await response.json();

        // Transform the API response to match the expected structure
        const stats: ReferralStats = {
          totalReferrals: data.totalReferrals || 0,
          activeReferrals: data.activeReferrals || 0,
          totalReferralEarnings: data.totalReferralEarnings || 0,
          referralCommissionEarnings: data.referralCommissionEarnings || 0,
          bonusEarnings: data.bonusEarnings || 0,
          monthlyReferrals: data.monthlyReferrals || 0,
          topReferrals: data.topReferrals || [],
          referrals: data.referrals || [],
          stats: data.stats,
        };

        setReferralStats(stats);
        return stats;
      } else {
        throw new Error("Failed to fetch referral stats");
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      setError("Failed to load referral statistics");
      return null;
    }
  };

  const refetch = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchUserData(),
        fetchReferralData(),
        fetchReferralStats()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        textArea.remove();
        return result;
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  };

  const shareReferralLink = async () => {
    if (!referralData) return;

    const shareData = {
      title: "Join ICL FINANCE Rewards",
      text: `Join ICL FINANCE and earn rewards! Use my referral code: ${referralData.referralCode}`,
      url: referralData.referralLink,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying the link
        const success = await copyToClipboard(referralData.referralLink);
        if (success) {
          // You might want to show a toast notification here
          console.log("Referral link copied to clipboard");
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error sharing:", error);
        // Fallback to copying
        await copyToClipboard(referralData.referralLink);
      }
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    userData,
    referralData,
    referralStats,
    loading,
    error,
    refetch,
    copyToClipboard,
    shareReferralLink,
  };
}

// Helper function to format commission percentages
export function getCommissionRates(level: string, type: 'invite' | 'task'): string {
  const rates = {
    invite: {
      A: '10%',
      B: '3%',
      C: '1%',
      '1': '10%',
      '2': '3%',
      '3': '1%',
    },
    task: {
      A: '8%',
      B: '3%',
      C: '1%',
      '1': '8%',
      '2': '3%',
      '3': '1%',
    }
  };

  const levelKey = level.replace('_LEVEL', '').replace('LEVEL_', '');
  return rates[type][levelKey as keyof typeof rates.invite] || '0%';
}

// Helper function to calculate potential earnings
export function calculatePotentialEarnings(
  referralCount: number,
  averageSubscriptionAmount: number = 50000,
  averageDailyTaskEarnings: number = 2000
): {
  inviteCommission: number;
  monthlyTaskBonus: number;
  totalMonthly: number;
} {
  // Assuming a simple 3-level structure where each person refers 3 others
  const levelA = referralCount;
  const levelB = Math.floor(referralCount * 0.3); // Assuming 30% of level A refers others
  const levelC = Math.floor(levelB * 0.3); // Assuming 30% of level B refers others

  // Invite commission (one-time)
  const inviteCommission =
    (levelA * averageSubscriptionAmount * 0.10) + // 10% from direct
    (levelB * averageSubscriptionAmount * 0.03) + // 3% from level B
    (levelC * averageSubscriptionAmount * 0.01);  // 1% from level C

  // Task bonus (assuming 20 days of 100% completion per month)
  const dailyTaskBonus =
    (levelA * averageDailyTaskEarnings * 0.08) + // 8% from direct
    (levelB * averageDailyTaskEarnings * 0.03) + // 3% from level B
    (levelC * averageDailyTaskEarnings * 0.01);  // 1% from level C

  const monthlyTaskBonus = dailyTaskBonus * 20; // 20 working days

  return {
    inviteCommission,
    monthlyTaskBonus,
    totalMonthly: inviteCommission + monthlyTaskBonus
  };
}
