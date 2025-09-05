"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserManagement,
  UserFilters,
  PaginatedUsers,
  UserStatus,
  ApiResponse,
} from "@/types/admin";

interface UseUserManagementParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: UserFilters;
  autoFetch?: boolean;
}

interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  internsCount: number;
  paidPositionsCount: number;
  averageBalance: number;
  totalEarnings: number;
}

interface UseUserManagementReturn {
  // Data
  data: PaginatedUsers | null;
  statistics: UserStatistics | null;
  loading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  updateUserStatus: (userId: string, status: UserStatus, adminNotes?: string) => Promise<boolean>;
  updateUser: (userId: string, updateData: Partial<UserManagement>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;

  // Pagination
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Filtering
  setFilters: (filters: UserFilters) => void;
  setSorting: (sortBy: string, sortOrder: "asc" | "desc") => void;
  setSearchTerm: (term: string) => void;
}

export function useUserManagement({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  filters = {},
  autoFetch = true,
}: UseUserManagementParams = {}): UseUserManagementReturn {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Internal state for pagination and filtering
  const [currentPage, setCurrentPage] = useState(page);
  const [currentLimit, setCurrentLimit] = useState(limit);
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [currentSortOrder, setCurrentSortOrder] = useState(sortOrder);
  const [currentFilters, setCurrentFilters] = useState(filters);

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    params.append("page", currentPage.toString());
    params.append("limit", currentLimit.toString());
    params.append("sortBy", currentSortBy);
    params.append("sortOrder", currentSortOrder);

    if (currentFilters.status) {
      params.append("status", currentFilters.status);
    }

    if (currentFilters.positionLevel) {
      params.append("positionLevel", currentFilters.positionLevel);
    }

    if (currentFilters.dateFrom) {
      params.append("dateFrom", currentFilters.dateFrom.toISOString());
    }

    if (currentFilters.dateTo) {
      params.append("dateTo", currentFilters.dateTo.toISOString());
    }

    if (currentFilters.searchTerm) {
      params.append("searchTerm", currentFilters.searchTerm);
    }

    if (currentFilters.isIntern !== undefined) {
      params.append("isIntern", currentFilters.isIntern.toString());
    }

    if (currentFilters.hasReferrals) {
      params.append("hasReferrals", "true");
    }

    return params;
  }, [currentPage, currentLimit, currentSortBy, currentSortOrder, currentFilters]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = buildQueryParams();
      const response = await fetch(`/api/admin/users?${params.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Users API error response:", errorText);

        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }

        throw new Error(errorMessage);
      }

      const result: ApiResponse<PaginatedUsers> = await response.json();

      if (!result.success) {
        throw new Error(result.error || result.message || "Failed to fetch users");
      }

      setData(result.data || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Users fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users/statistics");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<UserStatistics> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch statistics");
      }

      setStatistics(result.data || null);
    } catch (err) {
      console.error("Statistics fetch error:", err);
      // Don't set error state for statistics as it's secondary data
    }
  }, []);

  const updateUserStatus = useCallback(async (
    userId: string,
    status: UserStatus,
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update user status");
      }

      // Refresh data after successful update
      await fetchUsers();
      await fetchStatistics();

      return true;
    } catch (err) {
      console.error("Update user status error:", err);
      setError(err instanceof Error ? err.message : "Failed to update user status");
      return false;
    }
  }, [fetchUsers, fetchStatistics]);

  const updateUser = useCallback(async (
    userId: string,
    updateData: Partial<UserManagement>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update user");
      }

      // Refresh data after successful update
      await fetchUsers();
      await fetchStatistics();

      return true;
    } catch (err) {
      console.error("Update user error:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
      return false;
    }
  }, [fetchUsers, fetchStatistics]);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete user");
      }

      // Refresh data after successful deletion
      await fetchUsers();
      await fetchStatistics();

      return true;
    } catch (err) {
      console.error("Delete user error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
      return false;
    }
  }, [fetchUsers, fetchStatistics]);

  // Pagination controls
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setCurrentLimit(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Filtering controls
  const setFilters = useCallback((filters: UserFilters) => {
    setCurrentFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const setSorting = useCallback((sortBy: string, sortOrder: "asc" | "desc") => {
    setCurrentSortBy(sortBy);
    setCurrentSortOrder(sortOrder);
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setCurrentFilters(prev => ({
      ...prev,
      searchTerm: term || undefined,
    }));
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  // Auto fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch) {
      fetchUsers();
    }
  }, [autoFetch, fetchUsers]);

  // Fetch statistics on mount
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchUsers(), fetchStatistics()]);
  }, [fetchUsers, fetchStatistics]);

  return {
    // Data
    data,
    statistics,
    loading,
    error,

    // Actions
    refetch,
    fetchStatistics,
    updateUserStatus,
    updateUser,
    deleteUser,

    // Pagination
    goToPage,
    setPageSize,

    // Filtering
    setFilters,
    setSorting,
    setSearchTerm,
  };
}
