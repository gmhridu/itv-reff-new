"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useVideoDetail,
  useVideoProgress,
  useWatchVideo,
  useVideoProgressPersistence,
} from "@/hooks/use-videos";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerMuteButton,
  VideoPlayerVolumeRange,
  VideoPlayerTimeRange,
  VideoPlayerTimeDisplay,
} from "@/components/ui/kibo-ui/video-player";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface WatchVideoProps {
  videoId: string;
}

const WatchVideo = ({ videoId }: WatchVideoProps) => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: video,
    isLoading: videoLoading,
    error: videoError,
  } = useVideoDetail(videoId);
  const { mutate: submitWatchVideo, isPending: isSubmitting } = useWatchVideo();
  const { saveProgress, loadProgress, clearProgress } =
    useVideoProgressPersistence(videoId);

  const {
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    watchDuration,
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
  } = useVideoProgress(videoId);

  const [isCompleted, setIsCompleted] = useState(false);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentWatchSession, setCurrentWatchSession] = useState<{
    start: number;
    lastUpdate: number;
  } | null>(null);

  // Stable function references using useCallback
  const setCurrentWatchSessionCallback = useCallback(
    (session: { start: number; lastUpdate: number } | null) => {
      setCurrentWatchSession(session);
    },
    [],
  );

  useEffect(() => {
    if (video && !progressLoaded) {
      console.log("Loading video:", {
        title: video.title,
        url: video.url,
        duration: video.duration,
      });

      // Set the duration from video data immediately
      setDuration(video.duration);

      const savedProgress = loadProgress();
      if (savedProgress && videoRef.current) {
        videoRef.current.currentTime = savedProgress.currentTime;
        addInteraction("progress_restored", savedProgress);
      }
      setProgressLoaded(true);
    }
  }, [video, progressLoaded, loadProgress, setDuration, addInteraction]);

  useEffect(() => {
    if (hasStarted && currentTime > 0) {
      const progressData = {
        currentTime,
        watchDuration,
        lastWatched: Date.now(),
      };
      saveProgress(progressData);
    }
  }, [currentTime, watchDuration, hasStarted, saveProgress]);

  // Cleanup intervals on component unmount
  useEffect(() => {
    return () => {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration;
      setDuration(videoDuration);
      addInteraction("video_loaded", { duration: videoDuration });
      console.log("Video loaded:", { duration: videoDuration, src: video.src });

      // Debug log for progress tracking
      console.log("Duration set for progress tracking:", videoDuration);
    };

    const handleLoadedData = () => {
      console.log("Video data loaded, ready to play");
    };

    const handleError = (e: Event) => {
      console.error("Video error:", e);
      setPlaybackError("Failed to load video. Please try again.");
      addInteraction("video_error", { error: e });
    };

    const handleCanPlay = () => {
      console.log("Video can start playing");
    };

    const handleTimeUpdate = () => {
      const videoCurrentTime = video.currentTime;
      setCurrentTime(videoCurrentTime);

      // Update current watch session if playing
      if (isPlaying && currentWatchSession) {
        const now = Date.now();
        const timeDiff = (now - currentWatchSession.lastUpdate) / 1000;

        // Only update if less than 2 seconds have passed (to handle seeks)
        if (timeDiff < 2) {
          setCurrentWatchSessionCallback({
            start: currentWatchSession.start,
            lastUpdate: now,
          });

          // Add this segment to watched segments
          const segmentEnd = videoCurrentTime;
          const segmentStart = Math.max(
            currentWatchSession.start,
            videoCurrentTime - timeDiff,
          );

          if (segmentEnd > segmentStart) {
            setWatchedSegments((prev) => {
              const newSegment = { start: segmentStart, end: segmentEnd };
              const updated = [...prev];

              // Check if this segment overlaps with existing ones
              const overlappingIndex = updated.findIndex(
                (seg) =>
                  newSegment.start <= seg.end && newSegment.end >= seg.start,
              );

              if (overlappingIndex >= 0) {
                // Merge with existing segment
                updated[overlappingIndex] = {
                  start: Math.min(
                    updated[overlappingIndex].start,
                    newSegment.start,
                  ),
                  end: Math.max(updated[overlappingIndex].end, newSegment.end),
                };
              } else {
                // Add new segment
                updated.push(newSegment);
              }

              return updated.sort((a, b) => a.start - b.start);
            });
          }
        } else {
          // Time jump detected (seek), start new session
          setCurrentWatchSessionCallback({
            start: videoCurrentTime,
            lastUpdate: now,
          });
        }
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
      addInteraction("play", { currentTime: video.currentTime });

      // Start new watch session
      setCurrentWatchSessionCallback({
        start: video.currentTime,
        lastUpdate: Date.now(),
      });

      // Clear any existing timer (legacy)
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      addInteraction("pause", { currentTime: video.currentTime });

      // End current watch session
      if (currentWatchSession) {
        const segmentEnd = video.currentTime;
        const segmentStart = currentWatchSession.start;

        if (segmentEnd > segmentStart) {
          setWatchedSegments((prev) => {
            const newSegment = { start: segmentStart, end: segmentEnd };
            const updated = [...prev];

            // Check if this segment overlaps with existing ones
            const overlappingIndex = updated.findIndex(
              (seg) =>
                newSegment.start <= seg.end && newSegment.end >= seg.start,
            );

            if (overlappingIndex >= 0) {
              // Merge with existing segment
              updated[overlappingIndex] = {
                start: Math.min(
                  updated[overlappingIndex].start,
                  newSegment.start,
                ),
                end: Math.max(updated[overlappingIndex].end, newSegment.end),
              };
            } else {
              // Add new segment
              updated.push(newSegment);
            }

            return updated.sort((a, b) => a.start - b.start);
          });
        }

        setCurrentWatchSessionCallback(null);
      }

      // Clear any existing timer (legacy)
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
    };

    const handleSeeked = () => {
      addInteraction("seek", {
        from: currentTime,
        to: video.currentTime,
      });

      // Reset watch session after seek
      if (isPlaying) {
        setCurrentWatchSessionCallback({
          start: video.currentTime,
          lastUpdate: Date.now(),
        });
      }
    };

    const handleVolumeChange = () => {
      addInteraction("volume_change", {
        volume: video.volume,
        muted: video.muted,
      });
    };

    const handleEnded = () => {
      setIsPlaying(false);
      addInteraction("video_ended");

      // End current watch session
      if (currentWatchSession) {
        const segmentEnd = video.duration; // Use full duration for ended videos
        const segmentStart = currentWatchSession.start;

        if (segmentEnd > segmentStart) {
          setWatchedSegments((prev) => {
            const newSegment = { start: segmentStart, end: segmentEnd };
            const updated = [...prev];

            // Check if this segment overlaps with existing ones
            const overlappingIndex = updated.findIndex(
              (seg) =>
                newSegment.start <= seg.end && newSegment.end >= seg.start,
            );

            if (overlappingIndex >= 0) {
              // Merge with existing segment
              updated[overlappingIndex] = {
                start: Math.min(
                  updated[overlappingIndex].start,
                  newSegment.start,
                ),
                end: Math.max(updated[overlappingIndex].end, newSegment.end),
              };
            } else {
              // Add new segment
              updated.push(newSegment);
            }

            return updated.sort((a, b) => a.start - b.start);
          });
        }

        setCurrentWatchSessionCallback(null);
      }

      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("ended", handleEnded);

      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
      }
    };
  }, [
    addInteraction,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setHasStarted,
    setWatchDuration,
    setWatchedSegments,
    setCurrentWatchSessionCallback,
  ]);

  // Debug effect to log progress updates (throttled)
  useEffect(() => {
    const throttledLog = setTimeout(() => {
      console.log("Progress Update:", {
        watchPercentage: Math.round(watchPercentage),
        canComplete,
        watchedSegments: watchedSegments.length,
        duration,
        currentTime: Math.round(currentTime),
        isPlaying,
      });
    }, 1000);

    return () => clearTimeout(throttledLog);
  }, [
    Math.floor(watchPercentage / 5) * 5, // Only log every 5% change
    canComplete,
    watchedSegments.length,
    Math.floor(currentTime / 5) * 5, // Only log every 5 second change
  ]);

  useEffect(() => {
    if (
      watchPercentage >= minimumWatchPercentage &&
      !isCompleted &&
      canComplete
    ) {
      const progress = Math.floor(watchPercentage);
      if (progress > lastSavedProgress && progress % 10 === 0) {
        setLastSavedProgress(progress);
        addInteraction("progress_milestone", { progress });
      }
    }
  }, [
    watchPercentage,
    minimumWatchPercentage,
    isCompleted,
    canComplete,
    lastSavedProgress,
    addInteraction,
  ]);

  const handleCompleteVideo = () => {
    if (!video || !canComplete) return;

    const actualWatchTime = Math.floor(watchDuration);
    const watchData = {
      watchDuration: actualWatchTime,
      verificationData: {
        progressPercentage,
        watchPercentage,
        hasStarted,
        currentTime,
        duration,
        minimumWatchTime: duration * 0.8,
      },
      userInteractions,
    };

    console.log("Submitting video completion:", {
      watchData,
      watchedSegments: watchedSegments.length,
      calculatedWatchDuration: actualWatchTime,
      videoId,
    });

    submitWatchVideo(
      { videoId, data: watchData },
      {
        onSuccess: (data) => {
          console.log("Video completion successful:", data);
          setIsCompleted(true);
          addInteraction("video_completed");
          clearProgress(); // Clear saved progress after successful completion

          if (watchTimerRef.current) {
            clearInterval(watchTimerRef.current);
            watchTimerRef.current = null;
          }

          // Redirect to task after a short delay to show success message
          setTimeout(() => {
            router.push("/task");
          }, 2000);
        },
        onError: (error) => {
          console.error("Video completion failed:", error);
          // Don't clear progress on error so user can retry
        },
      },
    );
  };

  const handleGoBack = () => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
    }
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (videoLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Skeleton className="h-8 w-32" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (videoError || !video) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={handleGoBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {videoError?.message || "Video not found or no longer available."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={handleGoBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Videos
          </Button>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Video Completed!</CardTitle>
              <CardDescription>
                Congratulations! You have successfully watched the video and
                earned your reward. Redirecting to dashboard in a moment...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${video.rewardAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-600">Reward Earned</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(watchPercentage)}%
                  </div>
                  <div className="text-sm text-green-600">Watch Progress</div>
                </div>
              </div>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{video.title}</CardTitle>
                {video.description && (
                  <CardDescription>{video.description}</CardDescription>
                )}
              </div>
              <Badge variant="secondary" className="ml-4">
                <DollarSign className="h-3 w-3 mr-1" />$
                {video.rewardAmount.toFixed(2)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="relative w-full mb-6 bg-black rounded-lg overflow-hidden"
              style={{ aspectRatio: "16/9" }}
            >
              {playbackError ? (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                    <p className="text-lg mb-2">Video Playback Error</p>
                    <p className="text-sm text-gray-300">{playbackError}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setPlaybackError(null);
                        if (videoRef.current) {
                          videoRef.current.load();
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                // All videos use the unified VideoPlayer component
                <VideoPlayer className="w-full h-full">
                  <VideoPlayerContent
                    ref={videoRef}
                    src={video.url}
                    poster={video.thumbnailUrl || undefined}
                    className="w-full h-full object-contain"
                    slot="media"
                    preload="metadata"
                    playsInline
                  />
                  <VideoPlayerControlBar slot="">
                    <VideoPlayerPlayButton />
                    <VideoPlayerSeekBackwardButton />
                    <VideoPlayerSeekForwardButton />
                    <VideoPlayerTimeDisplay showDuration />
                    <VideoPlayerTimeRange />
                    <VideoPlayerMuteButton />
                    <VideoPlayerVolumeRange />
                  </VideoPlayerControlBar>
                </VideoPlayer>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Watch Progress: {Math.round(watchPercentage)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">
                    {canComplete
                      ? "Ready to complete!"
                      : `${minimumWatchPercentage}% required`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Watch Progress</span>
                  <span>
                    {Math.round(watchPercentage)}% / {minimumWatchPercentage}%
                  </span>
                </div>
                <Progress
                  value={Math.min(watchPercentage, 100)}
                  className="h-2"
                />
                <div className="text-xs text-gray-500">
                  {canComplete
                    ? "You can now complete this video to earn your reward!"
                    : `Watch ${Math.round(minimumWatchPercentage - watchPercentage)}% more to complete`}
                </div>
                {/* Debug info - remove in production */}
                <div className="text-xs text-gray-400 mt-1">
                  Debug: Watch {Math.round(watchPercentage)}% / Duration{" "}
                  {duration}s | Segments: {watchedSegments.length} | Current:{" "}
                  {Math.round(currentTime)}s
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCompleteVideo}
                  disabled={!canComplete || isSubmitting}
                  className="min-w-32"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Video
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WatchVideo;
