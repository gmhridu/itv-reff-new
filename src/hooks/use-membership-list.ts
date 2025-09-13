import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";

export interface MembershipListItem {
  id: string;
  name: string;
  subtitle?: string | undefined;
  amount: string;
  periodEarnings: number;
  totalEarnings: number;
  avatar: string;
}

export interface MembershipListData {
  membershipList: MembershipListItem[];
  period: string;
  startDate: string;
  total: number;
}

export const MEMBERSHIP_LIST_QUERY_KEYS = {
  all: ["membershipList"] as const,
  lists: () => [...MEMBERSHIP_LIST_QUERY_KEYS.all, "list"] as const,
  list: (type: string, limit: number) =>
    [...MEMBERSHIP_LIST_QUERY_KEYS.lists(), { type, limit }] as const,
};

export function useMembershipList(
  type: "daily" | "weekly" | "monthly" = "weekly",
  limit: number = 10,
) {
  return useQuery({
    queryKey: MEMBERSHIP_LIST_QUERY_KEYS.list(type, limit),
    queryFn: async (): Promise<MembershipListData> => {
      const params = new URLSearchParams({
        type,
        limit: limit.toString(),
      });

      const response = await apiClient.get<MembershipListData>(
        `/api/dashboard/membership-list?${params}`,
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
