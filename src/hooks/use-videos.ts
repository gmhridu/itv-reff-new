import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  videosApi,
  type VideosResponse,
  type WatchVideoRequest,
  type WatchVideoResponse,
  type Video,
} from "@/lib/api/client";
import { toast } from "@/hooks/use-toast";
import { DASHBOARD_QUERY_KEYS } from "@/hooks/use-dashboard";

export const VIDEO_QUERY_KEYS = {
  all: ["videos"] as const,
  lists: () => [...VIDEO_QUERY_KEYS.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...VIDEO_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...VIDEO_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...VIDEO_QUERY_KEYS.details(), id] as const,
  progress: () => [...VIDEO_QUERY_KEYS.all, "progress"] as const,
  videoProgress: (id: string) => [...VIDEO_QUERY_KEYS.progress(), id] as const,
};

export function useVideos() {
  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.lists(),
    queryFn: videosApi.getVideos,
    staleTime: 2 * 60 * 1000, // 2 minutes - videos don't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes to check for new videos
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useWatchVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      videoId,
      data,
    }: {
      videoId: string;
      data: WatchVideoRequest;
    }) => videosApi.watchVideo(videoId, data),
    onSuccess: (data: WatchVideoResponse, variables) => {
      // Show success message
      toast({
        title: "Video Watched Successfully!",
        description: `You earned PKR${data.reward?.toFixed(2) || "0.00"}. ${data.tasksRemaining || 0} tasks remaining today.`,
        variant: "default",
      });

      // Invalidate and refetch videos to get updated list
      queryClient.invalidateQueries({
        queryKey: VIDEO_QUERY_KEYS.lists(),
      });

      // Invalidate dashboard data using correct query keys
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.all,
      });

      // Invalidate wallet/balance data if it exists
      queryClient.invalidateQueries({
        queryKey: ["wallet"],
      });

      // Force refetch of dashboard data to ensure immediate updates
      queryClient.refetchQueries({
        queryKey: DASHBOARD_QUERY_KEYS.data(),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Watch Video",
        description:
          error.message ||
          "An error occurred while processing your video watch.",
        variant: "destructive",
      });
    },
  });
}

// Hook for prefetching videos (useful for preloading)
export function usePrefetchVideos() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: VIDEO_QUERY_KEYS.lists(),
      queryFn: videosApi.getVideos,
      staleTime: 2 * 60 * 1000,
    });
  };
}

// Hook to get cached videos data without triggering a request
export function useVideosCache() {
  const queryClient = useQueryClient();

  return queryClient.getQueryData<VideosResponse>(VIDEO_QUERY_KEYS.lists());
}

// Hook to manually refetch videos
export function useRefreshVideos() {
  const queryClient = useQueryClient();

  return () => {
    return queryClient.invalidateQueries({
      queryKey: VIDEO_QUERY_KEYS.lists(),
    });
  };
}

// Hook to get individual video details by ID
export function useVideoDetail(videoId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: VIDEO_QUERY_KEYS.detail(videoId),
    queryFn: async (): Promise<Video | null> => {
      // First try to get from cache
      const cachedVideos = queryClient.getQueryData<VideosResponse>(
        VIDEO_QUERY_KEYS.lists(),
      );

      if (cachedVideos?.videos) {
        const video = cachedVideos.videos.find((v) => v.id === videoId);
        if (video) return video;
      }

      // If not in cache, fetch from API
      return await videosApi.getVideoById(videoId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!videoId,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication or not found errors
      if (
        error?.status === 401 ||
        error?.status === 403 ||
        error?.status === 404
      ) {
        return false;
      }
      // Retry network errors and server errors up to 3 times
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
}

// Hook for video progress tracking
export function useVideoProgress(videoId: string) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchDuration, setWatchDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [userInteractions, setUserInteractions] = useState<any[]>([]);
  const [watchedSegments, setWatchedSegments] = useState<
    Array<{ start: number; end: number }>
  >([]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Calculate actual watch time and percentage based on unique watched segments
  const calculateWatchStats = () => {
    if (duration <= 0) return { watchTime: 0, watchPercentage: 0 };

    // Merge overlapping segments and calculate total watched time
    const mergedSegments = watchedSegments.reduce(
      (acc, segment) => {
        if (acc.length === 0) return [segment];

        const lastSegment = acc[acc.length - 1];
        if (segment.start <= lastSegment.end) {
          // Overlapping segments, merge them
          lastSegment.end = Math.max(lastSegment.end, segment.end);
        } else {
          // Non-overlapping segment
          acc.push(segment);
        }
        return acc;
      },
      [] as Array<{ start: number; end: number }>,
    );

    const totalWatchedTime = mergedSegments.reduce((total, segment) => {
      return total + (segment.end - segment.start);
    }, 0);

    return {
      watchTime: totalWatchedTime,
      watchPercentage: Math.min((totalWatchedTime / duration) * 100, 100),
    };
  };

  const { watchTime, watchPercentage } = calculateWatchStats();

  // Update legacy watchDuration to match actual watched time
  const actualWatchDuration = Math.floor(watchTime);

  const minimumWatchPercentage = 80;
  const canComplete = watchPercentage >= minimumWatchPercentage;

  const addInteraction = (type: string, data?: any) => {
    const interaction = {
      type,
      timestamp: Date.now(),
      currentTime,
      data,
    };
    setUserInteractions((prev) => [...prev, interaction]);
  };

  const resetProgress = () => {
    setCurrentTime(0);
    setWatchDuration(0);
    setIsPlaying(false);
    setHasStarted(false);
    setUserInteractions([]);
    setWatchedSegments([]);
  };

  return {
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    watchDuration: actualWatchDuration,
    setWatchDuration,
    isPlaying,
    setIsPlaying,
    hasStarted,
    setHasStarted,
    userInteractions,
    addInteraction,
    progressPercentage,
    watchPercentage,
    canComplete,
    minimumWatchPercentage,
    resetProgress,
    watchedSegments,
    setWatchedSegments,
  };
}

// Hook for persisting video progress to localStorage
export function useVideoProgressPersistence(videoId: string) {
  const getStorageKey = (id: string) => `video_progress_${id}`;

  const saveProgress = (progress: {
    currentTime: number;
    watchDuration: number;
    lastWatched: number;
  }) => {
    try {
      localStorage.setItem(getStorageKey(videoId), JSON.stringify(progress));
    } catch (error) {
      console.warn("Failed to save video progress:", error);
    }
  };

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(getStorageKey(videoId));
      if (saved) {
        const progress = JSON.parse(saved);
        const isRecent =
          Date.now() - progress.lastWatched < 24 * 60 * 60 * 1000; // 24 hours
        return isRecent ? progress : null;
      }
    } catch (error) {
      console.warn("Failed to load video progress:", error);
    }
    return null;
  };

  const clearProgress = () => {
    try {
      localStorage.removeItem(getStorageKey(videoId));
    } catch (error) {
      console.warn("Failed to clear video progress:", error);
    }
  };

  return {
    saveProgress,
    loadProgress,
    clearProgress,
  };
}
