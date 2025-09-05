"use client";

import { useActionState, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface AdminLoginProps {
  loginAction: (prevState: any, formData: FormData) => Promise<any>;
  className?: string;
}

export default function AdminLogin({ loginAction }: AdminLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
  });

  const getFullYear = () => {
    return new Date().getFullYear();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10 pr-10"
                    disabled={isPending}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>© {getFullYear()} VideoTask Rewards. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
