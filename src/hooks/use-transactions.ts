import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  status: string;
  metadata: any;
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  summary: {
    totalCredits: number;
    totalDebits: number;
    creditCount: number;
    debitCount: number;
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

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export const TRANSACTIONS_QUERY_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTIONS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...TRANSACTIONS_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...TRANSACTIONS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRANSACTIONS_QUERY_KEYS.details(), id] as const,
};

async function fetchTransactions(filters: TransactionFilters = {}): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/wallet/transactions?${params}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch transactions');
  }

  return response.json();
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEYS.list(filters),
    queryFn: () => fetchTransactions(filters),
    staleTime: 1 * 60 * 1000, // 1 minute - transactions change more frequently
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
          title: 'Failed to Load Transactions',
          description: error.message || 'An error occurred while loading your transaction history.',
          variant: 'destructive',
        });
      },
    },
  });
}

// Hook for fetching a single transaction detail
export function useTransactionDetail(transactionId: string) {
  return useQuery({
    queryKey: TRANSACTIONS_QUERY_KEYS.detail(transactionId),
    queryFn: async (): Promise<Transaction> => {
      const response = await fetch(`/api/wallet/transactions/${transactionId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch transaction details');
      }

      const data = await response.json();
      return data.transaction;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!transactionId,
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Hook to prefetch transactions
export function usePrefetchTransactions() {
  const queryClient = useQueryClient();

  return (filters: TransactionFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: TRANSACTIONS_QUERY_KEYS.list(filters),
      queryFn: () => fetchTransactions(filters),
      staleTime: 1 * 60 * 1000,
    });
  };
}

// Hook to get cached transactions data
export function useTransactionsCache(filters: TransactionFilters = {}) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<TransactionsResponse>(TRANSACTIONS_QUERY_KEYS.list(filters));
}

// Hook to manually refetch transactions
export function useRefreshTransactions() {
  const queryClient = useQueryClient();

  return () => {
    return queryClient.invalidateQueries({
      queryKey: TRANSACTIONS_QUERY_KEYS.all,
    });
  };
}

// Hook to get transactions summary without full data
export function useTransactionsSummary() {
  const { data } = useTransactions({ limit: 1 }); // Minimal fetch just for summary
  return data?.summary;
}
