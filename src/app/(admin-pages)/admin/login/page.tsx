import AdminLogin from "@/components/admin/AdminLogin";
import { adminLoginAction, getAdminFromServer } from "@/lib/api/auth";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  const admin = await getAdminFromServer();

  if (admin) redirect("/admin/analytics");

  return <AdminLogin loginAction={adminLoginAction} />;
}
