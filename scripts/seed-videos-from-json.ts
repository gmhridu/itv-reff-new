import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedVideosFromJson() {
  try {
    console.log('Seeding videos from JSON file...');

    // Read the videos.json file
    const videosJsonPath = path.join(__dirname, '../public/videos.json');
    const videosData = fs.readFileSync(videosJsonPath, 'utf-8');
    
    // Parse the JSON data
    const videos = JSON.parse(videosData);

    console.log(`Found ${videos.length} videos to seed`);

    // Get all position levels from the database
    const positionLevels = await prisma.positionLevel.findMany();
    const positionLevelMap = new Map<string, string>();
    
    // Map position level names to their actual IDs
    positionLevels.forEach(level => {
      positionLevelMap.set(level.name, level.id);
    });
    
    // Create a mapping from the old IDs in the JSON to position level names
    const positionNameMap: Record<string, string> = {
      'cmg40bn3z0001qlbqk9psr11a': 'L1',      // 13 PKR
      'cmg40bnsh0002qlbq86awl0v3': 'L2',      // 21 PKR
      'cmg40bo130003qlbqmh8ltdo2': 'L3',      // 72 PKR
      'cmg40bo9q0004qlbq0wmx1025': 'L4',      // 123 PKR
      'cmg40boic0005qlbqhzamjg8g': 'L5',      // 192 PKR
      'cmg40bor00006qlbqmplgqal3': 'L6',      // 454 PKR
      'cmg40bozn0007qlbqfw7r8hph': 'L7',      // 836 PKR
      'cmg40bp8b0008qlbqsphtno7k': 'L8',      // 1611 PKR
      'cmg40bpgz0009qlbqwaddlqul': 'L9',      // 3033 PKR
      'cmg40bppn000aqlbq2wh29bsx': 'L10',     // 6129 PKR
      'cmg40bpyq000bqlbqft7rx42l': 'L11',     // 12500 PKR
      // For any missing or unknown IDs, we'll default to Intern
    };

    // Counter for tracking progress
    let seededCount = 0;
    let errorCount = 0;

    // Seed each video
    for (const video of videos) {
      try {
        // Convert date strings to Date objects
        const availableFrom = video.availableFrom ? new Date(video.availableFrom) : null;
        const availableTo = video.availableTo ? new Date(video.availableTo) : null;
        const createdAt = video.createdAt ? new Date(video.createdAt) : new Date();
        const updatedAt = video.updatedAt ? new Date(video.updatedAt) : new Date();

        // Map the positionLevelId from the JSON to an actual position level ID
        let actualPositionLevelId: string | null = null;
        if (video.positionLevelId) {
          const positionName = positionNameMap[video.positionLevelId];
          if (positionName) {
            actualPositionLevelId = positionLevelMap.get(positionName) || null;
          }
        }

        // Create or update the video in the database
        await prisma.video.upsert({
          where: { id: video.id },
          update: {
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            rewardAmount: video.rewardAmount,
            isActive: video.isActive,
            availableFrom,
            availableTo,
            updatedAt,
            positionLevelId: actualPositionLevelId,
            cloudinaryPublicId: video.cloudinaryPublicId,
            tags: video.tags,
            uploadMethod: video.uploadMethod,
          },
          create: {
            id: video.id,
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            rewardAmount: video.rewardAmount,
            isActive: video.isActive,
            availableFrom,
            availableTo,
            createdAt,
            updatedAt,
            positionLevelId: actualPositionLevelId,
            cloudinaryPublicId: video.cloudinaryPublicId,
            tags: video.tags,
            uploadMethod: video.uploadMethod,
          },
        });

        seededCount++;
        if (seededCount % 10 === 0) {
          console.log(`Seeded ${seededCount} videos...`);
        }
      } catch (error) {
        console.error(`Error seeding video ${video.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Successfully seeded ${seededCount} videos!`);
    if (errorCount > 0) {
      console.log(`Encountered errors with ${errorCount} videos.`);
    }

  } catch (error) {
    console.error('Error seeding videos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedVideosFromJson();