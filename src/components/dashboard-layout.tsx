import { DashboardScrollableLayout } from "@/components/scrollable-layout";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    walletBalance: number;
    referralCode: string;
  };
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  return (
    <DashboardScrollableLayout user={user}>
      {children}
    </DashboardScrollableLayout>
  );
}
