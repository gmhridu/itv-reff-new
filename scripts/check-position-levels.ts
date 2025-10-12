import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPositionLevels() {
  try {
    console.log('Checking position levels...');
    
    const positions = await prisma.positionLevel.findMany({
      select: {
        id: true,
        name: true,
        level: true
      }
    });
    
    console.log('Position Levels:');
    positions.forEach(position => {
      console.log(`  ${position.name} (Level ${position.level}): ${position.id}`);
    });
    
  } catch (error) {
    console.error('Error checking position levels:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPositionLevels();