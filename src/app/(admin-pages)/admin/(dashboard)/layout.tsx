import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Separator } from "@/components/ui/separator";
import AdminBreadcrum from "@/components/admin/admin-breadcrum";
import { getAdminFromServer } from "@/lib/api/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminFromServer();

  // If no admin found, redirect to login (this is now handled by middleware)
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={admin} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <AdminBreadcrum />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
