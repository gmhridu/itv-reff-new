import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

// Setup configuration
const SETUP_CONFIG = {
  admin: {
    name: "Super Admin",
    email: "ah03024554434@gmail.com",
    phone: "03555442211",
    password: "Doublespace@321",
    role: "SUPER_ADMIN" as const,
  },
  defaultWallets: [
    {
      walletType: "JAZZCASH" as const,
      walletNumber: "03001234567",
      walletHolderName: "Admin JazzCash Account",
    },
    {
      walletType: "EASYPAISA" as const,
      walletNumber: "03009876543",
      walletHolderName: "Admin EasyPaisa Account",
    },
  ],
  positionLevels: [
    {
      name: "Intern",
      level: 0,
      deposit: 0,
      tasksPerDay: 5,
      unitPrice: 10,
    },
    {
      name: "P1",
      level: 1,
      deposit: 1000,
      tasksPerDay: 20,
      unitPrice: 15,
    },
    {
      name: "P2",
      level: 2,
      deposit: 5000,
      tasksPerDay: 40,
      unitPrice: 20,
    },
    {
      name: "P3",
      level: 3,
      deposit: 10000,
      tasksPerDay: 60,
      unitPrice: 25,
    },
  ],
  plans: [
    {
      name: "Basic Plan",
      description: "Perfect for beginners",
      price: 500,
      durationDays: 30,
      dailyVideoLimit: 10,
      rewardPerVideo: 5,
      referralBonus: 50,
      isActive: true,
    },
    {
      name: "Premium Plan",
      description: "For dedicated users",
      price: 1500,
      durationDays: 30,
      dailyVideoLimit: 25,
      rewardPerVideo: 8,
      referralBonus: 150,
      isActive: true,
    },
    {
      name: "VIP Plan",
      description: "Maximum earning potential",
      price: 3000,
      durationDays: 30,
      dailyVideoLimit: 50,
      rewardPerVideo: 12,
      referralBonus: 300,
      isActive: true,
    },
  ],
  settings: [
    { key: "min_topup_amount", value: "100" },
    { key: "min_withdrawal_amount", value: "500" },
    { key: "withdrawal_fee_percentage", value: "2" },
    { key: "referral_bonus_enabled", value: "true" },
    { key: "maintenance_mode", value: "false" },
    { key: "max_daily_withdrawals", value: "3" },
  ],
};

async function createAdminUser() {
  console.log("🔧 Creating admin user...");

  try {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: SETUP_CONFIG.admin.email },
    });

    if (existingAdmin) {
      console.log(`ℹ️  Admin user already exists: ${SETUP_CONFIG.admin.email}`);
      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash(SETUP_CONFIG.admin.password, 12);

    const admin = await prisma.adminUser.create({
      data: {
        name: SETUP_CONFIG.admin.name,
        email: SETUP_CONFIG.admin.email,
        phone: SETUP_CONFIG.admin.phone,
        password: hashedPassword,
        role: SETUP_CONFIG.admin.role,
      },
    });

    console.log(`✅ Admin user created: ${admin.email}`);
    console.log(`🔑 Password: ${SETUP_CONFIG.admin.password}`);
    console.log(`👤 Role: ${admin.role}`);
    console.log(`🆔 ID: ${admin.id}`);

    return admin;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

async function createPositionLevels() {
  console.log("📊 Creating position levels...");

  try {
    const existingLevels = await prisma.positionLevel.count();
    if (existingLevels > 0) {
      console.log(
        `ℹ️  Position levels already exist (${existingLevels} found)`,
      );
      return;
    }

    for (const levelData of SETUP_CONFIG.positionLevels) {
      const level = await prisma.positionLevel.create({
        data: levelData,
      });
      console.log(
        `✅ Created position level: ${level.name} (Level ${level.level})`,
      );
    }

    console.log("🎉 Position levels created successfully!");
  } catch (error) {
    console.error("❌ Error creating position levels:", error);
    throw error;
  }
}

async function createPlans() {
  console.log("💳 Creating subscription plans...");

  try {
    const existingPlans = await prisma.plan.count();
    if (existingPlans > 0) {
      console.log(`ℹ️  Plans already exist (${existingPlans} found)`);
      return;
    }

    for (const planData of SETUP_CONFIG.plans) {
      const plan = await prisma.plan.create({
        data: planData,
      });
      console.log(`✅ Created plan: ${plan.name} (${plan.price} PKR)`);
    }

    console.log("🎉 Subscription plans created successfully!");
  } catch (error) {
    console.error("❌ Error creating plans:", error);
    throw error;
  }
}

async function createAdminWallets() {
  console.log("💰 Creating admin wallets...");

  try {
    const existingWallets = await prisma.adminWallet.count();
    if (existingWallets > 0) {
      console.log(`ℹ️  Admin wallets already exist (${existingWallets} found)`);
      return;
    }

    for (const walletData of SETUP_CONFIG.defaultWallets) {
      const wallet = await prisma.adminWallet.create({
        data: walletData,
      });
      console.log(
        `✅ Created wallet: ${wallet.walletType} - ${wallet.walletNumber}`,
      );
    }

    console.log("🎉 Admin wallets created successfully!");
  } catch (error) {
    console.error("❌ Error creating admin wallets:", error);
    throw error;
  }
}

async function createSettings() {
  console.log("⚙️  Creating system settings...");

  try {
    for (const settingData of SETUP_CONFIG.settings) {
      const existingSetting = await prisma.setting.findUnique({
        where: { key: settingData.key },
      });

      if (existingSetting) {
        console.log(`ℹ️  Setting already exists: ${settingData.key}`);
        continue;
      }

      const setting = await prisma.setting.create({
        data: settingData,
      });
      console.log(`✅ Created setting: ${setting.key} = ${setting.value}`);
    }

    console.log("🎉 System settings created successfully!");
  } catch (error) {
    console.error("❌ Error creating settings:", error);
    throw error;
  }
}

async function checkCloudinaryConfiguration() {
  console.log("☁️  Checking Cloudinary configuration...");

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.log("⚠️  Cloudinary environment variables not configured");
      console.log("   Please set the following environment variables:");
      console.log("   - CLOUDINARY_CLOUD_NAME");
      console.log("   - CLOUDINARY_API_KEY");
      console.log("   - CLOUDINARY_API_SECRET");
      return false;
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Test connection
    const result = await cloudinary.api.ping();
    console.log(`✅ Cloudinary connection successful: ${result.status}`);
    console.log(`📁 Cloud name: ${cloudName}`);

    return true;
  } catch (error) {
    console.error("❌ Cloudinary configuration error:", error);
    return false;
  }
}

async function createAuditLog(
  adminId: string,
  action: string,
  description: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action: "BULK_UPDATE" as any,
        targetType: "system",
        description,
        details: JSON.stringify({
          setupScript: true,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    console.warn("⚠️  Could not create audit log:", error);
  }
}

async function displaySetupSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("🎉 SETUP COMPLETE! 🎉");
  console.log("=".repeat(60));

  try {
    // Get counts
    const [adminCount, walletCount, planCount, levelCount, settingCount] =
      await Promise.all([
        prisma.adminUser.count(),
        prisma.adminWallet.count(),
        prisma.plan.count(),
        prisma.positionLevel.count(),
        prisma.setting.count(),
      ]);

    console.log(`👥 Admin Users: ${adminCount}`);
    console.log(`💰 Admin Wallets: ${walletCount}`);
    console.log(`💳 Subscription Plans: ${planCount}`);
    console.log(`📊 Position Levels: ${levelCount}`);
    console.log(`⚙️  System Settings: ${settingCount}`);

    console.log("\n📝 Next Steps:");
    console.log("1. Start the development server: npm run dev");
    console.log("2. Visit http://localhost:3000");
    console.log("3. Login with admin credentials:");
    console.log(`   Email: ${SETUP_CONFIG.admin.email}`);
    console.log(`   Password: ${SETUP_CONFIG.admin.password}`);
    console.log("4. Change the admin password after first login");
    console.log("5. Configure Cloudinary for image uploads");

    console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
    console.log("- Change the default admin password immediately");
    console.log("- Set up proper environment variables for production");
    console.log("- Configure rate limiting and security headers");
    console.log("- Enable SSL/TLS in production");
  } catch (error) {
    console.error("❌ Error generating summary:", error);
  }

  console.log("=".repeat(60));
}

async function runSetup() {
  console.log("🚀 Starting VideoTask Rewards Platform Setup...\n");

  try {
    // Check database connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Run setup steps
    const admin = await createAdminUser();
    await createPositionLevels();
    await createPlans();
    await createAdminWallets();
    await createSettings();

    // Check Cloudinary
    await checkCloudinaryConfiguration();

    // Create audit log
    if (admin) {
      await createAuditLog(
        admin.id,
        "SYSTEM_SETUP",
        "Initial system setup completed",
      );
    }

    // Display summary
    await displaySetupSummary();

    console.log("\n🎯 Setup completed successfully!");
  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  runSetup()
    .then(() => {
      console.log("✅ Setup script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup script failed:", error);
      process.exit(1);
    });
}

export default runSetup;
