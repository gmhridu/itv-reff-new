import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getUserFromServer, registerAction } from "@/lib/api/auth";

export default async function RegisterPage() {
  const user = await getUserFromServer();
  if (user) redirect("/dashboard");

  return <RegisterForm registerAction={registerAction} />;
}
