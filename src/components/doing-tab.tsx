'use client';

import { useVideos } from '@/hooks/use-videos';
import { VideoCard } from './video-card';
import { EmptyDoingState, TaskCardSkeleton } from './empty-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Clock,
  Target,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export function DoingTab() {
  const {
    data: videosData,
    isLoading,
    error,
    refetch,
  } = useVideos();

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <p className="text-red-600 mb-4">Failed to load available videos</p>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Progress skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const {
    videos = [],
    dailyTaskLimit = 0,
    tasksCompletedToday = 0,
    canCompleteTask = false,
    tasksRemaining = 0,
    reason = '',
    currentPosition
  } = videosData || {};

  const progressPercentage = dailyTaskLimit > 0 ? (tasksCompletedToday / dailyTaskLimit) * 100 : 0;
  const isCompleted = tasksCompletedToday >= dailyTaskLimit;

  return (
    <div className="space-y-6">
      {/* Daily Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Daily Progress
            {isCompleted && (
              <Badge variant="default" className="bg-green-600">
                Completed!
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tasks Completed</span>
                <span className="font-medium">
                  {tasksCompletedToday} / {dailyTaskLimit}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tasksRemaining}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {videos.length}
                </div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              {currentPosition && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${currentPosition.unitPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Per Video</div>
                </div>
              )}
            </div>

            {currentPosition && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Badge variant="outline">
                  {currentPosition.name} - Level {currentPosition.level}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {!canCompleteTask && reason && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{reason}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isCompleted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <Play className="h-4 w-4" />
              <span className="font-medium">
                Congratulations! You've completed all your daily tasks. Check back tomorrow for more videos!
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <EmptyDoingState onRefresh={refetch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              disabled={!canCompleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
