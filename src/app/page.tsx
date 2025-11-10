import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import MaintenancePage from "@/components/MaintenancePage";
import { getUserFromServer, loginAction } from "@/lib/api/auth";

export default async function LoginPage() {
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  const user = await getUserFromServer();
  if (user) redirect("/dashboard");

  return (
      <LoginForm loginAction={loginAction} />
  );
}
