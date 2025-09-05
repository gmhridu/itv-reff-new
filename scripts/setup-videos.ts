#!/usr/bin/env bun

/**
 * Video Setup Script
 * 
 * This script sets up the video system with position level references:
 * 1. Applies database schema changes
 * 2. Cleans existing video data
 * 3. Seeds 20 new videos with position level assignments
 * 4. Verifies the setup
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import seedVideos from './seed-videos';
import verifyVideos from './verify-videos';

const prisma = new PrismaClient();

async function setupVideos() {
  console.log('🚀 Starting Video Setup Process...');
  console.log('=====================================\n');

  try {
    // Step 1: Apply database schema changes
    console.log('📊 Step 1: Applying database schema changes...');
    try {
      execSync('bun prisma db push', { stdio: 'inherit' });
      console.log('✅ Database schema updated successfully\n');
    } catch (error) {
      console.error('❌ Failed to update database schema:', error);
      throw error;
    }

    // Step 2: Check if position levels exist
    console.log('🔍 Step 2: Checking position levels...');
    const positionCount = await prisma.positionLevel.count();
    
    if (positionCount === 0) {
      console.log('⚠️  No position levels found. Running position level seeding...');
      try {
        execSync('bun run scripts/seed-position-levels.ts', { stdio: 'inherit' });
        console.log('✅ Position levels seeded successfully\n');
      } catch (error) {
        console.error('❌ Failed to seed position levels:', error);
        throw error;
      }
    } else {
      console.log(`✅ Found ${positionCount} position levels\n`);
    }

    // Step 3: Seed videos
    console.log('🎬 Step 3: Seeding videos with position level references...');
    await seedVideos();
    console.log('✅ Videos seeded successfully\n');

    // Step 4: Verify setup
    console.log('🔍 Step 4: Verifying video setup...');
    await verifyVideos();
    console.log('✅ Video setup verified successfully\n');

    // Step 5: Summary
    console.log('📋 Setup Summary:');
    console.log('=================');
    
    const totalVideos = await prisma.video.count();
    const totalPositions = await prisma.positionLevel.count();
    
    console.log(`📹 Total Videos: ${totalVideos}`);
    console.log(`🎯 Total Position Levels: ${totalPositions}`);
    
    const videosByPosition = await prisma.video.groupBy({
      by: ['positionLevelId'],
      _count: { id: true }
    });
    
    console.log(`📊 Videos distributed across ${videosByPosition.length} position levels`);
    
    console.log('\n🎉 Video setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('- Videos are now available with position level references');
    console.log('- Each video has a reward amount based on its assigned position level');
    console.log('- Users will see videos and earn rewards based on their current position');
    console.log('- The API endpoints are ready to serve position-aware video content');

  } catch (error) {
    console.error('\n❌ Video setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupVideos()
    .then(() => {
      console.log('\n✅ Video setup process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Video setup process failed:', error);
      process.exit(1);
    });
}

export default setupVideos;
