import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetAdminPassword() {
  console.log("🔑 Resetting admin password...");

  try {
    // Find the admin user
    const admin = await prisma.adminUser.findFirst({
      where: { email: "admin@admin.com" },
    });

    if (!admin) {
      console.log("❌ No admin user found with email admin@admin.com");
      return;
    }

    console.log("✅ Admin user found:");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);

    // Set new password
    const newPassword = "Admin@123";
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the admin user
    const updatedAdmin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log("✅ Admin password updated successfully!");
    console.log(`   New password: ${newPassword}`);
    console.log("🔐 You can now login with these credentials:");
    console.log(`   Email: ${updatedAdmin.email}`);
    console.log(`   Password: ${newPassword}`);

  } catch (error) {
    console.error("❌ Error resetting admin password:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  resetAdminPassword()
    .then(() => {
      console.log("\n✅ Admin password reset completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Admin password reset failed:", error);
      process.exit(1);
    });
}

export default resetAdminPassword;
