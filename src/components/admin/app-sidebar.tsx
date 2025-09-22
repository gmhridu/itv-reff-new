"use client";

import * as React from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  GalleryVerticalEnd,
  Image,
  MicIcon,
  Settings,
  Upload,
  Users,
  Shield,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { SidebarBrand } from "@/components/sidebar-brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

interface SidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "SUPER_ADMIN";
    avatar?: string;
  } | null;
}

interface PendingCounts {
  topup: number;
  withdrawal: number;
}

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  brand: {
    name: "Admin Dashboard",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  getNavMain: (pendingCounts: PendingCounts) => [
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Video Management",
      url: "/admin/video-upload",
      icon: Upload,
    },
    {
      title: "Slider Management",
      url: "/admin/slider-management",
      icon: Image,
    },
    {
      title: "Announcements Management",
      url: "/admin/announcements",
      icon: MicIcon,
    },
    {
      title: "Topup Management",
      url: "/admin/topup-management",
      icon: ArrowUpCircle,
      badge: pendingCounts.topup > 0 ? pendingCounts.topup : undefined,
    },
    {
      title: "Withdrawal Management",
      url: "/admin/withdrawal-management",
      icon: ArrowDownCircle,
      badge:
        pendingCounts.withdrawal > 0 ? pendingCounts.withdrawal : undefined,
    },
    {
      title: "Security Refunds",
      url: "/admin/security-refunds",
      icon: Shield,
    },
    {
      title: "User Management",
      url: "/admin/user-management",
      icon: Users,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ user, ...props }: SidebarProps) {
  const [pendingCounts, setPendingCounts] = React.useState<PendingCounts>({
    topup: 0,
    withdrawal: 0,
  });
  const [loading, setLoading] = React.useState(true);

  // Fetch pending counts
  const fetchPendingCounts = React.useCallback(async () => {
    try {
      const [topupResponse, withdrawalResponse] = await Promise.all([
        fetch("/api/admin/topup-history?status=PENDING&limit=1"),
        fetch("/api/admin/withdrawal-management?status=PENDING&limit=1"),
      ]);

      const [topupData, withdrawalData] = await Promise.all([
        topupResponse.json(),
        withdrawalResponse.json(),
      ]);

      setPendingCounts({
        topup: topupData.success ? topupData.data.statistics.pending || 0 : 0,
        withdrawal: withdrawalData.success
          ? withdrawalData.data.statistics.pending || 0
          : 0,
      });
    } catch (error) {
      console.error("Error fetching pending counts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCounts]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarBrand
          name={data.brand.name}
          logo={data.brand.logo}
          plan={data.brand.plan}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.getNavMain(pendingCounts)} />
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <NavUser
            user={{
              ...user,
              avatar: user.avatar || "/avatars/shadcn.jpg",
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
