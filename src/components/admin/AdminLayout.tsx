"use client"

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import AdminSidebar from './AdminSidebar'
import ScrollableLayout from '@/components/scrollable-layout'

interface AdminLayoutProps {
  children: React.ReactNode
  adminUser?: {
    name: string
    email: string
    role: string
  }
  onLogout?: () => void
}

export default function AdminLayout({ children, adminUser, onLogout }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="relative flex h-screen w-full overflow-hidden">
        <AdminSidebar adminUser={adminUser} onLogout={onLogout} />
        <SidebarInset className="flex-1 min-w-0">
          <ScrollableLayout className="h-full w-full" showScrollbar={true}>
            <div className="p-3 sm:p-4 md:p-6 w-full min-w-0">
              <div className="w-full max-w-full overflow-hidden">
                {children}
              </div>
            </div>
          </ScrollableLayout>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}