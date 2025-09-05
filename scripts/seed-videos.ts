import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// // Video URLs from the video.md file
// const videoUrls = [
//   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
//   'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
// ];

// Video titles, descriptions, and specific video URLs
const videoData = [
  {
    title: 'We Are Going On Bullrun',
    description: 'An exciting journey through the world of cryptocurrency and digital assets.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    duration: 47, // 47 seconds
  },
  {
    title: 'For Bigger Joyrides',
    description: 'Experience the thrill of adventure and exploration in this captivating video.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    duration: 15, // 15 seconds
  },
  {
    title: 'For Bigger Meltdowns',
    description: 'A dramatic and intense video showcasing powerful moments and emotions.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    duration: 15, // 15 seconds
  },
  {
    title: 'For Bigger Fun',
    description: 'Join us for an entertaining and fun-filled video experience.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: 60, // 1 mintues
  },
  {
    title: 'For Bigger Escapes',
    description: 'Escape into a world of wonder and imagination with this amazing video.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 15, // 15 seconds
  },
  {
    title: 'For Bigger Blazes',
    description: 'Witness spectacular moments and blazing action in this thrilling video.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15, // 15 seconds
  },
  {
    title: 'Digital Marketing Mastery',
    description: 'Learn the fundamentals of digital marketing and online business strategies.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 596, // 9 minutes 56 seconds
  },
  {
    title: 'Cryptocurrency Basics',
    description: 'Understanding the basics of cryptocurrency and blockchain technology.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 653, // 10 minutes 53 seconds
  },
  {
    title: 'Investment Strategies',
    description: 'Smart investment strategies for building long-term wealth.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    duration: 887, // 14 minutes 47 seconds
  },
  {
    title: 'Entrepreneurship Journey',
    description: 'The complete guide to starting and growing your own business.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 734, // 12 minutes 14 seconds
  },
  {
    title: 'Financial Freedom',
    description: 'Achieve financial independence through smart money management.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    duration: 593, // 9 minutes 53 seconds
  },
  {
    title: 'Online Business Success',
    description: 'Build a successful online business from scratch.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    duration: 567, //9 minutes 27 seconds
  },
  {
    title: 'Passive Income Streams',
    description: 'Create multiple passive income streams for financial security.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    duration: 594, // 9 minutes 54 seconds
  },
  {
    title: 'Trading Psychology',
    description: 'Master the psychological aspects of successful trading.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    duration: 47, // 47 seconds
  },
  {
    title: 'Wealth Building Mindset',
    description: 'Develop the right mindset for building lasting wealth.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    duration: 15, // 15 seconds
  },
  {
    title: 'Market Analysis Techniques',
    description: 'Advanced techniques for analyzing financial markets.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    duration: 15, // 15 seconds
  },
  {
    title: 'Risk Management',
    description: 'Essential risk management strategies for investors.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: 60, // 1 minutes
  },
  {
    title: 'Portfolio Diversification',
    description: 'Build a diversified investment portfolio for maximum returns.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 15, // 15 seconds
  },
  {
    title: 'Economic Trends Analysis',
    description: 'Understanding and analyzing current economic trends.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15, // 15 seconds
  },
  {
    title: 'Future of Finance',
    description: 'Exploring the future of finance and digital currencies.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 596, // 9 minutes 56 seconds
  },
];

function generateThumbnailUrl(videoUrl: string): string {
  // Generate a placeholder thumbnail URL based on the video
  const videoName = videoUrl.split('/').pop()?.replace('.mp4', '') || 'video';
  return `https://via.placeholder.com/640x360/0066cc/ffffff?text=${encodeURIComponent(videoName)}`;
}

async function seedVideos() {
  try {
    console.log('🎬 Starting video seeding process...');

    // Step 1: Clean existing video data
    console.log('🧹 Cleaning existing video data...');

    // Delete all existing user video tasks first (due to foreign key constraints)
    await prisma.userVideoTask.deleteMany({});
    console.log('✓ Deleted all existing user video tasks');

    // Delete all existing videos
    await prisma.video.deleteMany({});
    console.log('✓ Deleted all existing videos');

    // Step 2: Get all position levels for random assignment
    const positionLevels = await prisma.positionLevel.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' }
    });

    if (positionLevels.length === 0) {
      console.log('⚠️  No position levels found. Please run position level seeding first.');
      return;
    }

    console.log(`📊 Found ${positionLevels.length} position levels`);

    // Step 3: Create 20 new videos with specific video URLs
    console.log('🎥 Creating 20 new videos...');

    const videosToCreate: Prisma.VideoCreateManyInput[] = [];

    for (let i = 0; i < 20; i++) {
      const videoInfo = videoData[i];
      const randomPositionLevel = positionLevels[Math.floor(Math.random() * positionLevels.length)];

      videosToCreate.push({
        title: videoInfo.title,
        description: videoInfo.description,
        url: videoInfo.videoUrl, // Use specific video URL from videoData
        thumbnailUrl: generateThumbnailUrl(videoInfo.videoUrl),
        duration: videoInfo.duration,
        rewardAmount: randomPositionLevel.unitPrice, // Use position level unit price as reward
        positionLevelId: randomPositionLevel.id,
        isActive: true,
        availableFrom: new Date(),
        availableTo: null, // No expiry
      });
    }

    // Create all videos
    const createdVideos = await prisma.video.createMany({
      data: videosToCreate,
      skipDuplicates: true
    });

    console.log(`✅ Successfully created ${createdVideos.count} videos`);

    // Step 4: Display summary
    const videosByPosition = await prisma.video.groupBy({
      by: ['positionLevelId'],
      _count: {
        id: true
      }
    });

    console.log('\n📈 Video distribution by position level:');
    for (const group of videosByPosition) {
      const positionLevel = await prisma.positionLevel.findUnique({
        where: { id: group.positionLevelId! },
        select: { name: true, unitPrice: true }
      });

      console.log(`  ${positionLevel?.name}: ${group._count.id} videos (${positionLevel?.unitPrice} PKR reward each)`);
    }

    console.log('\n🎉 Video seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding videos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedVideos()
    .then(() => {
      console.log('✅ Video seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Video seeding failed:', error);
      process.exit(1);
    });
}

export default seedVideos;
