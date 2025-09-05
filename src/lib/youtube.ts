/**
 * YouTube API Integration for ITV Reference System
 *
 * Provides functionality to:
 * - Extract YouTube video IDs from various URL formats
 * - Fetch video metadata from YouTube Data API v3
 * - Generate high-quality thumbnail URLs
 * - Convert watch URLs to embed URLs
 * - Get video duration and other metadata
 */

// YouTube URL patterns for video ID extraction
const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
  /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  /youtube\.com\/shorts\/([^&\n?#]+)/,
];

// YouTube thumbnail quality options
export type YouTubeThumbnailQuality =
  | 'default'    // 120x90
  | 'medium'     // 320x180
  | 'high'       // 480x360
  | 'standard'   // 640x480
  | 'maxres';    // 1280x720 (if available)

// YouTube video metadata interface
export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
    standard: string;
    maxres?: string;
  };
  duration: number; // in seconds
  publishedAt: string;
  channelTitle: string;
  viewCount: number;
  embedUrl: string;
  watchUrl: string;
}

// YouTube API error class
export class YouTubeAPIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'YouTubeAPIError';
  }
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Clean the URL
  const cleanUrl = url.trim();

  // Try each pattern
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      // Remove any additional parameters from the video ID
      const videoId = match[1].split('&')[0].split('?')[0];

      // Validate video ID format (11 characters, alphanumeric + _ and -)
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }
  }

  return null;
}

/**
 * Generate YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean;
    mute?: boolean;
    controls?: boolean;
    start?: number;
    end?: number;
    loop?: boolean;
    rel?: boolean; // Show related videos
  } = {}
): string {
  if (!videoId) {
    throw new YouTubeAPIError('Video ID is required');
  }

  const params = new URLSearchParams();

  // Add parameters based on options
  if (options.autoplay) params.set('autoplay', '1');
  if (options.mute) params.set('mute', '1');
  if (options.controls === false) params.set('controls', '0');
  if (options.start && options.start > 0) params.set('start', options.start.toString());
  if (options.end && options.end > 0) params.set('end', options.end.toString());
  if (options.loop) params.set('loop', '1');
  if (options.rel === false) params.set('rel', '0');

  const paramString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${paramString ? `?${paramString}` : ''}`;
}

/**
 * Generate YouTube watch URL from video ID
 */
export function getYouTubeWatchUrl(videoId: string): string {
  if (!videoId) {
    throw new YouTubeAPIError('Video ID is required');
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Generate YouTube thumbnail URL
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: YouTubeThumbnailQuality = 'maxres'
): string {
  if (!videoId) {
    throw new YouTubeAPIError('Video ID is required');
  }

  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault'
  };

  const qualityParam = qualityMap[quality] || qualityMap.maxres;
  return `https://img.youtube.com/vi/${videoId}/${qualityParam}.jpg`;
}

/**
 * Get all available thumbnail URLs for a video
 */
export function getAllYouTubeThumbnails(videoId: string) {
  return {
    default: getYouTubeThumbnail(videoId, 'default'),
    medium: getYouTubeThumbnail(videoId, 'medium'),
    high: getYouTubeThumbnail(videoId, 'high'),
    standard: getYouTubeThumbnail(videoId, 'standard'),
    maxres: getYouTubeThumbnail(videoId, 'maxres'),
  };
}

/**
 * Convert ISO 8601 duration to seconds
 * Example: PT4M20S = 260 seconds
 */
export function parseDuration(isoDuration: string): number {
  if (!isoDuration) return 0;

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Fetch video metadata from YouTube Data API v3
 * Note: Requires YOUTUBE_API_KEY environment variable
 */
export async function getYouTubeVideoMetadata(videoId: string): Promise<YouTubeVideoMetadata | null> {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('YouTube API key not found. Using fallback metadata generation.');
    return generateFallbackMetadata(videoId);
  }

  if (!videoId) {
    throw new YouTubeAPIError('Video ID is required');
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 403) {
        throw new YouTubeAPIError('YouTube API quota exceeded or invalid API key', 'QUOTA_EXCEEDED');
      }
      throw new YouTubeAPIError(`YouTube API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new YouTubeAPIError('Video not found or is private/deleted', 'VIDEO_NOT_FOUND');
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;

    // Parse duration from ISO 8601 format
    const durationSeconds = parseDuration(contentDetails.duration);

    return {
      id: videoId,
      title: snippet.title || 'Untitled Video',
      description: snippet.description || '',
      thumbnails: {
        default: snippet.thumbnails.default?.url || getYouTubeThumbnail(videoId, 'default'),
        medium: snippet.thumbnails.medium?.url || getYouTubeThumbnail(videoId, 'medium'),
        high: snippet.thumbnails.high?.url || getYouTubeThumbnail(videoId, 'high'),
        standard: snippet.thumbnails.standard?.url || getYouTubeThumbnail(videoId, 'standard'),
        maxres: snippet.thumbnails.maxres?.url || getYouTubeThumbnail(videoId, 'maxres'),
      },
      duration: durationSeconds,
      publishedAt: snippet.publishedAt,
      channelTitle: snippet.channelTitle || 'Unknown Channel',
      viewCount: parseInt(statistics.viewCount) || 0,
      embedUrl: getYouTubeEmbedUrl(videoId),
      watchUrl: getYouTubeWatchUrl(videoId),
    };

  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      throw error;
    }

    console.error('YouTube API request failed:', error);

    // Return fallback metadata on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error, using fallback metadata');
      return generateFallbackMetadata(videoId);
    }

    throw new YouTubeAPIError('Failed to fetch video metadata');
  }
}

/**
 * Generate fallback metadata when YouTube API is not available
 */
function generateFallbackMetadata(videoId: string): YouTubeVideoMetadata {
  return {
    id: videoId,
    title: 'YouTube Video',
    description: 'Video imported from YouTube',
    thumbnails: getAllYouTubeThumbnails(videoId),
    duration: 0, // Will need to be set manually
    publishedAt: new Date().toISOString(),
    channelTitle: 'Unknown Channel',
    viewCount: 0,
    embedUrl: getYouTubeEmbedUrl(videoId),
    watchUrl: getYouTubeWatchUrl(videoId),
  };
}

/**
 * Validate if a YouTube URL is valid and accessible
 */
export async function validateYouTubeUrl(url: string): Promise<{
  isValid: boolean;
  videoId: string | null;
  error?: string;
}> {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return {
      isValid: false,
      videoId: null,
      error: 'Invalid YouTube URL format'
    };
  }

  try {
    // Try to fetch a thumbnail to check if video exists
    const thumbnailUrl = getYouTubeThumbnail(videoId, 'default');
    const response = await fetch(thumbnailUrl, { method: 'HEAD' });

    return {
      isValid: response.ok,
      videoId,
      error: response.ok ? undefined : 'Video not found or is private'
    };
  } catch (error) {
    return {
      isValid: false,
      videoId,
      error: 'Failed to validate video'
    };
  }
}

/**
 * Convert various YouTube URL formats to embed URL
 */
export function convertToEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return getYouTubeEmbedUrl(videoId, {
    rel: false, // Don't show related videos
    controls: true,
  });
}

/**
 * Check if URL is already an embed URL
 */
export function isEmbedUrl(url: string): boolean {
  return url.includes('youtube.com/embed/');
}

/**
 * Get video ID from embed URL
 */
export function getVideoIdFromEmbedUrl(embedUrl: string): string | null {
  const match = embedUrl.match(/youtube\.com\/embed\/([^?&]+)/);
  return match ? match[1] : null;
}
