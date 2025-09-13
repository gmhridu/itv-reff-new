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
          group overflow-hidden shadow-lg hover:shadow-2xl
          transition-all duration-300 hover:scale-[1.02] cursor-pointer
          bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-700/70
          backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/50 rounded-2xl
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {/* Thumbnail Section - No padding/gap */}
        <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="bg-black/80 text-white border-none text-xs font-medium px-3 py-1.5 backdrop-blur-xl rounded-lg"
            >
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(video.duration)}
            </Badge>
          </div>

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 backdrop-blur-xl rounded-full p-5 transform scale-75 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
              <Play className="h-10 w-10 text-white fill-current" />
            </div>
          </div>

          {/* Status Badge */}
          {video.totalViews && video.totalViews > 0 && (
            <div className="absolute top-2 left-2">
              <Badge
                variant="default"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-none text-xs backdrop-blur-xl rounded-lg"
              >
                <Eye className="h-3 w-3 mr-1" />
                {formatViews(video.totalViews)}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardContent className="p-5 space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
              {video.title}
            </h3>
          </div>

          {/* Description */}
          {video.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}

          {/* Stats and Reward */}
          <div className="flex items-center justify-between pt-2">
            {/* Video Stats */}
            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
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
              className="border-emerald-200 text-emerald-700 dark:border-emerald-500/50 dark:text-emerald-400 font-bold px-4 py-1.5 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/30 dark:to-cyan-950/30 rounded-lg"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              {video.rewardAmount.toFixed(2)} PKR
            </Badge>
          </div>

          {/* Progress Bar (if video is partially watched) */}
          {video.watchProgress !== undefined && video.watchProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Progress</span>
                <span>{Math.round(video.watchProgress * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 shadow-sm"
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
                  className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 rounded-lg"
                >
                  {tag}
                </Badge>
              ))}
              {video.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg"
                >
                  +{video.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-emerald-400/30 transition-all duration-300 pointer-events-none" />
      </Card>
    </Link>
  );
}
