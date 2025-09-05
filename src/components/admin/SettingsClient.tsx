"use client";

/**
 * SettingsClient Component
 *
 * A comprehensive settings management interface for the ITV Reference System admin panel.
 * This component provides:
 *
 * - Dynamic data fetching from the settings API
 * - Real-time form updates with optimistic UI
 * - Settings organized by categories (System, Permissions, Content, Notifications, API)
 * - Import/Export functionality for settings backup and migration
 * - Reset to defaults functionality per category or globally
 * - Auto-initialization of default settings on first run
 * - Error handling and loading states
 * - Toast notifications for user feedback
 *
 * Features:
 * - System settings: Site configuration, maintenance mode, withdrawal limits
 * - Permission settings: User roles, verification requirements, referral system
 * - Content settings: File upload limits, moderation, video formats
 * - Notification settings: Email, SMS, push notifications configuration
 * - API settings: Rate limiting, webhook URLs, analytics integration
 *
 * The component automatically initializes default settings if none exist,
 * and provides a user-friendly interface for administrators to manage
 * all system configurations from a single location.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Upload, RotateCcw } from "lucide-react";
import {
  AllSettings,
  SystemSettings,
  PermissionSettings,
  ContentSettings,
  NotificationSettings,
  ApiSettings,
  SettingCategory,
  ApiResponse,
} from "@/types/admin";

interface SettingsState {
  settings: AllSettings | null;
  loading: boolean;
  saving: Record<string, boolean>;
  errors: Record<string, string>;
}

export function SettingsClient() {
  const [state, setState] = useState<SettingsState>({
    settings: null,
    loading: true,
    saving: {},
    errors: {},
  });

  const { toast } = useToast();

  // Fetch all settings on component mount
  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, errors: {} }));

      const response = await fetch("/api/admin/settings");
      const result: ApiResponse<AllSettings> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch settings");
      }

      setState((prev) => ({
        ...prev,
        settings: result.data!,
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // If no settings found, try to initialize defaults
      if (
        errorMessage.includes("No settings") ||
        errorMessage.includes("not found")
      ) {
        await initializeDefaultSettings();
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        errors: { general: errorMessage },
      }));

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const initializeDefaultSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings?action=initialize", {
        method: "POST",
      });

      const result: ApiResponse<AllSettings> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to initialize settings");
      }

      setState((prev) => ({
        ...prev,
        settings: result.data!,
        loading: false,
      }));

      toast({
        title: "Success",
        description: "Default settings initialized successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        loading: false,
        errors: { general: errorMessage },
      }));

      toast({
        title: "Error",
        description: `Failed to initialize settings: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const updateCategorySettings = async (
    category: SettingCategory,
    updates: Record<string, any>,
  ) => {
    try {
      setState((prev) => ({
        ...prev,
        saving: { ...prev.saving, [category]: true },
        errors: { ...prev.errors, [category]: "" },
      }));

      const response = await fetch(`/api/admin/settings?category=${category}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update settings");
      }

      // Update local state with new values
      setState((prev) => ({
        ...prev,
        settings: prev.settings
          ? {
              ...prev.settings,
              [category]: { ...prev.settings[category], ...updates },
            }
          : null,
        saving: { ...prev.saving, [category]: false },
      }));

      toast({
        title: "Success",
        description:
          result.message || `${category} settings updated successfully`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        saving: { ...prev.saving, [category]: false },
        errors: { ...prev.errors, [category]: errorMessage },
      }));

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetToDefaults = async (category?: SettingCategory) => {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        errors: { ...prev.errors, reset: "" },
      }));

      const url = category
        ? `/api/admin/settings?action=reset&category=${category}`
        : `/api/admin/settings?action=reset`;

      const response = await fetch(url, {
        method: "POST",
      });

      const result: ApiResponse<AllSettings> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to reset settings");
      }

      setState((prev) => ({
        ...prev,
        settings: result.data!,
        loading: false,
      }));

      toast({
        title: "Success",
        description: result.message || "Settings reset to defaults",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        loading: false,
        errors: { ...prev.errors, reset: errorMessage },
      }));

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const exportSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings?action=export", {
        method: "POST",
      });

      const result: ApiResponse<string> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to export settings");
      }

      // Download the settings as a JSON file
      const blob = new Blob([result.data!], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settings-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Settings exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to export settings",
        variant: "destructive",
      });
    }
  };

  const importSettings = async (file: File) => {
    try {
      const text = await file.text();

      const response = await fetch("/api/admin/settings?action=import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settingsJson: text }),
      });

      const result: ApiResponse<AllSettings> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to import settings");
      }

      setState((prev) => ({
        ...prev,
        settings: result.data!,
      }));

      toast({
        title: "Success",
        description: "Settings imported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to import settings",
        variant: "destructive",
      });
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      importSettings(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid JSON file",
        variant: "destructive",
      });
    }
  };

  if (state.loading && !state.settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (state.errors.general) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{state.errors.general}</p>
        <Button onClick={fetchAllSettings}>Retry</Button>
      </div>
    );
  }

  if (!state.settings) {
    return <div>No settings data available</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportSettings}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => resetToDefaults()}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <SystemSettingsCard
            settings={state.settings.system}
            onSave={(updates) => updateCategorySettings("system", updates)}
            loading={state.saving.system}
            error={state.errors.system}
            onReset={() => resetToDefaults("system")}
          />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionSettingsCard
            settings={state.settings.permissions}
            onSave={(updates) => updateCategorySettings("permissions", updates)}
            loading={state.saving.permissions}
            error={state.errors.permissions}
            onReset={() => resetToDefaults("permissions")}
          />
        </TabsContent>

        <TabsContent value="content">
          <ContentSettingsCard
            settings={state.settings.content}
            onSave={(updates) => updateCategorySettings("content", updates)}
            loading={state.saving.content}
            error={state.errors.content}
            onReset={() => resetToDefaults("content")}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettingsCard
            settings={state.settings.notifications}
            onSave={(updates) =>
              updateCategorySettings("notifications", updates)
            }
            loading={state.saving.notifications}
            error={state.errors.notifications}
            onReset={() => resetToDefaults("notifications")}
          />
        </TabsContent>

        <TabsContent value="api">
          <ApiSettingsCard
            settings={state.settings.api}
            onSave={(updates) => updateCategorySettings("api", updates)}
            loading={state.saving.api}
            error={state.errors.api}
            onReset={() => resetToDefaults("api")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// System Settings Card Component
function SystemSettingsCard({
  settings,
  onSave,
  loading,
  error,
  onReset,
}: {
  settings: SystemSettings;
  onSave: (updates: Partial<SystemSettings>) => void;
  loading?: boolean;
  error?: string;
  onReset: () => void;
}) {
  const [formData, setFormData] = useState<SystemSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>Manage your system settings.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={formData.siteName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, siteName: e.target.value }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
            <Switch
              id="maintenanceMode"
              checked={formData.maintenanceMode}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, maintenanceMode: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="registrationEnabled">Registration Enabled</Label>
            <Switch
              id="registrationEnabled"
              checked={formData.registrationEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  registrationEnabled: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="referralSystemEnabled">
              Referral System Enabled
            </Label>
            <Switch
              id="referralSystemEnabled"
              checked={formData.referralSystemEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  referralSystemEnabled: checked,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimumWithdrawal">Minimum Withdrawal</Label>
              <Input
                id="minimumWithdrawal"
                type="number"
                value={formData.minimumWithdrawal}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minimumWithdrawal: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDailyWithdrawals">Max Daily Withdrawals</Label>
              <Input
                id="maxDailyWithdrawals"
                type="number"
                value={formData.maxDailyWithdrawals}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxDailyWithdrawals: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="videoWatchTimeThreshold">
                Video Watch Time Threshold (%)
              </Label>
              <Input
                id="videoWatchTimeThreshold"
                type="number"
                min="0"
                max="100"
                value={formData.videoWatchTimeThreshold}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    videoWatchTimeThreshold: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={formData.sessionTimeout}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sessionTimeout: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Permission Settings Card Component
function PermissionSettingsCard({
  settings,
  onSave,
  loading,
  error,
  onReset,
}: {
  settings: PermissionSettings;
  onSave: (updates: Partial<PermissionSettings>) => void;
  loading?: boolean;
  error?: string;
  onReset: () => void;
}) {
  const [formData, setFormData] = useState<PermissionSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Permissions</CardTitle>
            <CardDescription>
              Manage user roles and permissions.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="defaultUserRole">Default User Role</Label>
            <Select
              value={formData.defaultUserRole}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, defaultUserRole: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoApproveUsers">Auto-approve Users</Label>
            <Switch
              id="autoApproveUsers"
              checked={formData.autoApproveUsers}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, autoApproveUsers: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requireEmailVerification">
              Require Email Verification
            </Label>
            <Switch
              id="requireEmailVerification"
              checked={formData.requireEmailVerification}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  requireEmailVerification: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="requirePhoneVerification">
              Require Phone Verification
            </Label>
            <Switch
              id="requirePhoneVerification"
              checked={formData.requirePhoneVerification}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  requirePhoneVerification: checked,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxReferralLevels">Max Referral Levels</Label>
            <Input
              id="maxReferralLevels"
              type="number"
              min="1"
              max="10"
              value={formData.maxReferralLevels}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxReferralLevels: Number(e.target.value),
                }))
              }
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Content Settings Card Component
function ContentSettingsCard({
  settings,
  onSave,
  loading,
  error,
  onReset,
}: {
  settings: ContentSettings;
  onSave: (updates: Partial<ContentSettings>) => void;
  loading?: boolean;
  error?: string;
  onReset: () => void;
}) {
  const [formData, setFormData] = useState<ContentSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>
              Manage content moderation and upload settings.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

          <div className="flex items-center justify-between">
            <Label htmlFor="autoApproveComments">Auto-approve Comments</Label>
            <Switch
              id="autoApproveComments"
              checked={formData.autoApproveComments}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  autoApproveComments: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoGenerateThumbnails">
              Auto-generate Thumbnails
            </Label>
            <Switch
              id="autoGenerateThumbnails"
              checked={formData.autoGenerateThumbnails}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  autoGenerateThumbnails: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="contentModerationEnabled">
              Content Moderation Enabled
            </Label>
            <Switch
              id="contentModerationEnabled"
              checked={formData.contentModerationEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  contentModerationEnabled: checked,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxVideoFileSize">Max Video File Size (MB)</Label>
            <Input
              id="maxVideoFileSize"
              type="number"
              min="1"
              value={formData.maxVideoFileSize}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxVideoFileSize: Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowedVideoFormats">Allowed Video Formats</Label>
            <Input
              id="allowedVideoFormats"
              value={formData.allowedVideoFormats.join(", ")}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  allowedVideoFormats: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="mp4, avi, mov"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Notification Settings Card Component
function NotificationSettingsCard({
  settings,
  onSave,
  loading,
  error,
  onReset,
}: {
  settings: NotificationSettings;
  onSave: (updates: Partial<NotificationSettings>) => void;
  loading?: boolean;
  error?: string;
  onReset: () => void;
}) {
  const [formData, setFormData] = useState<NotificationSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage notification settings.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotificationsEnabled">
              Email Notifications
            </Label>
            <Switch
              id="emailNotificationsEnabled"
              checked={formData.emailNotificationsEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  emailNotificationsEnabled: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="smsNotificationsEnabled">SMS Notifications</Label>
            <Switch
              id="smsNotificationsEnabled"
              checked={formData.smsNotificationsEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  smsNotificationsEnabled: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="pushNotificationsEnabled">Push Notifications</Label>
            <Switch
              id="pushNotificationsEnabled"
              checked={formData.pushNotificationsEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  pushNotificationsEnabled: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="adminEmailNotifications">
              Admin Email Notifications
            </Label>
            <Switch
              id="adminEmailNotifications"
              checked={formData.adminEmailNotifications}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  adminEmailNotifications: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="userWelcomeEmails">User Welcome Emails</Label>
            <Switch
              id="userWelcomeEmails"
              checked={formData.userWelcomeEmails}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, userWelcomeEmails: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="withdrawalNotifications">
              Withdrawal Notifications
            </Label>
            <Switch
              id="withdrawalNotifications"
              checked={formData.withdrawalNotifications}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  withdrawalNotifications: checked,
                }))
              }
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// API Settings Card Component
function ApiSettingsCard({
  settings,
  onSave,
  loading,
  error,
  onReset,
}: {
  settings: ApiSettings;
  onSave: (updates: Partial<ApiSettings>) => void;
  loading?: boolean;
  error?: string;
  onReset: () => void;
}) {
  const [formData, setFormData] = useState<ApiSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateNewApiKey = () => {
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setFormData((prev) => ({ ...prev, apiKey: newKey }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Manage API keys and integrations.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? "Hide" : "Show"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={generateNewApiKey}
              >
                Generate New
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rateLimitEnabled">Rate Limit Enabled</Label>
            <Switch
              id="rateLimitEnabled"
              checked={formData.rateLimitEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, rateLimitEnabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRequestsPerHour">Max Requests Per Hour</Label>
            <Input
              id="maxRequestsPerHour"
              type="number"
              min="1"
              value={formData.maxRequestsPerHour}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxRequestsPerHour: Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              value={formData.webhookUrl || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, webhookUrl: e.target.value }))
              }
              placeholder="https://your-webhook-endpoint.com"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="analyticsIntegration">Analytics Integration</Label>
            <Switch
              id="analyticsIntegration"
              checked={formData.analyticsIntegration}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  analyticsIntegration: checked,
                }))
              }
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
