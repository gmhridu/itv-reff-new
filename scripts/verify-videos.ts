import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyVideos() {
  try {
    console.log('🔍 Verifying video data...');

    // Get total video count
    const totalVideos = await prisma.video.count();
    console.log(`📊 Total videos in database: ${totalVideos}`);

    // Get videos with position level information
    const videosWithPositions = await prisma.video.findMany({
      include: {
        positionLevel: {
          select: {
            name: true,
            level: true,
            unitPrice: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 Video Details:');
    console.log('================');
    
    videosWithPositions.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Position: ${video.positionLevel?.name || 'No Position'} (Level ${video.positionLevel?.level || 'N/A'})`);
      console.log(`   Reward: ${video.rewardAmount} PKR`);
      console.log(`   Duration: ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`);
      console.log(`   URL: ${video.url}`);
      console.log('');
    });

    // Summary by position level
    const positionSummary = await prisma.video.groupBy({
      by: ['positionLevelId'],
      _count: {
        id: true
      },
      _avg: {
        rewardAmount: true,
        duration: true
      }
    });

    console.log('\n📈 Summary by Position Level:');
    console.log('=============================');
    
    for (const summary of positionSummary) {
      const position = await prisma.positionLevel.findUnique({
        where: { id: summary.positionLevelId! },
        select: { name: true, level: true, unitPrice: true }
      });
      
      console.log(`${position?.name} (Level ${position?.level}):`);
      console.log(`  Videos: ${summary._count.id}`);
      console.log(`  Avg Reward: ${summary._avg.rewardAmount?.toFixed(2)} PKR`);
      console.log(`  Avg Duration: ${Math.floor((summary._avg.duration || 0) / 60)}:${Math.floor((summary._avg.duration || 0) % 60).toString().padStart(2, '0')}`);
      console.log('');
    }

    console.log('✅ Video verification completed!');

  } catch (error) {
    console.error('❌ Error verifying videos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification function
if (require.main === module) {
  verifyVideos()
    .then(() => {
      console.log('✅ Video verification process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Video verification failed:', error);
      process.exit(1);
    });
}

export default verifyVideos;
