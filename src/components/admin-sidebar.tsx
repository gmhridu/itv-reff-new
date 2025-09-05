
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Video,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const navItems = [
  { href: "/admin/analytics", icon: LayoutDashboard, label: "Analytics" },
  { href: "/admin/video-upload", icon: Video, label: "Video Upload" },
  { href: "/admin/user-management", icon: Users, label: "User Management" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        "relative min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <h1 className="text-2xl font-bold">Admin</h1>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>
      <nav className="flex flex-col p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} passHref>
            <Button
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn("w-full flex items-center", isCollapsed ? "justify-center" : "justify-start")}
            >
              <item.icon className="mr-2" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
}
