import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try a simple query
    const count = await prisma.user.count();
    console.log(`Database connection successful! Found ${count} users.`);
    
    // Try to query position levels
    const positions = await prisma.positionLevel.findMany();
    console.log(`Found ${positions.length} position levels.`);
    
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();