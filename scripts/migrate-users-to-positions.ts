import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUsersToPositions() {
  console.log('Starting user migration to position system...');

  // Get the Intern position
  const internPosition = await prisma.positionLevel.findUnique({
    where: { name: 'Intern' }
  });

  if (!internPosition) {
    throw new Error('Intern position not found. Please run seed-position-levels.ts first.');
  }

  // Get all users without a position
  const usersWithoutPosition = await prisma.user.findMany({
    where: {
      currentPositionId: null
    }
  });

  console.log(`Found ${usersWithoutPosition.length} users to migrate`);

  // Set all users to Intern position initially
  for (const user of usersWithoutPosition) {
    const startDate = new Date();
    // Since we're removing validityDays, we don't set an end date
    const endDate = null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentPositionId: internPosition.id,
        positionStartDate: startDate,
        positionEndDate: endDate,
        isIntern: true,
        depositPaid: 0,
      }
    });

    console.log(`✓ Migrated user ${user.email} to Intern position`);
  }

  console.log('User migration completed successfully!');
}

async function buildReferralHierarchy() {
  console.log('Building referral hierarchy...');

  const users = await prisma.user.findMany({
    where: {
      referredBy: { not: null }
    },
    include: {
      referrer: {
        include: {
          referrer: true
        }
      }
    }
  });

  for (const user of users) {
    if (!user.referrer) continue;

    // A-level: Direct referrer
    await prisma.referralHierarchy.upsert({
      where: {
        userId_referrerId: {
          userId: user.id,
          referrerId: user.referrer.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        referrerId: user.referrer.id,
        level: 'A_LEVEL'
      }
    });

    // B-level: Referrer's referrer
    if (user.referrer.referrer) {
      await prisma.referralHierarchy.upsert({
        where: {
          userId_referrerId: {
            userId: user.id,
            referrerId: user.referrer.referrer.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          referrerId: user.referrer.referrer.id,
          level: 'B_LEVEL'
        }
      });

      // C-level: Referrer's referrer's referrer
      const cLevelReferrer = await prisma.user.findUnique({
        where: { id: user.referrer.referrer.id },
        include: { referrer: true }
      });

      if (cLevelReferrer?.referrer) {
        await prisma.referralHierarchy.upsert({
          where: {
            userId_referrerId: {
              userId: user.id,
              referrerId: cLevelReferrer.referrer.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            referrerId: cLevelReferrer.referrer.id,
            level: 'C_LEVEL'
          }
        });
      }
    }
  }

  console.log('Referral hierarchy built successfully!');
}

async function main() {
  try {
    await migrateUsersToPositions();
    await buildReferralHierarchy();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { migrateUsersToPositions, buildReferralHierarchy };
