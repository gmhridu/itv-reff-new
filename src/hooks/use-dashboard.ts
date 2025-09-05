import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export interface DashboardData {
  user: {
    id: string;
    email: string;
    name: string;
    walletBalance: number;
    totalEarnings: number;
    referralCode: string;
  };
  todayProgress: {
    videosWatched: number;
    dailyLimit: number;
    earningsToday: number;
  };
  recentTransactions: Array<{
    id: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    description: string;
    createdAt: string;
  }>;
  referralStats?: {
    totalReferrals: number;
    referralEarnings: number;
  };
}

export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'] as const,
  data: () => [...DASHBOARD_QUERY_KEYS.all, 'data'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.data(),
    queryFn: async (): Promise<DashboardData> => {
      const response = await apiClient.get<DashboardData>('/api/dashboard');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
