'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, ArrowRight, CheckCircle, Clock } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Password reset link has been sent to your email.');
        setIsEmailSent(true);
      } else {
        setError(data.error || 'Failed to send reset link');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 text-gray-300 hover:text-white"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Button>

        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-4">
            <div className="w-8 h-8 bg-white rounded-lg transform rotate-45"></div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-300">We'll send you a link to reset your password</p>
        </div>

        {/* Reset Password Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Forgot Password?</CardTitle>
            <CardDescription className="text-gray-300 text-center">
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">
                {success}
              </div>
            )}
            
            {!isEmailSent ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400 pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Send Reset Link
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Email Sent!</h3>
                  <p className="text-gray-300 text-sm">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-blue-200 text-sm">
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Check your email</p>
                      <p className="text-xs">
                        The reset link will expire in 15 minutes. If you don't see the email, check your spam folder.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => {
                      setIsEmailSent(false);
                      setSuccess('');
                    }}
                  >
                    Try another email
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-purple-400 hover:text-purple-300"
                    onClick={() => router.push('/')}
                  >
                    Back to login
                  </Button>
                </div>
              </div>
            )}

            {!isEmailSent && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-300">Remember your password?</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => router.push('/')}
                  >
                    Sign in
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        {!isEmailSent && (
          <div className="mt-8 space-y-3">
            <div className="text-center">
              <h3 className="text-white font-medium mb-3">Having trouble?</h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>• Make sure you're using the email address associated with your account</p>
                <p>• Check your spam or junk folder</p>
                <p>• The reset link will expire in 15 minutes</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>© 2024 VideoTask Rewards. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}