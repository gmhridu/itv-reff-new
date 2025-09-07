import DashboardMenubarNavigation from "@/components/DashboardMenuNavigation";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative h-screen flex flex-col dashboard-bg-enhanced constrained-width">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-teal-400/8 to-emerald-400/8 rounded-full blur-3xl"></div>
      </div>

      {/* Main content area with proper bottom padding to account for fixed navigation */}
      <div className="flex-1 min-h-screen overflow-y-auto pb-[80px] relative z-10">
        <div className="min-h-full">{children}</div>
      </div>
      {/* Fixed navigation at bottom */}
      <DashboardMenubarNavigation />
    </div>
  );
}
