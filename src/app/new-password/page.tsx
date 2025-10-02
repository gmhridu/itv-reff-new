"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Shield,
} from "lucide-react";

function NewPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phone, setPhone] = useState("");
  const [resetToken, setResetToken] = useState("");

  const getFullYear = () => {
    return new Date().getFullYear();
  };

  // Get phone and token from URL params
  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    const tokenParam = searchParams.get('token');

    if (phoneParam) {
      setPhone(phoneParam);
    } else {
      router.push('/forgot-password');
    }

    if (tokenParam) {
      setResetToken(tokenParam);
    } else {
      router.push('/verify-otp');
    }
  }, [searchParams, router]);

  const validatePassword = (password: string) => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return errors;
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(", "));
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 DEBUG: New password form submitted');
      console.log('🔍 DEBUG: Phone:', phone);
      console.log('🔍 DEBUG: Reset token:', resetToken);
      console.log('🔍 DEBUG: New password length:', newPassword.length);

      const requestBody = {
        token: resetToken,
        password: newPassword
      };
      console.log('🔍 DEBUG: Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password has been reset successfully! You can now sign in with your new password.");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 cursor-pointer"
          onClick={() => router.push("/verify-otp")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to verification
        </Button>

        {/* New Password Card */}
        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-black/10 dark:shadow-black/30 relative">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              New Password
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
              Enter your new secure password
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                {success}
              </div>
            )}

            <form onSubmit={handleSetNewPassword} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-slate-700 dark:text-slate-300 font-medium"
                >
                  New Password *
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 w-5 h-5 transition-colors duration-200" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 pl-12 pr-12 h-12 rounded-xl transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-slate-700 dark:text-slate-300 font-medium"
                >
                  Confirm New Password *
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 w-5 h-5 transition-colors duration-200" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-green-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 pl-12 pr-12 h-12 rounded-xl transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Password Requirements
                </h4>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <p className={newPassword.length >= 8 ? "text-green-600" : ""}>
                    ✓ At least 8 characters long
                  </p>
                  <p className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ One uppercase letter (A-Z)
                  </p>
                  <p className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ One lowercase letter (a-z)
                  </p>
                  <p className={/\d/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ One number (0-9)
                  </p>
                  <p className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-green-600" : ""}>
                    ✓ One special character (!@#$%^&*)
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 h-12 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Update Password</span>
                    <CheckCircle className="ml-2 h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Remember your password?
                </span>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Back to sign in
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 dark:text-slate-400 text-sm">
          <p className="flex items-center justify-center gap-2">
            <span>© {getFullYear()} ICL FINANCE.</span>
            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span>All rights reserved.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-black/10 dark:shadow-black/30">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading...</span>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewPasswordForm />
    </Suspense>
  );
}
