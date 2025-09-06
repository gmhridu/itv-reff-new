'use client';

import { useState, useActionState, useRef, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Gift, Shield } from 'lucide-react';

interface RegisterFormProps {
  registerAction: (prevState: any, formData: FormData) => Promise<any>;
}

export default function RegisterForm({ registerAction }: RegisterFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Generate a random CAPTCHA code
  function generateCaptchaCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Refresh CAPTCHA code
  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setUserCaptchaInput('');
    setCaptchaError('');
  };

  // Generate initial CAPTCHA on component mount
  useEffect(() => {
    setCaptchaCode(generateCaptchaCode());
  }, []);

  // Use useActionState with the registerAction
  const [state, formAction, isPending] = useActionState(registerAction, { error: null });

  // Handle redirect on successful registration
  useEffect(() => {
    if (state?.success && state?.redirectPath) {
      router.push(state.redirectPath);
    }
  }, [state, router]);

  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Client-side CAPTCHA validation
    if (userCaptchaInput !== captchaCode) {
      setCaptchaError('Invalid CAPTCHA code');
      return;
    }
    
    // Clear any previous CAPTCHA error
    setCaptchaError('');
    
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

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

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="phone" className="text-gray-300">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password *</Label>
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
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password *</Label>
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

              {/* CAPTCHA Section */}
              <div className="space-y-2">
                <Label htmlFor="captcha" className="text-gray-300">CAPTCHA *</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="captcha"
                      name="captcha"
                      type="text"
                      placeholder="Enter CAPTCHA code"
                      value={userCaptchaInput}
                      onChange={(e) => {
                        setUserCaptchaInput(e.target.value);
                        if (captchaError) setCaptchaError('');
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                      disabled={isPending}
                      required
                    />
                  </div>
                  <div className="flex items-center">
                    <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2 font-mono font-bold text-lg tracking-widest">
                      {captchaCode}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 px-2 hover:bg-white/10"
                      onClick={refreshCaptcha}
                      disabled={isPending}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
                {captchaError && (
                  <p className="text-red-400 text-sm">{captchaError}</p>
                )}
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