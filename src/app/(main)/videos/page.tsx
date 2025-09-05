'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { authFetch } from '@/lib/auth-error-handler';
import {
  Play,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  rewardAmount: number;
}

interface VideosResponse {
  videos: Video[];
  dailyLimit: number;
  videosWatched: number;
  canWatchMore: boolean;
}

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [videosWatched, setVideosWatched] = useState(0);
  const [canWatchMore, setCanWatchMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await authFetch('/api/videos');
      if (response.ok) {
        const data: VideosResponse = await response.json();
        setVideos(data.videos);
        setDailyLimit(data.dailyLimit);
        setVideosWatched(data.videosWatched);
        setCanWatchMore(data.canWatchMore);
      } else {
        // Auth errors are handled by authFetch automatically
        console.error('Failed to fetch videos:', response.status);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Auth errors are handled by authFetch automatically
    } finally {
      setLoading(false);
    }
  };

  const startWatching = (video: Video) => {
    setCurrentVideo(video);
    setIsWatching(true);
    setWatchProgress(0);
    setWatchTime(0);
  };

  const stopWatching = () => {
    if (currentVideo) {
      setCurrentVideo(null);
      setIsWatching(false);
      setWatchProgress(0);
      setWatchTime(0);
    }
  };

  const completeVideo = async () => {
    if (!currentVideo) return;

    try {
      const response = await fetch(`/api/videos/${currentVideo.id}/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchDuration: watchTime,
          verificationData: {
            progress: watchProgress,
            completed: true
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Mark video as completed
        setCompletedVideos(prev => new Set(prev).add(currentVideo.id));

        // Remove completed video from list
        setVideos(prev => prev.filter(v => v.id !== currentVideo.id));
        setVideosWatched(prev => prev + 1);

        alert(`Video completed! Earned $${data.rewardEarned.toFixed(2)}`);
        stopWatching();

        // Check if daily limit reached
        if (data.videosWatchedToday >= data.dailyLimit) {
          setCanWatchMore(false);
        }
      } else {
        alert(data.error || 'Failed to complete video');
      }
    } catch (error) {
      console.error('Complete video error:', error);
      alert('Failed to complete video');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate video watching progress
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isWatching && currentVideo) {
      interval = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          const progress = (newTime / currentVideo.duration) * 100;
          setWatchProgress(Math.min(progress, 100));

          // Auto-complete when 80% watched
          if (progress >= 80) {
            completeVideo();
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, currentVideo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (!canWatchMore) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-green-600 text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Daily Goal Completed!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Congratulations! You've completed all {dailyLimit} videos for today.
            </p>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Today's Progress</span>
                <span className="text-2xl font-bold text-green-600">{videosWatched}/{dailyLimit}</span>
              </div>
              <Progress value={100} className="h-3" />
            </div>
            <p className="text-gray-500 mb-6">
              Come back tomorrow for more videos and rewards.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentVideo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={stopWatching}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Videos
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{currentVideo.title}</CardTitle>
              <CardDescription>{currentVideo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Video Player Placeholder */}
              <div className="aspect-video bg-black rounded-lg mb-6 flex items-center justify-center relative">
                <div className="text-white text-center">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Video Player</p>
                  <p className="text-sm opacity-75">{currentVideo.title}</p>
                </div>

                {/* Progress overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center justify-between text-white text-sm mb-2">
                    <span>{formatTime(watchTime)}</span>
                    <span>{formatDuration(currentVideo.duration)}</span>
                  </div>
                  <Progress value={watchProgress} className="h-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(watchTime)}
                  </div>
                  <div className="text-sm text-gray-600">Watch Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${currentVideo.rewardAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Reward</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(watchProgress)}%
                  </div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {watchProgress >= 80 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="text-sm">
                    {watchProgress >= 80
                      ? 'Ready to complete!'
                      : `Watch ${Math.ceil((currentVideo.duration * 0.8 - watchTime) / 60)} more minutes to complete`
                    }
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={stopWatching}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={completeVideo}
                    disabled={watchProgress < 80}
                  >
                    Complete Video
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="relative w-8 h-8">
                <img
                  src="/logo.svg"
                  alt="VideoTask Rewards"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="ml-2 text-lg font-semibold">VideoTask Rewards</span>
            </div>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/videos" className="text-blue-600 font-medium">Videos</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Today's Video Tasks</h1>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{videosWatched}/{dailyLimit}</div>
              <div className="text-sm text-gray-600">Videos Completed</div>
            </div>
          </div>
          <Progress
            value={(videosWatched / dailyLimit) * 100}
            className="h-3"
          />
          <p className="text-sm text-gray-600 mt-2">
            {dailyLimit - videosWatched} videos remaining today
          </p>
        </div>

        {/* Instructions */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">How to Earn Rewards</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Watch each video for at least 80% of its duration</li>
                  <li>• Complete all videos to maximize your daily earnings</li>
                  <li>• Rewards are automatically added to your wallet</li>
                  <li>• Come back daily for new videos and rewards</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => startWatching(video)}
              >
                <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {video.description || 'Watch this video to earn rewards'}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ${video.rewardAmount.toFixed(2)}
                    </Badge>
                    <Button size="sm">Watch Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Available</h3>
              <p className="text-gray-600 mb-6">
                There are no videos available at the moment. Please check back later.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
