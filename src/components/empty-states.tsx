'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Play,
  CheckCircle,
  FileText,
  RefreshCw,
  ArrowRight,
  Clock
} from 'lucide-react';

interface EmptyStateProps {
  onRefresh?: () => void;
  onAction?: () => void;
}

export function EmptyDoingState({ onRefresh }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-gray-200">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="bg-blue-100 rounded-full p-4 mb-4">
          <Play className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Videos Available
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          You've completed all available videos for today, or there are no new videos to watch.
          Check back later for new content!
        </p>
        <div className="space-y-3">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Videos
            </Button>
          )}
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            New videos are added regularly
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyCompletedState({ onAction }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-gray-200">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="bg-green-100 rounded-full p-4 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Completed Tasks Yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Start watching videos to earn rewards! Your completed tasks will appear here
          with details about your earnings and progress.
        </p>
        {onAction && (
          <Button onClick={onAction} className="flex items-center gap-2">
            Start Watching Videos
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyAuditState({ onRefresh }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-gray-200">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="bg-purple-100 rounded-full p-4 mb-4">
          <FileText className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Transaction History
        </h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Your transaction history will appear here once you start earning rewards.
          This includes task rewards, referral bonuses, and withdrawals.
        </p>
        <div className="space-y-3 flex flex-col items-center justify-center">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Transactions
            </Button>
          )}
          <div className="text-sm text-gray-500">
            All transactions are automatically tracked and verified
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton components
export function TaskCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
      <CardContent className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
        <div className="flex justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </CardContent>
    </Card>
  );
}

export function TransactionItemSkeleton() {
  return (
    <Card className="mb-2 animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-1 w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mt-1"></div>
          </div>
          <div className="text-right">
            <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
