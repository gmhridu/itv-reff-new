'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Users, 
  TrendingUp, 
  Copy, 
  Share2, 
  Calendar,
  DollarSign,
  Trophy,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReferralData {
  referralCode: string;
  referralLink: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalReferralEarnings: number;
  monthlyReferrals: number;
  topReferrals: Array<{
    id: string;
    name: string;
    earnings: number;
    joinedAt: string;
  }>;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    earnings: number;
    balance: number;
    joinedAt: string;
    isActive: boolean;
  }>;
}

export default function ReferralPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
    fetchReferralStats();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/referral/code');
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referral/stats');
      if (response.ok) {
        const data = await response.json();
        setReferralStats(data);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareReferralLink = async () => {
    if (!referralData) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join VideoTask Rewards',
          text: 'Use my referral code to earn rewards by watching videos!',
          url: referralData.referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard(referralData.referralLink);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral data...</p>
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
              <a href="/referral" className="text-blue-600 font-medium">Referrals</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Referral Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Referral Program</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Invite friends and earn PKR 5 for each person who joins and starts watching videos. 
            There's no limit to how much you can earn!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {referralStats?.totalReferrals || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {referralStats?.monthlyReferrals || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {referralStats?.activeReferrals || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Earning rewards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                PKR {referralStats?.totalReferralEarnings.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Total earned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bonus per Referral</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">PKR 5.00</div>
              <p className="text-xs text-muted-foreground">
                When they start earning
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link with friends to earn referral bonuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Referral Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-lg">
                    {referralData?.referralCode}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(referralData?.referralCode || '')}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Referral Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={referralData?.referralLink || ''}
                    readOnly
                    className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(referralData?.referralLink || '')}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button onClick={shareReferralLink}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Details */}
        <Tabs defaultValue="referrals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="referrals">My Referrals</TabsTrigger>
            <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referred Users</CardTitle>
                <CardDescription>
                  Users who joined using your referral code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralStats?.referrals && referralStats.referrals.length > 0 ? (
                  <div className="space-y-4">
                    {referralStats.referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{referral.name}</p>
                            <p className="text-sm text-gray-500">{referral.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={referral.isActive ? "default" : "secondary"}>
                                {referral.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Joined {new Date(referral.joinedAt).toLocaleDateString('en-US')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            PKR {referral.earnings.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">Earned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
                    <p className="mb-6">Start sharing your referral link to earn bonuses!</p>
                    <Button onClick={shareReferralLink}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Your Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-performers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Performing Referrals
                </CardTitle>
                <CardDescription>
                  Your most successful referrals based on their earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralStats?.topReferrals && referralStats.topReferrals.length > 0 ? (
                  <div className="space-y-4">
                    {referralStats.topReferrals.map((referral, index) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{referral.name}</p>
                            <p className="text-sm text-gray-500">
                              Joined {new Date(referral.joinedAt).toLocaleDateString('en-US')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            PKR {referral.earnings.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">Total Earnings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No top performers yet</h3>
                    <p>Your top referrals will appear here once they start earning.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Referral Program Works</CardTitle>
            <CardDescription>Simple steps to start earning referral bonuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Share Your Link</h3>
                <p className="text-sm text-gray-600">
                  Copy your unique referral link and share it with friends
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Friends Join</h3>
                <p className="text-sm text-gray-600">
                  Your friends sign up using your referral link
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Earn Bonus</h3>
                <p className="text-sm text-gray-600">
                  Get PKR 5 when your friend starts watching videos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}