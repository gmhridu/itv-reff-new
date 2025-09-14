"use client";

import { useQuery } from "@tanstack/react-query";
import { SliderImage, ApiResponse } from "@/types/admin";

interface UseSliderImagesOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useSliderImages(options: UseSliderImagesOptions = {}) {
  const { enabled = true, refetchInterval } = options;

  return useQuery<SliderImage[], Error>({
    queryKey: ["slider-images"],
    queryFn: async () => {
      const response = await fetch("/api/slider-images");

      if (!response.ok) {
        throw new Error("Failed to fetch slider images");
      }

      const data: ApiResponse<SliderImage[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch slider images");
      }

      return data.data || [];
    },
    enabled,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

// Hook for admin panel with more options
export function useAdminSliderImages(
  filters: {
    isActive?: boolean;
    searchTerm?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { isActive, searchTerm, page = 1, limit = 50 } = filters;

  return useQuery({
    queryKey: ["admin-slider-images", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      if (isActive !== undefined) {
        params.set("isActive", isActive.toString());
      }

      if (searchTerm) {
        params.set("searchTerm", searchTerm);
      }

      const response = await fetch(`/api/admin/slider-images?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch slider images");
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch slider images");
      }

      return data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });
}
