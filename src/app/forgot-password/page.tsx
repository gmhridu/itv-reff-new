"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Phone,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  KeyRound,
  MessageCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOTPSent, setIsOTPSent] = useState(false);

  const getFullYear = () => {
    return new Date().getFullYear();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 DEBUG: Forgot password form submitted');
    console.log('🔍 DEBUG: Phone number entered:', phone);

    setIsLoading(true);
    setError("");
    setSuccess("");

    // Concatenate the country code prefix with the entered digits
    const fullPhoneNumber = `+92${phone}`;
    console.log('🔍 DEBUG: Full phone number with country code:', fullPhoneNumber);

    try {
      console.log('🔍 DEBUG: Calling forgot-password API...');
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: fullPhoneNumber }),
      });

      console.log('🔍 DEBUG: API response status:', response.status);
      const data = await response.json();
      console.log('🔍 DEBUG: API response data:', data);

      if (response.ok) {
        console.log('✅ DEBUG: API call successful');
        setSuccess("Password reset code has been sent to your WhatsApp.");
        setIsOTPSent(true);
        // Redirect to OTP verification page after 2 seconds with full international number
        setTimeout(() => {
          const fullPhoneNumber = `+92${phone}`;
          router.push(`/verify-otp?phone=${encodeURIComponent(fullPhoneNumber)}`);
        }, 2000);
      } else {
        console.error('❌ DEBUG: API call failed:', data);
        setError(data.error || "Failed to send reset code");
      }
    } catch (error) {
      console.error("❌ DEBUG: Network error:", error);
      setError("Please try again.");
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
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>

        {/* Reset Password Card */}
        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-black/10 dark:shadow-black/30 relative">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Reset Password
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
              We'll send you a verification code via WhatsApp
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

            {!isOTPSent ? (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Phone Number *
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-sm select-none">
                        +92
                      </span>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                    </div>
                    {/* <Phone className="absolute left-16 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors duration-200" /> */}
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="3xx xxxxxxx"
                      value={phone}
                      onChange={(e) => {
                        // Remove any non-digit characters and limit to 10 digits
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(value);
                      }}
                      className="bg-slate-50/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 pl-20 pr-4 h-12 rounded-xl transition-all duration-200"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enter your 10-digit mobile number without country code
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold py-3 h-12 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Send Verification Code</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Code Sent!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    We've sent a verification code to{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {phone}
                    </span>
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4 text-green-600 dark:text-green-400 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium mb-2">Check your WhatsApp</p>
                      <p className="text-xs leading-relaxed">
                        The verification code will expire in 10 minutes. Make sure your WhatsApp is active.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl h-11 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      setIsOTPSent(false);
                      setSuccess("");
                      setPhone("");
                    }}
                  >
                    Try another phone number
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl h-11 transition-all duration-200 cursor-pointer"
                    onClick={() => router.push("/")}
                  >
                    Back to login
                  </Button>
                </div>
              </div>
            )}

            {!isOTPSent && (
              <>
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
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Sign in instead
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        {!isOTPSent && (
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <h3 className="text-slate-900 dark:text-slate-100 font-medium mb-4">
                Having trouble?
              </h3>
              <div className="space-y-2 text-slate-600 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  Make sure you're using the phone number associated with your
                  account
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  Ensure WhatsApp is installed and active on your phone
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                  The verification code will expire in 10 minutes
                </p>
              </div>
            </div>
          </div>
        )}

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
