import DashboardMenubarNavigation from "@/components/DashboardMenuNavigation";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative h-screen flex flex-col bg-gray-50 constrained-width">
      {/* Main content area with proper bottom padding to account for fixed navigation */}
      <div className="flex-1 min-h-screen overflow-y-auto pb-[80px]">
        <div className="min-h-full">
          {children}
        </div>
      </div>
      {/* Fixed navigation at bottom */}
      <DashboardMenubarNavigation />
    </div>
  );
}
