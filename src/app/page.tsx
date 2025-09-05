import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getUserFromServer, loginAction } from "@/lib/api/auth";


export default async function LoginPage() {
  const user = await getUserFromServer();
  if (user) redirect("/dashboard");

  return (
      <LoginForm loginAction={loginAction} />
  );
}
