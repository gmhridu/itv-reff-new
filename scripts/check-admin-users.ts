import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminUsers() {
  console.log("🔍 Checking admin users in database...");

  try {
    // Get all admin users
    const adminUsers = await prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    console.log("\n📊 Admin Users Found:", adminUsers.length);
    console.log("=" .repeat(60));

    adminUsers.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin User:`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Last Login: ${admin.lastLogin || 'Never'}`);
      console.log(`   Created: ${admin.createdAt.toISOString()}`);
    });

    if (adminUsers.length === 0) {
      console.log("\n⚠️  No admin users found in database!");
      console.log("Run: npx tsx scripts/seed-admin-users.ts");
    }

  } catch (error) {
    console.error("❌ Error checking admin users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkAdminUsers()
    .then(() => {
      console.log("\n✅ Admin user check completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Admin user check failed:", error);
      process.exit(1);
    });
}

export default checkAdminUsers;
