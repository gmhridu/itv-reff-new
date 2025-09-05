'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Gift } from 'lucide-react';

interface RegisterFormProps {
  registerAction: (prevState: any, formData: FormData) => Promise<any>;
}

export default function RegisterForm({ registerAction }: RegisterFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(registerAction, { error: null });



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-4">
            <div className="w-8 h-8 bg-white rounded-lg transform rotate-45"></div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">VideoTask Rewards</h1>
          <p className="text-gray-300">Create your account and start earning</p>
        </div>

        {/* Registration Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Join VideoTask Rewards and start earning today
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
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
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
                <Label htmlFor="phone" className="text-gray-300">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10 pr-10"
                    disabled={isPending}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPending}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode" className="text-gray-300">Referral Code (Optional)</Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                    disabled={isPending}
                  />
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
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-gray-400 text-sm">Already have an account? </span>
              <button
                onClick={() => router.push('/')}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                Sign in
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>© 2024 VideoTask Rewards. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
