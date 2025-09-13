"use client";

import { VideoCard } from "@/components/video-card";
import type { Video } from "@/lib/api/client";

const sampleVideos: Video[] = [
  {
    id: "1",
    title: "Learn React Hooks in 10 Minutes",
    description: "A comprehensive guide to React hooks including useState, useEffect, and custom hooks. Perfect for beginners and intermediate developers.",
    url: "https://example.com/video1",
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    duration: 600, // 10 minutes
    rewardAmount: 2.50,
    totalViews: 1234,
    watchProgress: 0.75,
    tags: ["React", "JavaScript", "Hooks"],
    isActive: true,
  },
  {
    id: "2",
    title: "Advanced TypeScript Patterns",
    description: "Explore advanced TypeScript patterns and techniques for building robust applications.",
    url: "https://example.com/video2",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
    duration: 1800, // 30 minutes
    rewardAmount: 5.00,
    totalViews: 856,
    tags: ["TypeScript", "Programming"],
    isActive: true,
  },
  {
    id: "3",
    title: "Building Modern UIs with Tailwind CSS",
    description: "Master the art of creating beautiful, responsive user interfaces using Tailwind CSS utility classes.",
    url: "https://example.com/video3",
    thumbnailUrl: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=450&fit=crop",
    duration: 900, // 15 minutes
    rewardAmount: 3.75,
    totalViews: 2156,
    watchProgress: 0.3,
    tags: ["CSS", "Tailwind", "Design", "Frontend"],
    isActive: true,
  },
  {
    id: "4",
    title: "Node.js Performance Optimization",
    description: "Learn how to optimize Node.js applications for better performance and scalability.",
    url: "https://example.com/video4",
    thumbnailUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=450&fit=crop",
    duration: 2400, // 40 minutes
    rewardAmount: 7.50,
    totalViews: 634,
    tags: ["Node.js", "Performance", "Backend"],
    isActive: true,
  },
  {
    id: "5",
    title: "Introduction to Machine Learning",
    description: "Get started with machine learning concepts and practical implementations using Python.",
    url: "https://example.com/video5",
    thumbnailUrl: null, // Test without thumbnail
    duration: 3600, // 60 minutes
    rewardAmount: 10.00,
    totalViews: 423,
    tags: ["Python", "ML", "AI", "Data Science", "Algorithms"],
    isActive: true,
  },
  {
    id: "6",
    title: "Database Design Best Practices",
    description: "Learn the fundamentals of database design and normalization for efficient data storage.",
    url: "https://example.com/video6",
    thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=450&fit=crop",
    duration: 1200, // 20 minutes
    rewardAmount: 4.25,
    totalViews: 987,
    watchProgress: 1.0, // Completed
    tags: ["Database", "SQL"],
    isActive: false, // Test inactive state
  }
];

export default function TestCardsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Video Card Components Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Testing the improved video card component with various states, content lengths,
            and visual scenarios to ensure optimal user experience.
          </p>
        </div>

        <div className="space-y-12">
          {/* Regular Grid */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Standard Grid Layout
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>

          {/* Disabled State */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Disabled State
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleVideos.slice(0, 3).map((video) => (
                <VideoCard key={`disabled-${video.id}`} video={video} disabled />
              ))}
            </div>
          </section>

          {/* Compact Grid */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Compact Layout (4 Columns)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sampleVideos.map((video) => (
                <VideoCard key={`compact-${video.id}`} video={video} />
              ))}
            </div>
          </section>

          {/* Single Row */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Horizontal Scroll Layout
            </h2>
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {sampleVideos.map((video) => (
                <div key={`scroll-${video.id}`} className="flex-none w-80">
                  <VideoCard video={video} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Stats */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {sampleVideos.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {sampleVideos.filter(v => v.isActive).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Active Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                PKR{sampleVideos.reduce((sum, v) => sum + v.rewardAmount, 0).toFixed(2)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Total Rewards</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
