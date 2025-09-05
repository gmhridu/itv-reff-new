"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  ChartNoAxesCombined,
  CloudUpload,
  Users,
  Settings,
  LogOut,
  SquareUserRound,
} from "lucide-react";

interface AdminUser {
  name: string;
  email: string;
  role: string;
}

interface ModernAdminSidebarProps {
  adminUser?: AdminUser;
  onLogout?: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutGrid,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Video Upload",
    url: "/admin/video-upload",
    icon: CloudUpload,
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
];

export default function ModernAdminSidebar({ adminUser, onLogout }: ModernAdminSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <SquareUserRound className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <h2 className="text-base sm:text-lg font-semibold truncate">Admin Panel</h2>
            <p className="text-xs text-muted-foreground truncate">Management Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
              >
                <Link href={item.url} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {adminUser && (
          <div className="px-3 sm:px-4 py-3">
            <div className="flex items-center gap-2 mb-3 group-data-[collapsible=icon]:justify-center">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {adminUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium truncate">{adminUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{adminUser.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 flex-shrink-0 group-data-[collapsible=icon]:mr-0 mr-2" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}