import { redirect } from "next/navigation";
import DashboardOverview from "@/components/dashboard-overview";
import DashboardMenuNavigation from "@/components/DashboardMenuNavigation";
import { getUserFromServer } from "@/lib/api/auth";

export default async function DashboardPage() {
  const user = await getUserFromServer();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 relative">
      {/* Main Content */}
      <div className="pb-20 sm:pb-24">
        <DashboardOverview />
      </div>

      {/* Mobile Navigation */}
      <DashboardMenuNavigation />
    </div>
  );
}
