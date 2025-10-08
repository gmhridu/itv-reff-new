"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";

export default function BannedPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any remaining auth data from localStorage
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []);

  const handleLogout = () => {
    // Clear cookies and redirect to home
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Account Suspended
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your account has been banned and you no longer have access to this platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">
                <p className="font-medium">Access Denied</p>
                <p>You are not permitted to access any pages on this platform. This restriction has been put in place by our administrators.</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium">Need Help?</p>
                <p>If you believe this ban was issued in error, please contact our support team with your account details for assistance.</p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
