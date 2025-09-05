import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface CompletedTask {
  id: string;
  video: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    duration: number;
  };
  completedAt: string;
  rewardEarned: number;
  positionLevel: string | null;
  watchDuration: number;
  isVerified: boolean;
}

export interface CompletedTasksResponse {
  completedTasks: CompletedTask[];
  summary: {
    totalTasks: number;
    totalRewards: number;
    totalWatchTime: number;
    todayTasksCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CompletedTasksFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const COMPLETED_TASKS_QUERY_KEYS = {
  all: ['completed-tasks'] as const,
  lists: () => [...COMPLETED_TASKS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: CompletedTasksFilters) => [...COMPLETED_TASKS_QUERY_KEYS.lists(), { filters }] as const,
};

async function fetchCompletedTasks(filters: CompletedTasksFilters = {}): Promise<CompletedTasksResponse> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/tasks/completed?${params}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch completed tasks');
  }

  return response.json();
}

export function useCompletedTasks(filters: CompletedTasksFilters = {}) {
  return useQuery({
    queryKey: COMPLETED_TASKS_QUERY_KEYS.list(filters),
    queryFn: () => fetchCompletedTasks(filters),
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
    meta: {
      onError: (error: any) => {
        toast({
          title: 'Failed to Load Completed Tasks',
          description: error.message || 'An error occurred while loading your completed tasks.',
          variant: 'destructive',
        });
      },
    },
  });
}

// Hook to prefetch completed tasks
export function usePrefetchCompletedTasks() {
  const queryClient = useQueryClient();

  return (filters: CompletedTasksFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: COMPLETED_TASKS_QUERY_KEYS.list(filters),
      queryFn: () => fetchCompletedTasks(filters),
      staleTime: 2 * 60 * 1000,
    });
  };
}

// Hook to get cached completed tasks data
export function useCompletedTasksCache(filters: CompletedTasksFilters = {}) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<CompletedTasksResponse>(COMPLETED_TASKS_QUERY_KEYS.list(filters));
}

// Hook to manually refetch completed tasks
export function useRefreshCompletedTasks() {
  const queryClient = useQueryClient();

  return () => {
    return queryClient.invalidateQueries({
      queryKey: COMPLETED_TASKS_QUERY_KEYS.all,
    });
  };
}

// Hook to get completed tasks summary without full data
export function useCompletedTasksSummary() {
  const { data } = useCompletedTasks({ limit: 1 }); // Minimal fetch just for summary
  return data?.summary;
}
