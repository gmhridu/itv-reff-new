"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  Phone,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  KeyRound,
  MessageCircle,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Smartphone,
} from "lucide-react";

function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Auto-focus first OTP input
  useEffect(() => {
    if (otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const getFullYear = () => {
    return new Date().getFullYear();
  };

  // Get phone from URL params or redirect to forgot password
  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      setPhone(phoneParam);
    } else {
      router.push('/forgot-password');
    }
  }, [searchParams, router]);

  // Handle OTP input with individual digits
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = otp.split('');
    newOtp[index] = value;
    const updatedOtp = newOtp.join('');

    setOtp(updatedOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setIsResending(true);
    setError("");
    setCountdown(60); // 60 seconds countdown

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("New verification code sent to your WhatsApp!");
        setOtp("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to resend code");
        setCountdown(0);
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Please try again.");
      setCountdown(0);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 DEBUG: Verifying OTP:', otp);
    console.log('🔍 DEBUG: Phone:', phone);
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const requestBody = { phone, otp };
      console.log('🔍 DEBUG: Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('🔍 DEBUG: Verify OTP response:', data);

      if (response.ok) {
        setSuccess("OTP verified successfully! You can now set your new password.");
        setIsVerified(true);
        setResetToken(data.resetToken);
        // Redirect to new password page with the reset token
        setTimeout(() => {
          router.push(`/new-password?phone=${encodeURIComponent(phone)}&token=${data.resetToken}`);
        }, 2000);
      } else {
        setError(data.error || "Invalid or expired OTP code");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br transition-all duration-500 ${
      darkMode
        ? 'from-slate-900 via-slate-800 to-slate-900'
        : 'from-slate-50 via-white to-slate-100'
    } flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br transition-opacity duration-500 ${
          darkMode ? 'from-purple-600/20 to-pink-600/20' : 'from-purple-400/20 to-pink-400/20'
        } rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr transition-opacity duration-500 ${
          darkMode ? 'from-blue-600/20 to-cyan-600/20' : 'from-blue-400/20 to-cyan-400/20'
        } rounded-full blur-3xl animate-pulse delay-1000`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br transition-opacity duration-500 ${
          darkMode ? 'from-emerald-600/10 to-teal-600/10' : 'from-emerald-400/10 to-teal-400/10'
        } rounded-full blur-3xl animate-pulse delay-500`}></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          className={`mb-6 transition-all duration-300 hover:scale-105 ${
            darkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
          } rounded-xl backdrop-blur-sm`}
          onClick={() => router.push("/forgot-password")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to forgot password
        </Button>

        {/* Modern OTP Verification Card */}
        <Card className={`backdrop-blur-xl border-0 shadow-2xl transition-all duration-500 hover:shadow-3xl ${
          darkMode
            ? 'bg-slate-800/90 shadow-black/50'
            : 'bg-white/90 shadow-black/10'
        }`}>
          <CardHeader className="space-y-4 text-center pb-2">
            <div className="relative mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 ${
                darkMode
                  ? 'from-white to-slate-300'
                  : 'from-slate-900 to-slate-700'
              }`}>
                Verify Code
              </CardTitle>
              <CardDescription className={`text-lg transition-colors duration-300 ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Enter the 6-digit code sent to your WhatsApp
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Phone Number Display */}
            <div className={`relative group ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50/50'} rounded-2xl p-4 border transition-all duration-300 hover:scale-[1.02]`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  darkMode ? 'bg-slate-600' : 'bg-slate-200'
                }`}>
                  <Phone className={`w-5 h-5 transition-colors duration-300 ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Verification code sent to
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {showPhone ? phone : `+${phone.slice(0, 3)}***${phone.slice(-3)}`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPhone(!showPhone)}
                      className={`p-1 rounded transition-colors duration-200 hover:scale-110 ${
                        darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'
                      }`}
                    >
                      {showPhone ? (
                        <EyeOff className={`w-4 h-4 transition-colors duration-300 ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`} />
                      ) : (
                        <Eye className={`w-4 h-4 transition-colors duration-300 ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 text-red-600 dark:text-red-400 text-sm flex items-center gap-3 animate-shake`}>
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse"></div>
                <span className="flex-1">{error}</span>
              </div>
            )}

            {success && (
              <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-4 text-green-600 dark:text-green-400 text-sm flex items-center gap-3 animate-fade-in`}>
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse"></div>
                <span className="flex-1">{success}</span>
              </div>
            )}

            {!isVerified ? (
              <form onSubmit={handleVerifyOTP} className="space-y-8">
                {/* Modern OTP Input */}
                <div className="space-y-4">
                  <Label className={`text-center block font-semibold transition-colors duration-300 ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Enter Verification Code
                  </Label>

                  <div className="flex gap-3 justify-center">
                    {Array.from({ length: 6 }, (_, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={otp[index] || ''}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                        className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all duration-300 focus:scale-110 focus:rotate-1 ${
                          darkMode
                            ? 'bg-slate-800 border-slate-600 focus:border-blue-400 text-slate-100'
                            : 'bg-white border-slate-300 focus:border-blue-500 text-slate-900'
                        } focus:outline-none focus:ring-4 focus:ring-blue-500/20`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>

                  <p className={`text-center text-sm transition-colors duration-300 ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Enter the 6-digit code from your WhatsApp message
                  </p>
                </div>

                {/* Modern Submit Button */}
                <Button
                  type="submit"
                  className={`w-full h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-2xl transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-50`}
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      <span>Verifying Code...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Shield className="w-6 h-6" />
                      <span>Verify & Continue</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-8 animate-fade-in">
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                    <CheckCircle className="h-14 w-14 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-ping">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 ${
                    darkMode ? 'from-emerald-400 to-green-400' : 'from-emerald-600 to-green-600'
                  }`}>
                    Code Verified!
                  </h3>
                  <p className={`text-lg transition-colors duration-300 ${
                    darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Redirecting you to set your new password...
                  </p>
                  <div className={`w-32 h-1 mx-auto bg-gradient-to-r rounded-full animate-pulse ${
                    darkMode ? 'from-emerald-400 to-green-400' : 'from-emerald-500 to-green-500'
                  }`}></div>
                </div>
              </div>
            )}

            {!isVerified && (
              <>
                {/* Resend Section */}
                <div className="space-y-4">
                  <div className="relative">
                    <div className={`absolute inset-0 flex items-center transition-colors duration-300 ${
                      darkMode ? 'border-slate-700' : 'border-slate-200'
                    }`}>
                      <div className="w-full border-t"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className={`px-4 transition-colors duration-300 ${
                        darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'
                      }`}>
                        Didn't receive the code?
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 ${
                        darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>Resend in {countdown}s</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleResendOTP}
                        disabled={isResending}
                        className={`bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
                          darkMode
                            ? 'border-slate-600 text-slate-300 hover:border-blue-400 hover:text-blue-300'
                            : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {isResending ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>Resend Code</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        {!isVerified && (
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <h3 className="text-slate-900 dark:text-slate-100 font-medium mb-4">
                Having trouble?
              </h3>
              <div className="space-y-2 text-slate-600 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  Make sure WhatsApp is installed and active
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  Check if the code was delivered to your phone
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  The code will expire in 10 minutes
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

function LoadingFallback() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-black/10 dark:shadow-black/30">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading...</span>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyOTPForm />
    </Suspense>
  );
}
