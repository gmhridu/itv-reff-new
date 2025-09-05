import { db as prisma } from "@/lib/db";
import {
  AllSettings,
  SystemSettings,
  PermissionSettings,
  ContentSettings,
  NotificationSettings,
  ApiSettings,
  SettingCategory,
  SettingItem,
  SettingsUpdateForm,
} from "@/types/admin";

export class SettingsService {
  /**
   * Get all settings organized by category
   */
  async getAllSettings(): Promise<AllSettings> {
    const settings = await prisma.setting.findMany();
    const settingsMap = this.createSettingsMap(settings);

    return {
      system: this.getSystemSettings(settingsMap),
      permissions: this.getPermissionSettings(settingsMap),
      content: this.getContentSettings(settingsMap),
      notifications: this.getNotificationSettings(settingsMap),
      api: this.getApiSettings(settingsMap),
    };
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: SettingCategory): Promise<any> {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          startsWith: `${category}.`,
        },
      },
    });

    const settingsMap = this.createSettingsMap(settings);

    switch (category) {
      case "system":
        return this.getSystemSettings(settingsMap);
      case "permissions":
        return this.getPermissionSettings(settingsMap);
      case "content":
        return this.getContentSettings(settingsMap);
      case "notifications":
        return this.getNotificationSettings(settingsMap);
      case "api":
        return this.getApiSettings(settingsMap);
      default:
        throw new Error(`Invalid category: ${category}`);
    }
  }

  /**
   * Update settings by category
   */
  async updateSettingsByCategory(
    category: SettingCategory,
    updates: SettingsUpdateForm,
  ): Promise<any> {
    const settingsToUpdate: SettingItem[] = [];

    // Convert flat updates to setting items
    for (const [key, value] of Object.entries(updates)) {
      const settingKey = `${category}.${key}`;
      settingsToUpdate.push({
        key: settingKey,
        value: this.serializeValue(value),
        category,
        type: this.inferType(value),
      });
    }

    // Update or create settings
    await Promise.all(
      settingsToUpdate.map((setting) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            updatedAt: new Date(),
          },
          create: {
            key: setting.key,
            value: setting.value,
          },
        }),
      ),
    );

    // Return updated settings for the category
    return this.getSettingsByCategory(category);
  }

  /**
   * Update a single setting
   */
  async updateSetting(key: string, value: any): Promise<SettingItem> {
    const serializedValue = this.serializeValue(value);

    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value: serializedValue,
        updatedAt: new Date(),
      },
      create: {
        key,
        value: serializedValue,
      },
    });

    return {
      key: setting.key,
      value: this.deserializeValue(setting.value),
      category: this.getCategoryFromKey(key),
      type: this.inferType(value),
    };
  }

  /**
   * Get a single setting by key
   */
  async getSetting(key: string): Promise<SettingItem | null> {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) return null;

    return {
      key: setting.key,
      value: this.deserializeValue(setting.value),
      category: this.getCategoryFromKey(key),
      type: this.inferType(this.deserializeValue(setting.value)),
    };
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(category?: SettingCategory): Promise<AllSettings> {
    const defaultSettings = this.getDefaultSettings();

    if (category) {
      // Reset specific category
      const categoryDefaults = defaultSettings[category];
      await this.updateSettingsByCategory(category, categoryDefaults);
    } else {
      // Reset all settings
      for (const [cat, settings] of Object.entries(defaultSettings)) {
        await this.updateSettingsByCategory(cat as SettingCategory, settings);
      }
    }

    return this.getAllSettings();
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaultSettings(): Promise<void> {
    const existingSettings = await prisma.setting.count();

    if (existingSettings === 0) {
      const defaults = this.getDefaultSettings();

      for (const [category, settings] of Object.entries(defaults)) {
        await this.updateSettingsByCategory(
          category as SettingCategory,
          settings,
        );
      }
    }
  }

  /**
   * Export settings as JSON
   */
  async exportSettings(): Promise<string> {
    const settings = await this.getAllSettings();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  async importSettings(settingsJson: string): Promise<AllSettings> {
    try {
      const settings: AllSettings = JSON.parse(settingsJson);

      // Validate structure
      this.validateSettingsStructure(settings);

      // Update each category
      for (const [category, categorySettings] of Object.entries(settings)) {
        await this.updateSettingsByCategory(
          category as SettingCategory,
          categorySettings,
        );
      }

      return this.getAllSettings();
    } catch (error) {
      throw new Error(`Invalid settings format: ${error}`);
    }
  }

  /**
   * Get maintenance mode status
   */
  async getMaintenanceMode(): Promise<boolean> {
    const setting = await this.getSetting("system.maintenanceMode");
    return setting?.value || false;
  }

  /**
   * Set maintenance mode
   */
  async setMaintenanceMode(enabled: boolean): Promise<void> {
    await this.updateSetting("system.maintenanceMode", enabled);
  }

  /**
   * Private helper methods
   */
  private createSettingsMap(settings: any[]): Map<string, any> {
    const map = new Map();
    settings.forEach((setting) => {
      map.set(setting.key, this.deserializeValue(setting.value));
    });
    return map;
  }

  private getSystemSettings(settingsMap: Map<string, any>): SystemSettings {
    return {
      siteName: settingsMap.get("system.siteName") || "ITV Reference System",
      maintenanceMode: settingsMap.get("system.maintenanceMode") || false,
      registrationEnabled:
        settingsMap.get("system.registrationEnabled") || true,
      referralSystemEnabled:
        settingsMap.get("system.referralSystemEnabled") || true,
      minimumWithdrawal: settingsMap.get("system.minimumWithdrawal") || 100,
      maxDailyWithdrawals: settingsMap.get("system.maxDailyWithdrawals") || 3,
      videoWatchTimeThreshold:
        settingsMap.get("system.videoWatchTimeThreshold") || 80,
      sessionTimeout: settingsMap.get("system.sessionTimeout") || 30,
    };
  }

  private getPermissionSettings(
    settingsMap: Map<string, any>,
  ): PermissionSettings {
    return {
      defaultUserRole: settingsMap.get("permissions.defaultUserRole") || "user",
      autoApproveUsers: settingsMap.get("permissions.autoApproveUsers") || true,
      requireEmailVerification:
        settingsMap.get("permissions.requireEmailVerification") || false,
      requirePhoneVerification:
        settingsMap.get("permissions.requirePhoneVerification") || false,
      maxReferralLevels: settingsMap.get("permissions.maxReferralLevels") || 3,
    };
  }

  private getContentSettings(settingsMap: Map<string, any>): ContentSettings {
    return {
      autoApproveComments:
        settingsMap.get("content.autoApproveComments") || true,
      maxVideoFileSize: settingsMap.get("content.maxVideoFileSize") || 500,
      allowedVideoFormats: settingsMap.get("content.allowedVideoFormats") || [
        "mp4",
        "avi",
        "mov",
      ],
      autoGenerateThumbnails:
        settingsMap.get("content.autoGenerateThumbnails") || true,
      contentModerationEnabled:
        settingsMap.get("content.contentModerationEnabled") || false,
    };
  }

  private getNotificationSettings(
    settingsMap: Map<string, any>,
  ): NotificationSettings {
    return {
      emailNotificationsEnabled:
        settingsMap.get("notifications.emailNotificationsEnabled") || true,
      smsNotificationsEnabled:
        settingsMap.get("notifications.smsNotificationsEnabled") || false,
      pushNotificationsEnabled:
        settingsMap.get("notifications.pushNotificationsEnabled") || false,
      adminEmailNotifications:
        settingsMap.get("notifications.adminEmailNotifications") || true,
      userWelcomeEmails:
        settingsMap.get("notifications.userWelcomeEmails") || true,
      withdrawalNotifications:
        settingsMap.get("notifications.withdrawalNotifications") || true,
    };
  }

  private getApiSettings(settingsMap: Map<string, any>): ApiSettings {
    return {
      apiKey: settingsMap.get("api.apiKey") || this.generateApiKey(),
      rateLimitEnabled: settingsMap.get("api.rateLimitEnabled") || true,
      maxRequestsPerHour: settingsMap.get("api.maxRequestsPerHour") || 1000,
      webhookUrl: settingsMap.get("api.webhookUrl") || null,
      analyticsIntegration:
        settingsMap.get("api.analyticsIntegration") || false,
    };
  }

  private getDefaultSettings(): AllSettings {
    return {
      system: {
        siteName: "ITV Reference System",
        maintenanceMode: false,
        registrationEnabled: true,
        referralSystemEnabled: true,
        minimumWithdrawal: 100,
        maxDailyWithdrawals: 3,
        videoWatchTimeThreshold: 80,
        sessionTimeout: 30,
      },
      permissions: {
        defaultUserRole: "user",
        autoApproveUsers: true,
        requireEmailVerification: false,
        requirePhoneVerification: false,
        maxReferralLevels: 3,
      },
      content: {
        autoApproveComments: true,
        maxVideoFileSize: 500,
        allowedVideoFormats: ["mp4", "avi", "mov"],
        autoGenerateThumbnails: true,
        contentModerationEnabled: false,
      },
      notifications: {
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        pushNotificationsEnabled: false,
        adminEmailNotifications: true,
        userWelcomeEmails: true,
        withdrawalNotifications: true,
      },
      api: {
        apiKey: this.generateApiKey(),
        rateLimitEnabled: true,
        maxRequestsPerHour: 1000,
        webhookUrl: null,
        analyticsIntegration: false,
      },
    };
  }

  private serializeValue(value: any): string {
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  private deserializeValue(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      // If it's not JSON, try to parse as primitive types
      if (value === "true") return true;
      if (value === "false") return false;
      if (!isNaN(Number(value)) && value !== "") return Number(value);
      return value;
    }
  }

  private inferType(
    value: any,
  ): "string" | "number" | "boolean" | "array" | "object" {
    if (Array.isArray(value)) return "array";
    if (typeof value === "object" && value !== null) return "object";
    return typeof value as "string" | "number" | "boolean";
  }

  private getCategoryFromKey(key: string): SettingCategory {
    const category = key.split(".")[0];
    if (
      ["system", "permissions", "content", "notifications", "api"].includes(
        category,
      )
    ) {
      return category as SettingCategory;
    }
    return "system";
  }

  private validateSettingsStructure(settings: AllSettings): void {
    const requiredCategories = [
      "system",
      "permissions",
      "content",
      "notifications",
      "api",
    ];

    for (const category of requiredCategories) {
      if (!settings[category as SettingCategory]) {
        throw new Error(`Missing required category: ${category}`);
      }
    }
  }

  private generateApiKey(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const settingsService = new SettingsService();
