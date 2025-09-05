"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import ModernAdminSidebar from "./ModernAdminSidebar";
import { Separator } from "@/components/ui/separator";

interface AdminUser {
  name: string;
  email: string;
  role: string;
}

interface ModernAdminLayoutProps {
  children: React.ReactNode;
  adminUser?: AdminUser;
  onLogout?: () => void;
}

export default function ModernAdminLayout({ 
  children, 
  adminUser, 
  onLogout 
}: ModernAdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="relative flex h-screen w-full overflow-hidden">
        <ModernAdminSidebar adminUser={adminUser} onLogout={onLogout} />
        <SidebarInset className="flex-1 min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 w-full min-w-0">
              <div className="w-full max-w-full overflow-hidden">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}