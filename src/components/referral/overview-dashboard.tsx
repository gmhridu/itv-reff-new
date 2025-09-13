'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  MessageCircle,
  Mail,
  QrCode,
  Gift,
  Users,
  DollarSign,
  TrendingUp,
  Award,
  Target,
  Zap,
  Crown,
  Star,
  Trophy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    whatsapp: string;
    telegram: string;
    email: string;
    copy: string;
  };
}

interface OverviewStats {
  totalTeamSize: number;
  totalEarnings: number;
  monthlyEarnings: number;
  activeMembers: number;
  conversionRate: number;
  rank: number;
}

export default function OverviewDashboard() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchReferralData();
    fetchOverviewStats();
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

  const fetchOverviewStats = async () => {
    try {
      // Fetch from multiple APIs to get comprehensive stats
      const [hierarchyRes, rewardsRes, analyticsRes] = await Promise.all([
        fetch('/api/referrals/hierarchy'),
        fetch('/api/referrals/rewards'),
        fetch('/api/referrals/analytics?period=30')
      ]);

      const hierarchyData = hierarchyRes.ok ? await hierarchyRes.json() : null;
      const rewardsData = rewardsRes.ok ? await rewardsRes.json() : null;
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      if (hierarchyData?.success && rewardsData?.success && analyticsData?.success) {
        setOverviewStats({
          totalTeamSize: hierarchyData.data.teamMetrics.totalTeamSize,
          totalEarnings: rewardsData.data.totalRewards.total + rewardsData.data.totalManagementBonuses.total,
          monthlyEarnings: rewardsData.data.monthlyBreakdown[rewardsData.data.monthlyBreakdown.length - 1]?.total || 0,
          activeMembers: hierarchyData.data.teamMetrics.activeMembers,
          conversionRate: analyticsData.data.conversionRates.overallConversion,
          rank: analyticsData.data.leaderboard.userPosition
        });
      }
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    } finally {
      setCopying(false);
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!referralData) return;

    const message = `Join me on VideoTask and start earning money by watching videos! Use my referral code: ${referralData.referralCode}`;
    const url = referralData.referralLink;

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Join VideoTask!')}&body=${encodeURIComponent(message + '\n\n' + url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const generateQRCode = () => {
    if (!referralData) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralData.referralLink)}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Team Size</p>
                <p className="text-3xl font-bold">{overviewStats?.totalTeamSize || 0}</p>
                <p className="text-sm text-blue-100">Active: {overviewStats?.activeMembers || 0}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Earnings</p>
                <p className="text-3xl font-bold">PKR {overviewStats?.totalEarnings?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-green-100">This month: PKR {overviewStats?.monthlyEarnings?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Your Rank</p>
                <p className="text-3xl font-bold">#{overviewStats?.rank || 'N/A'}</p>
                <p className="text-sm text-orange-100">Conversion: {overviewStats?.conversionRate?.toFixed(1) || '0'}%</p>
              </div>
              <Trophy className="w-12 h-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Sharing Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Referral Link
          </CardTitle>
          <CardDescription>
            Invite friends and start earning rewards from their activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your Referral Code</label>
            <div className="flex gap-2">
              <Input 
                value={referralData?.referralCode || 'Loading...'} 
                readOnly 
                className="font-mono text-lg"
              />
              <Button 
                onClick={() => copyToClipboard(referralData?.referralCode || '', 'Referral code')}
                disabled={copying}
                variant="outline"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your Referral Link</label>
            <div className="flex gap-2">
              <Input 
                value={referralData?.referralLink || 'Loading...'} 
                readOnly 
                className="text-sm"
              />
              <Button 
                onClick={() => copyToClipboard(referralData?.referralLink || '', 'Referral link')}
                disabled={copying}
                variant="outline"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => setShowQR(!showQR)}
                variant="outline"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {showQR && (
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <img 
                  src={generateQRCode()} 
                  alt="QR Code" 
                  className="mx-auto mb-2"
                />
                <p className="text-sm text-gray-600">Scan to visit your referral link</p>
              </div>
            </div>
          )}

          {/* Social Sharing Buttons */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">Share on Social Media</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button 
                onClick={() => shareOnSocial('facebook')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button 
                onClick={() => shareOnSocial('twitter')}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button 
                onClick={() => shareOnSocial('whatsapp')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button 
                onClick={() => shareOnSocial('telegram')}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Telegram
              </Button>
              <Button 
                onClick={() => shareOnSocial('email')}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Reward Structure
          </CardTitle>
          <CardDescription>
            Understand how you earn from your referral network
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h3 className="font-semibold">A-Level (Direct)</h3>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Position upgrade rewards</li>
                <li>• 6% daily management bonus</li>
                <li>• Highest earning potential</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-6 h-6 text-blue-500" />
                <h3 className="font-semibold">B-Level (2nd Gen)</h3>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Position upgrade rewards</li>
                <li>• 3% daily management bonus</li>
                <li>• Passive income stream</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-6 h-6 text-green-500" />
                <h3 className="font-semibold">C-Level (3rd Gen)</h3>
              </div>
              <ul className="text-sm space-y-1">
                <li>• Position upgrade rewards</li>
                <li>• 1% daily management bonus</li>
                <li>• Long-term residual income</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Success Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium">Target Active Users</h4>
                  <p className="text-sm text-gray-600">Focus on people who are likely to be active and upgrade their positions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Share2 className="w-5 h-5 text-green-500 mt-1" />
                <div>
                  <h4 className="font-medium">Share Strategically</h4>
                  <p className="text-sm text-gray-600">Use different platforms and personalize your message for better conversion.</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-500 mt-1" />
                <div>
                  <h4 className="font-medium">Support Your Team</h4>
                  <p className="text-sm text-gray-600">Help your referrals succeed to maximize your management bonuses.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-orange-500 mt-1" />
                <div>
                  <h4 className="font-medium">Track Performance</h4>
                  <p className="text-sm text-gray-600">Monitor your analytics to optimize your referral strategy.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
