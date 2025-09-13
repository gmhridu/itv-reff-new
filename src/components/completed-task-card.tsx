'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, DollarSign, Calendar } from 'lucide-react';
import type { CompletedTask } from '@/hooks/use-completed-tasks';

interface CompletedTaskCardProps {
  task: CompletedTask;
}

export function CompletedTaskCard({ task }: CompletedTaskCardProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Completion indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-green-100 rounded-full p-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      </div>

      <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center relative overflow-hidden">
        {task.video.thumbnailUrl ? (
          <img
            src={task.video.thumbnailUrl}
            alt={task.video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center bg-gray-100 w-full h-full">
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {/* Completed overlay */}
        <div className="absolute inset-0 bg-green-600 bg-opacity-20 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h4 className="font-semibold mb-2 line-clamp-2">{task.video.title}</h4>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.video.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(task.video.duration)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200">
              <DollarSign className="h-3 w-3" />
              {task.rewardEarned.toFixed(2)} PKR
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.completedAt)}
            </div>
            {task.positionLevel && (
              <Badge variant="outline" className="text-xs">
                {task.positionLevel}
              </Badge>
            )}
          </div>
        </div>

        {task.isVerified && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            Verified
          </div>
        )}
      </CardContent>
    </Card>
  );
}
