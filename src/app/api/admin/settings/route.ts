import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/lib/admin/settings-service";
import { ApiResponse, SettingCategory } from "@/types/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as SettingCategory;

    if (category) {
      // Get settings for specific category
      if (
        !["system", "permissions", "content", "notifications", "api"].includes(
          category,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid category",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const settings = await settingsService.getSettingsByCategory(category);

      return NextResponse.json(
        {
          success: true,
          data: settings,
        } as ApiResponse,
        { status: 200 },
      );
    } else {
      // Get all settings
      const settings = await settingsService.getAllSettings();

      return NextResponse.json(
        {
          success: true,
          data: settings,
        } as ApiResponse,
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Settings API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch settings",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as SettingCategory;
    const body = await req.json();

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category is required",
        } as ApiResponse,
        { status: 400 },
      );
    }

    if (
      !["system", "permissions", "content", "notifications", "api"].includes(
        category,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid category",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // Update settings for the category
    const updatedSettings = await settingsService.updateSettingsByCategory(
      category,
      body,
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedSettings,
        message: `${category} settings updated successfully`,
      } as ApiResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Update settings API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "reset") {
      const category = searchParams.get("category") as SettingCategory;

      if (
        category &&
        !["system", "permissions", "content", "notifications", "api"].includes(
          category,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid category",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const settings = await settingsService.resetToDefaults(category);

      return NextResponse.json(
        {
          success: true,
          data: settings,
          message: category
            ? `${category} settings reset to defaults`
            : "All settings reset to defaults",
        } as ApiResponse,
        { status: 200 },
      );
    }

    if (action === "export") {
      const settingsJson = await settingsService.exportSettings();

      return NextResponse.json(
        {
          success: true,
          data: settingsJson,
          message: "Settings exported successfully",
        } as ApiResponse,
        { status: 200 },
      );
    }

    if (action === "import") {
      const body = await req.json();
      const { settingsJson } = body;

      if (!settingsJson || typeof settingsJson !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "Valid settings JSON is required",
          } as ApiResponse,
          { status: 400 },
        );
      }

      const settings = await settingsService.importSettings(settingsJson);

      return NextResponse.json(
        {
          success: true,
          data: settings,
          message: "Settings imported successfully",
        } as ApiResponse,
        { status: 200 },
      );
    }

    if (action === "maintenance") {
      const body = await req.json();
      const { enabled } = body;

      if (typeof enabled !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error: "Enabled flag must be a boolean",
          } as ApiResponse,
          { status: 400 },
        );
      }

      await settingsService.setMaintenanceMode(enabled);

      return NextResponse.json(
        {
          success: true,
          data: { maintenanceMode: enabled },
          message: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
        } as ApiResponse,
        { status: 200 },
      );
    }

    if (action === "initialize") {
      await settingsService.initializeDefaultSettings();

      const settings = await settingsService.getAllSettings();

      return NextResponse.json(
        {
          success: true,
          data: settings,
          message: "Default settings initialized successfully",
        } as ApiResponse,
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      } as ApiResponse,
      { status: 400 },
    );
  } catch (error) {
    console.error("Settings action API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform settings action",
        message: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 },
    );
  }
}
