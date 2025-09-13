'use client';

import { useState } from 'react';
import { useCompletedTasks } from '@/hooks/use-completed-tasks';
import { CompletedTaskCard } from './completed-task-card';
import { EmptyCompletedState, TaskCardSkeleton } from './empty-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';

interface CompletedTasksTabProps {
  onSwitchToDoingTab?: () => void;
}

export function CompletedTasksTab({ onSwitchToDoingTab }: CompletedTasksTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { 
    data: completedTasksData, 
    isLoading, 
    error, 
    refetch 
  } = useCompletedTasks({
    page: currentPage,
    limit: pageSize,
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load completed tasks</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Summary skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const { completedTasks, summary, pagination } = completedTasksData || {
    completedTasks: [],
    summary: { totalTasks: 0, totalRewards: 0, totalWatchTime: 0, todayTasksCount: 0 },
    pagination: { page: 1, totalPages: 1, hasNext: false, hasPrev: false }
  };

  if (completedTasks.length === 0 && currentPage === 1) {
    return <EmptyCompletedState onAction={onSwitchToDoingTab} />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Task Completion Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.totalTasks}
              </div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                PKR{summary.totalRewards.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(summary.totalWatchTime)}
              </div>
              <div className="text-sm text-gray-600">Watch Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {summary.todayTasksCount}
              </div>
              <div className="text-sm text-gray-600">Today's Tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedTasks.map((task) => (
          <CompletedTaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
