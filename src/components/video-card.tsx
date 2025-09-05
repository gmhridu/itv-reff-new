"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, DollarSign, Eye, Users } from "lucide-react";
import type { Video } from "@/lib/api/client";
import Link from "next/link";

interface VideoCardProps {
  video: Video;
  disabled?: boolean;
}

export function VideoCard({ video, disabled = false }: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <Link href={`/videos/${video.id}/watch`}>
      <Card
        className={`
          group overflow-hidden border-0 shadow-md hover:shadow-xl
          transition-all duration-300 hover:scale-[1.02] cursor-pointer
          bg-white dark:bg-gray-900 rounded-xl
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {/* Thumbnail Section - No padding/gap */}
        <div className="relative aspect-video overflow-hidden rounded-t-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Play className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            </div>
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="bg-black/70 text-white border-none text-xs font-medium px-2 py-1 backdrop-blur-sm"
            >
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(video.duration)}
            </Badge>
          </div>

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg">
              <Play className="h-8 w-8 text-gray-900 dark:text-white fill-current" />
            </div>
          </div>

          {/* Status Badge */}
          {video.totalViews && video.totalViews > 0 && (
            <div className="absolute top-2 left-2">
              <Badge
                variant="default"
                className="bg-green-500/90 text-white border-none text-xs backdrop-blur-sm"
              >
                <Eye className="h-3 w-3 mr-1" />
                {formatViews(video.totalViews)}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {video.title}
            </h3>
          </div>

          {/* Description */}
          {video.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}

          {/* Stats and Reward */}
          <div className="flex items-center justify-between pt-2">
            {/* Video Stats */}
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              {video.totalViews !== undefined && (
                <div className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  <span>{formatViews(video.totalViews)}</span>
                </div>
              )}

              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDuration(video.duration)}</span>
              </div>
            </div>

            {/* Reward Badge */}
            <Badge
              variant="outline"
              className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-400 font-semibold px-3 py-1 bg-green-50 dark:bg-green-950/50"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              {video.rewardAmount.toFixed(2)}
            </Badge>
          </div>

          {/* Progress Bar (if video is partially watched) */}
          {video.watchProgress !== undefined && video.watchProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress</span>
                <span>{Math.round(video.watchProgress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${video.watchProgress * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Tags or Categories (if available) */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {video.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
              {video.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  +{video.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/20 transition-colors pointer-events-none" />
      </Card>
    </Link>
  );
}
