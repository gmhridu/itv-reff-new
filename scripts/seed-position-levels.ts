import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const positionLevels = [
  {
    name: 'Intern',
    level: 0,
    deposit: 0,
    tasksPerDay: 5,
    unitPrice: 26,
    validityDays: 4,
  },
  {
    name: 'P1',
    level: 1,
    deposit: 3900,
    tasksPerDay: 5,
    unitPrice: 26,
    validityDays: 365,
  },
  {
    name: 'P2',
    level: 2,
    deposit: 18000,
    tasksPerDay: 10,
    unitPrice: 62,
    validityDays: 365,
  },
  {
    name: 'P3',
    level: 3,
    deposit: 52000,
    tasksPerDay: 20,
    unitPrice: 93,
    validityDays: 365,
  },
  {
    name: 'P4',
    level: 4,
    deposit: 120000,
    tasksPerDay: 30,
    unitPrice: 145,
    validityDays: 365,
  },
  {
    name: 'P5',
    level: 5,
    deposit: 250000,
    tasksPerDay: 50,
    unitPrice: 210,
    validityDays: 365,
  },
  {
    name: 'P6',
    level: 6,
    deposit: 550000,
    tasksPerDay: 60,
    unitPrice: 350,
    validityDays: 365,
  },
  {
    name: 'P7',
    level: 7,
    deposit: 1100000,
    tasksPerDay: 80,
    unitPrice: 720,
    validityDays: 365,
  },
  {
    name: 'P8',
    level: 8,
    deposit: 2200000,
    tasksPerDay: 100,
    unitPrice: 1300,
    validityDays: 365,
  },
  {
    name: 'P9',
    level: 9,
    deposit: 4000000,
    tasksPerDay: 120,
    unitPrice: 2000,
    validityDays: 365,
  },
  {
    name: 'P10',
    level: 10,
    deposit: 7000000,
    tasksPerDay: 150,
    unitPrice: 2800,
    validityDays: 365,
  },
];

async function seedPositionLevels() {
  console.log('Seeding position levels...');

  for (const position of positionLevels) {
    await prisma.positionLevel.upsert({
      where: { name: position.name },
      update: position,
      create: position,
    });
    console.log(`✓ Created/Updated position: ${position.name}`);
  }

  console.log('Position levels seeded successfully!');
}

async function main() {
  try {
    await seedPositionLevels();
  } catch (error) {
    console.error('Error seeding position levels:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedPositionLevels };
