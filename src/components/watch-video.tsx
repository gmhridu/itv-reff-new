"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useVideoDetail, useWatchVideo } from "@/hooks/use-videos";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
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

  // Video tracking states
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [actualWatchTime, setActualWatchTime] = useState(0);
  const [lastVideoTime, setLastVideoTime] = useState(0);
  const [userInteractions, setUserInteractions] = useState<any[]>([]);

  // Minimum watch time (10 seconds)
  const MINIMUM_WATCH_TIME = 10;

  // Track actual video watch time based on video currentTime
  useEffect(() => {
    if (actualWatchTime >= MINIMUM_WATCH_TIME && !canComplete) {
      setCanComplete(true);
      console.log(
        "Video can now be completed - 10 seconds of actual playback watched!",
      );
    }
  }, [actualWatchTime, canComplete]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (watchTimerRef.current) {
        clearInterval(watchTimerRef.current);
        watchTimerRef.current = null;
      }
    };
  }, []);

  // HTML5 Video event handlers
  const handlePlay = () => {
    console.log("Video started playing");
    setIsPlaying(true);
    if (!hasStartedPlaying) {
      setHasStartedPlaying(true);
      console.log("Video play detected - started tracking watch time");
    }

    // Track play interaction
    setUserInteractions((prev) => [
      ...prev,
      {
        type: "play",
        timestamp: Date.now(),
        videoTime: videoRef.current?.currentTime || 0,
      },
    ]);
  };

  const handlePause = () => {
    console.log("Video paused");
    setIsPlaying(false);

    // Track pause interaction
    setUserInteractions((prev) => [
      ...prev,
      {
        type: "pause",
        timestamp: Date.now(),
        videoTime: videoRef.current?.currentTime || 0,
      },
    ]);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      console.log("Video duration:", videoDuration);
      setDuration(videoDuration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && isPlaying) {
      const currentTime = videoRef.current.currentTime;

      // Track actual watch time by comparing with last known time
      if (lastVideoTime > 0 && currentTime > lastVideoTime) {
        const timeDiff = currentTime - lastVideoTime;
        // Only count if the difference is reasonable (no huge jumps from seeking)
        if (timeDiff > 0 && timeDiff <= 2) {
          setActualWatchTime((prev) => {
            const newTime = prev + timeDiff;
            console.log(`Actual watch time: ${newTime.toFixed(1)}s`);
            return newTime;
          });
        }
      }

      setLastVideoTime(currentTime);

      // Track user interaction
      setUserInteractions((prev) => [
        ...prev,
        {
          type: "timeupdate",
          timestamp: Date.now(),
          videoTime: currentTime,
        },
      ]);
    }
  };

  const handleError = (error: any) => {
    console.error("Video player error:", error);
  };

  const handleCompleteVideo = () => {
    if (!video || !canComplete || video.isCompleted) return;

    const watchData = {
      watchDuration: Math.floor(actualWatchTime),
      hasStarted: hasStartedPlaying,
      completedAt: new Date().toISOString(),
      minimumWatchTimeMet: actualWatchTime >= MINIMUM_WATCH_TIME,
      verificationData: {
        duration: duration,
        watchPercentage: duration > 0 ? (actualWatchTime / duration) * 100 : 0,
        actualWatchTime: actualWatchTime,
      },
      userInteractions: userInteractions,
    };

    console.log("Submitting video completion:", {
      videoId,
      actualWatchTime: actualWatchTime,
      watchedSeconds: Math.floor(actualWatchTime),
      minimumRequired: MINIMUM_WATCH_TIME,
      verificationData: watchData.verificationData,
    });

    submitWatchVideo(
      { videoId, data: watchData },
      {
        onSuccess: (data) => {
          console.log("Video completion successful:", data);
          setIsCompleted(true);

          // Clear timer
          if (watchTimerRef.current) {
            clearInterval(watchTimerRef.current);
            watchTimerRef.current = null;
          }

          // Redirect to tasks after a short delay
          setTimeout(() => {
            router.push("/task");
          }, 2000);
        },
        onError: (error) => {
          console.error("Video completion failed:", error);
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

  if (videoLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={handleGoBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="text-center mt-4">
                <p className="text-gray-600">Loading video...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (videoError || !video) {
    const errorMessage =
      videoError?.message || "Video not found or no longer available.";
    const isNetworkError =
      errorMessage.includes("network") || errorMessage.includes("timeout");

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={handleGoBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">
                {isNetworkError ? "Connection Error" : "Video Not Available"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              {isNetworkError && (
                <div className="text-center">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="mr-2"
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button onClick={handleGoBack}>Go Back</Button>
                </div>
              )}
            </CardContent>
          </Card>
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
                earned your reward. Redirecting to tasks...
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
                    {Math.floor(actualWatchTime)}s
                  </div>
                  <div className="text-sm text-green-600">Time Watched</div>
                </div>
              </div>
              <Button onClick={() => router.push("/task")} className="w-full">
                Go to Tasks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  console.log("Playing video:", { url: video.url });

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
              <video
                ref={videoRef}
                src={video.url}
                controls
                className="w-full h-full object-contain rounded-lg"
                onPlay={handlePlay}
                onPause={handlePause}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onError={handleError}
                style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                {canComplete ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 animate-pulse" />
                )}
                <span className="text-lg font-medium">
                  {canComplete
                    ? "Ready to complete!"
                    : hasStartedPlaying
                      ? `${Math.max(0, MINIMUM_WATCH_TIME - Math.floor(actualWatchTime)).toFixed(0)}s remaining`
                      : "Click play to start watching"}
                </span>
              </div>

              <div className="flex justify-center">
                {video.isCompleted ? (
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        Video Already Completed
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      You earned ${video.rewardEarned?.toFixed(2) || "0.00"} on{" "}
                      {video.completedAt
                        ? new Date(video.completedAt).toLocaleDateString()
                        : "a previous date"}
                    </p>
                    <Button
                      onClick={() => router.push("/task")}
                      className="mt-4"
                    >
                      Go to Tasks
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleCompleteVideo}
                    disabled={!canComplete || isSubmitting}
                    size="lg"
                    className="min-w-48"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Video & Earn Reward
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WatchVideo;
