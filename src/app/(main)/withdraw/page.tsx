'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  CreditCard,
  Building2 as Bank,
  Smartphone,
  ArrowUpRight
} from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  adminNotes?: string;
  processedAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface WithdrawalsResponse {
  withdrawals: WithdrawalRequest[];
  weeklyLimit: number;
  weeklyWithdrawn: number;
  weeklyRemaining: number;
  weeklyCount: number;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface WalletBalance {
  balance: number;
  totalEarnings: number;
}

export default function WithdrawPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalsResponse | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: '',
    paymentDetails: {
      paypalEmail: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      mobileNumber: '',
      mobileProvider: ''
    }
  });

  useEffect(() => {
    fetchWithdrawals();
    fetchWalletBalance();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/withdrawals');
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet/balance');
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const paymentDetails = getPaymentDetails();

      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          paymentDetails,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Withdrawal request submitted successfully!');
        // Reset form
        setFormData({
          amount: '',
          paymentMethod: '',
          paymentDetails: {
            paypalEmail: '',
            bankName: '',
            accountNumber: '',
            accountName: '',
            mobileNumber: '',
            mobileProvider: ''
          }
        });
        // Refresh data
        fetchWithdrawals();
        fetchWalletBalance();
      } else {
        alert(data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentDetails = () => {
    switch (formData.paymentMethod) {
      case 'paypal':
        return { email: formData.paymentDetails.paypalEmail };
      case 'bank':
        return {
          bankName: formData.paymentDetails.bankName,
          accountNumber: formData.paymentDetails.accountNumber,
          accountName: formData.paymentDetails.accountName
        };
      case 'mobile':
        return {
          number: formData.paymentDetails.mobileNumber,
          provider: formData.paymentDetails.mobileProvider
        };
      default:
        return {};
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PROCESSED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <AlertTriangle className="h-4 w-4" />;
      case 'PROCESSED': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading withdrawal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="relative w-8 h-8">
                <img
                  src="/logo.svg"
                  alt="VideoTask Rewards"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="ml-2 text-lg font-semibold">VideoTask Rewards</span>
            </div>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a href="/withdraw" className="text-blue-600 font-medium">Withdraw</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Withdrawal Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                PKR {walletBalance?.balance.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Limit</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                PKR {withdrawals?.weeklyRemaining.toFixed(2) || '100.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Remaining this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minimum Withdrawal</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">PKR 10.00</div>
              <p className="text-xs text-muted-foreground">
                Minimum amount
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Form */}
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>
                Withdraw your earnings to your preferred payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">PKR</span>
                    <Input
                      id="amount"
                      type="number"
                      min="10"
                      max={Math.min(walletBalance?.balance || 0, withdrawals?.weeklyRemaining || 100)}
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="pl-12"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Min: PKR 10.00 | Max: PKR {Math.min(walletBalance?.balance || 0, withdrawals?.weeklyRemaining || 100).toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="" disabled>
                      Select payment method
                    </option>
                    <option value="paypal">
                      💳 PayPal
                    </option>
                    <option value="bank">
                      🏦 Bank Transfer
                    </option>
                    <option value="mobile">
                      📱 Mobile Money
                    </option>
                  </select>
                </div>

                {/* Payment Details */}
                {formData.paymentMethod === 'paypal' && (
                  <div>
                    <Label htmlFor="paypalEmail">PayPal Email</Label>
                    <Input
                      id="paypalEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.paymentDetails.paypalEmail}
                      onChange={(e) => setFormData({
                        ...formData,
                        paymentDetails: { ...formData.paymentDetails, paypalEmail: e.target.value }
                      })}
                      required
                    />
                  </div>
                )}

                {formData.paymentMethod === 'bank' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        placeholder="Bank of America"
                        value={formData.paymentDetails.bankName}
                        onChange={(e) => setFormData({
                          ...formData,
                          paymentDetails: { ...formData.paymentDetails, bankName: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        placeholder="John Doe"
                        value={formData.paymentDetails.accountName}
                        onChange={(e) => setFormData({
                          ...formData,
                          paymentDetails: { ...formData.paymentDetails, accountName: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        placeholder="1234567890"
                        value={formData.paymentDetails.accountNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          paymentDetails: { ...formData.paymentDetails, accountNumber: e.target.value }
                        })}
                        required
                      />
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'mobile' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mobileProvider">Mobile Provider</Label>
                      <select
                        id="mobileProvider"
                        value={formData.paymentDetails.mobileProvider}
                        onChange={(e) => setFormData({
                          ...formData,
                          paymentDetails: { ...formData.paymentDetails, mobileProvider: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="" disabled>
                          Select provider
                        </option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="airtel">Airtel Money</option>
                        <option value="tigo">Tigo Pesa</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        placeholder="+1234567890"
                        value={formData.paymentDetails.mobileNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          paymentDetails: { ...formData.paymentDetails, mobileNumber: e.target.value }
                        })}
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !formData.amount || !formData.paymentMethod}
                >
                  {submitting ? 'Processing...' : 'Submit Withdrawal Request'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>
                Your recent withdrawal requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals?.withdrawals && withdrawals.withdrawals.length > 0 ? (
                <div className="space-y-4">
                  {withdrawals.withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(withdrawal.status)}`}>
                          {getStatusIcon(withdrawal.status)}
                        </div>
                        <div>
                          <p className="font-medium">PKR {withdrawal.amount.toFixed(2)}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(withdrawal.status)}>
                              {withdrawal.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(withdrawal.createdAt).toLocaleDateString('en-US')}
                            </span>
                          </div>
                          {withdrawal.adminNotes && (
                            <p className="text-sm text-gray-600 mt-1">{withdrawal.adminNotes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{withdrawal.paymentMethod}</p>
                        {withdrawal.transactionId && (
                          <p className="text-xs text-green-600">TXN: {withdrawal.transactionId}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ArrowUpRight className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No withdrawal requests</h3>
                  <p>Your withdrawal requests will appear here once submitted.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Important Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
            <CardDescription>Please read before making a withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">Processing Time</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Pending requests: 1-2 business days</li>
                  <li>• Approved requests: 2-3 business days</li>
                  <li>• Bank transfers may take additional time</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-orange-600">Limits & Fees</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Minimum withdrawal: PKR 10.00</li>
                  <li>• Weekly limit: PKR 100.00</li>
                  <li>• No withdrawal fees</li>
                  <li>• Limits reset every Sunday</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}