"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UploadProgressData {
  sessionId: string;
  progress: number;
  status: string;
  timestamp: string;
}

export interface UploadProgressHook {
  progress: number;
  status: string;
  isConnected: boolean;
  error: string | null;
  startTracking: (sessionId: string) => void;
  stopTracking: () => void;
  updateProgress: (progress: number, status: string) => void;
}

export function useUploadProgress(): UploadProgressHook {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const stopTracking = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    sessionIdRef.current = null;
  }, []);

  const startTracking = useCallback((sessionId: string) => {
    // Stop any existing tracking
    stopTracking();

    sessionIdRef.current = sessionId;
    setError(null);
    setProgress(0);
    setStatus("Connecting...");

    try {
      const eventSource = new EventSource(
        `/api/admin/videos/upload/progress?sessionId=${sessionId}`
      );

      eventSource.onopen = () => {
        setIsConnected(true);
        setStatus("Connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const data: UploadProgressData = JSON.parse(event.data);
          setProgress(data.progress);
          setStatus(data.status);

          // If upload is complete, stop tracking after a short delay
          if (data.progress >= 100 || data.status === "completed") {
            setTimeout(() => {
              stopTracking();
            }, 2000);
          }
        } catch (parseError) {
          console.error("Failed to parse progress data:", parseError);
          setError("Failed to parse progress data");
        }
      };

      eventSource.onerror = (event) => {
        console.error("EventSource error:", event);
        setError("Connection error");
        setIsConnected(false);

        // Try to reconnect after a delay
        setTimeout(() => {
          if (sessionIdRef.current) {
            startTracking(sessionIdRef.current);
          }
        }, 3000);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error("Failed to create EventSource:", err);
      setError("Failed to establish connection");
    }
  }, [stopTracking]);

  const updateProgress = useCallback(async (progress: number, status: string) => {
    if (!sessionIdRef.current) return;

    try {
      // Update local state immediately for better UX
      setProgress(progress);
      setStatus(status);

      // Send update to server
      await fetch("/api/admin/videos/upload/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          progress,
          status,
        }),
      });
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    progress,
    status,
    isConnected,
    error,
    startTracking,
    stopTracking,
    updateProgress,
  };
}

// Alternative hook for simpler progress tracking without SSE
export function useSimpleUploadProgress() {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const startUpload = useCallback((initialStatus: string = "Starting upload...") => {
    setProgress(0);
    setStatus(initialStatus);
    setIsUploading(true);
  }, []);

  const updateProgress = useCallback((progress: number, status?: string) => {
    setProgress(Math.min(Math.max(progress, 0), 100));
    if (status) {
      setStatus(status);
    }
  }, []);

  const completeUpload = useCallback((finalStatus: string = "Upload completed!") => {
    setProgress(100);
    setStatus(finalStatus);
    setIsUploading(false);
  }, []);

  const resetUpload = useCallback(() => {
    setProgress(0);
    setStatus("");
    setIsUploading(false);
  }, []);

  return {
    progress,
    status,
    isUploading,
    startUpload,
    updateProgress,
    completeUpload,
    resetUpload,
  };
}

// Hook for tracking multiple uploads
export function useMultiUploadProgress() {
  const [uploads, setUploads] = useState<Map<string, {
    progress: number;
    status: string;
    isActive: boolean;
  }>>(new Map());

  const addUpload = useCallback((sessionId: string, initialStatus: string = "Starting...") => {
    setUploads(prev => new Map(prev.set(sessionId, {
      progress: 0,
      status: initialStatus,
      isActive: true,
    })));
  }, []);

  const updateUpload = useCallback((sessionId: string, progress: number, status?: string) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(sessionId);
      if (existing) {
        newMap.set(sessionId, {
          ...existing,
          progress: Math.min(Math.max(progress, 0), 100),
          status: status || existing.status,
        });
      }
      return newMap;
    });
  }, []);

  const completeUpload = useCallback((sessionId: string, finalStatus: string = "Completed") => {
    setUploads(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(sessionId);
      if (existing) {
        newMap.set(sessionId, {
          ...existing,
          progress: 100,
          status: finalStatus,
          isActive: false,
        });
      }
      return newMap;
    });

    // Remove completed upload after delay
    setTimeout(() => {
      setUploads(prev => {
        const newMap = new Map(prev);
        newMap.delete(sessionId);
        return newMap;
      });
    }, 5000);
  }, []);

  const removeUpload = useCallback((sessionId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(sessionId);
      return newMap;
    });
  }, []);

  const getUpload = useCallback((sessionId: string) => {
    return uploads.get(sessionId);
  }, [uploads]);

  const getAllUploads = useCallback(() => {
    return Array.from(uploads.entries()).map(([sessionId, data]) => ({
      sessionId,
      ...data,
    }));
  }, [uploads]);

  const getActiveUploads = useCallback(() => {
    return getAllUploads().filter(upload => upload.isActive);
  }, [getAllUploads]);

  return {
    addUpload,
    updateUpload,
    completeUpload,
    removeUpload,
    getUpload,
    getAllUploads,
    getActiveUploads,
  };
}
