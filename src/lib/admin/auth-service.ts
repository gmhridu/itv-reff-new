import { db as prisma } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { NextRequest } from "next/server";
import { AdminUser, AdminRole, AdminLoginForm } from "@/types/admin";

const JWT_SECRET = process.env.JWT_SECRET || "admin-fallback-secret";
const JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || "24h";

export class AdminAuthService {
  /**
   * Authenticate admin user with email and password
   */
  async login(credentials: AdminLoginForm): Promise<{
    admin: AdminUser;
    token: string;
  }> {
    const { email, password } = credentials;

    // Find admin user
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = this.generateToken(admin.id, admin.role);

    return {
      admin: this.mapAdminUser(admin),
      token,
    };
  }

  /**
   * Verify JWT token and return admin user
   */
  async verifyToken(token: string): Promise<AdminUser | null> {
    try {
      const decoded = verify(token, JWT_SECRET) as {
        adminId: string;
        role: AdminRole;
        iat: number;
        exp: number;
      };

      const admin = await prisma.adminUser.findUnique({
        where: { id: decoded.adminId },
      });

      if (!admin) {
        return null;
      }

      return this.mapAdminUser(admin);
    } catch (error) {
      console.error("Token verification error:", error);
      return null;
    }
  }

  /**
   * Get admin user from request (middleware helper)
   */
  async getAdminFromRequest(req: NextRequest): Promise<AdminUser | null> {
    const token = this.extractTokenFromRequest(req);
    if (!token) {
      return null;
    }

    return this.verifyToken(token);
  }

  /**
   * Create new admin user
   */
  async createAdmin(
    email: string,
    password: string,
    name: string,
    role: AdminRole = AdminRole.ADMIN,
  ): Promise<AdminUser> {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      throw new Error("Admin user already exists");
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
      },
    });

    return this.mapAdminUser(admin);
  }

  /**
   * Update admin password
   */
  async updatePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(
      currentPassword,
      admin.password,
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await hash(newPassword, 12);

    // Update password
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { password: hashedNewPassword },
    });

    return true;
  }

  /**
   * Update admin profile
   */
  async updateProfile(
    adminId: string,
    updates: { name?: string; email?: string },
  ): Promise<AdminUser> {
    const updateData: any = {};

    if (updates.name) {
      updateData.name = updates.name;
    }

    if (updates.email) {
      updateData.email = updates.email.toLowerCase();
    }

    if (updates.email) {
      // Check if email is already taken
      const existingAdmin = await prisma.adminUser.findUnique({
        where: { email: updates.email.toLowerCase() },
      });

      if (existingAdmin && existingAdmin.id !== adminId) {
        throw new Error("Email is already taken");
      }
    }

    const admin = await prisma.adminUser.update({
      where: { id: adminId },
      data: updateData,
    });

    return this.mapAdminUser(admin);
  }

  /**
   * Get all admin users (super admin only)
   */
  async getAllAdmins(): Promise<AdminUser[]> {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
    });

    return admins.map(this.mapAdminUser);
  }

  /**
   * Update admin role (super admin only)
   */
  async updateAdminRole(
    targetAdminId: string,
    newRole: AdminRole,
    requestingAdminId: string,
  ): Promise<AdminUser> {
    // Check if requesting admin is super admin
    const requestingAdmin = await prisma.adminUser.findUnique({
      where: { id: requestingAdminId },
    });

    if (!requestingAdmin || requestingAdmin.role !== AdminRole.SUPER_ADMIN) {
      throw new Error("Unauthorized: Only super admins can change roles");
    }

    // Check if target admin exists
    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id: targetAdminId },
    });

    if (!targetAdmin) {
      throw new Error("Target admin not found");
    }

    // Prevent removing the last super admin
    if (
      targetAdmin.role === AdminRole.SUPER_ADMIN &&
      newRole !== AdminRole.SUPER_ADMIN
    ) {
      const superAdminCount = await prisma.adminUser.count({
        where: { role: AdminRole.SUPER_ADMIN },
      });

      if (superAdminCount <= 1) {
        throw new Error("Cannot remove the last super admin");
      }
    }

    const updatedAdmin = await prisma.adminUser.update({
      where: { id: targetAdminId },
      data: { role: newRole },
    });

    return this.mapAdminUser(updatedAdmin);
  }

  /**
   * Delete admin user (super admin only)
   */
  async deleteAdmin(
    targetAdminId: string,
    requestingAdminId: string,
  ): Promise<boolean> {
    // Check if requesting admin is super admin
    const requestingAdmin = await prisma.adminUser.findUnique({
      where: { id: requestingAdminId },
    });

    if (!requestingAdmin || requestingAdmin.role !== AdminRole.SUPER_ADMIN) {
      throw new Error("Unauthorized: Only super admins can delete admin users");
    }

    // Prevent self-deletion
    if (targetAdminId === requestingAdminId) {
      throw new Error("Cannot delete your own account");
    }

    // Check if target admin exists
    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id: targetAdminId },
    });

    if (!targetAdmin) {
      throw new Error("Target admin not found");
    }

    // Prevent deleting the last super admin
    if (targetAdmin.role === AdminRole.SUPER_ADMIN) {
      const superAdminCount = await prisma.adminUser.count({
        where: { role: AdminRole.SUPER_ADMIN },
      });

      if (superAdminCount <= 1) {
        throw new Error("Cannot delete the last super admin");
      }
    }

    await prisma.adminUser.delete({
      where: { id: targetAdminId },
    });

    return true;
  }

  /**
   * Check if user has required permission
   */
  hasPermission(admin: AdminUser, requiredRole: AdminRole): boolean {
    if (admin.role === AdminRole.SUPER_ADMIN) {
      return true; // Super admin has all permissions
    }

    return admin.role === requiredRole;
  }

  /**
   * Initialize default super admin if none exists
   */
  async initializeDefaultAdmin(): Promise<void> {
    const adminCount = await prisma.adminUser.count();

    if (adminCount === 0) {
      const defaultEmail =
        process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
      const defaultName = process.env.DEFAULT_ADMIN_NAME || "Super Admin";

      await this.createAdmin(
        defaultEmail,
        defaultPassword,
        defaultName,
        AdminRole.SUPER_ADMIN,
      );

      console.log(`Default admin created with email: ${defaultEmail}`);
    }
  }

  /**
   * Generate access token with refresh capability
   */
  generateTokenWithRefresh(
    adminId: string,
    role: AdminRole,
  ): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = sign({ adminId, role, type: "access" }, JWT_SECRET, {
      expiresIn: "15m",
    } as any);

    const refreshToken = sign({ adminId, role, type: "refresh" }, JWT_SECRET, {
      expiresIn: "7d",
    } as any);

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    admin: AdminUser;
  }> {
    try {
      const decoded = verify(refreshToken, JWT_SECRET) as {
        adminId: string;
        role: AdminRole;
        type: string;
      };

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      const admin = await prisma.adminUser.findUnique({
        where: { id: decoded.adminId },
      });

      if (!admin) {
        throw new Error("Admin not found");
      }

      const accessToken = sign(
        { adminId: admin.id, role: admin.role, type: "access" },
        JWT_SECRET,
        { expiresIn: "15m" } as any,
      );

      return {
        accessToken,
        admin: this.mapAdminUser(admin),
      };
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Private helper methods
   */
  private generateToken(adminId: string, role: AdminRole): string {
    return sign({ adminId, role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as any);
  }

  private extractTokenFromRequest(req: NextRequest): string | null {
    // Try to get token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    // Try to get token from cookie
    const token = req.cookies.get("admin_access_token")?.value;
    if (token) {
      return token;
    }

    return null;
  }

  private mapAdminUser(admin: any): AdminUser {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}

export const adminAuthService = new AdminAuthService();
