import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import DashboardOverview from "@/components/dashboard-overview";
import { getUserFromServer } from "@/lib/api/auth";

export default async function DashboardPage() {
  const user = await getUserFromServer();
  if (!user) redirect("/");

  return (
      <DashboardOverview />
  );
}
