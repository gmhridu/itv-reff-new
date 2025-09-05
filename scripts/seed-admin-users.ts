import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedAdminUsers() {
  console.log("🌱 Seeding admin users...");

  try {
    // Check if admin users already exist
    const existingAdminCount = await prisma.adminUser.count();
    if (existingAdminCount > 0) {
      console.log(`ℹ️  ${existingAdminCount} admin user(s) already exist. Skipping seed.`);
      return;
    }

    const adminUsers = [
      {
        name: "Super Admin",
        email: "superadmin@example.com",
        password: "SuperAdmin@123",
        role: AdminRole.SUPER_ADMIN,
      },
      {
        name: "Admin User",
        email: "admin@example.com",
        password: "Admin@123",
        role: AdminRole.ADMIN,
      },
    ];

    for (const admin of adminUsers) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(admin.password, 12);

      // Create the admin user
      const createdAdmin = await prisma.adminUser.create({
        data: {
          name: admin.name,
          email: admin.email,
          password: hashedPassword,
          role: admin.role,
        },
      });

      console.log(`✅ Created admin user: ${createdAdmin.email} (${createdAdmin.role})`);
    }

    console.log("🎉 Admin users seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding admin users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedAdminUsers()
    .then(() => {
      console.log("✅ Admin user seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Admin user seeding failed:", error);
      process.exit(1);
    });
}

export default seedAdminUsers;
