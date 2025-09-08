import { redirect } from "next/navigation";
import DashboardOverview from "@/components/dashboard-overview";
import DashboardMenuNavigation from "@/components/DashboardMenuNavigation";
import { getUserFromServer } from "@/lib/api/auth";

export default async function DashboardPage() {
  const user = await getUserFromServer();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative">
      {/* Main Content */}
      <div className="">
        <DashboardOverview />
      </div>

      {/* Mobile Navigation */}
      <DashboardMenuNavigation />
    </div>
  );
}
