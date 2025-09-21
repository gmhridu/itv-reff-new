import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    // Admin user details
    const adminData = {
      name: "Admin User",
      email: "ah03024554434gmail.com",
      phone: "03555442211",
      password: "Doublespace321",
      role: "SUPER_ADMIN" as const,
    };

    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      console.log("❌ Admin user already exists with email:", adminData.email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone,
        password: hashedPassword,
        role: adminData.role,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Password:", adminData.password);
    console.log("👤 Role:", admin.role);
    console.log("🆔 ID:", admin.id);
    console.log(
      "\n⚠️  IMPORTANT: Please change the default password after first login!"
    );
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
