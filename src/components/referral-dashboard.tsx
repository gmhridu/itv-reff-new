'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  MessageCircle,
  Mail,
  Gift,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReferralStats {
  totalReferrals: number;
  registeredReferrals: number;
  qualifiedReferrals: number;
  rewardedReferrals: number;
  totalEarnings: number;
  monthlyReferrals: number;
  activities: Array<{
    id: string;
    status: string;
    source: string;
    rewardAmount?: number;
    createdAt: string;
    rewardPaidAt?: string;
  }>;
}

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
  stats: ReferralStats;
}

export default function ReferralDashboard() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/referral/stats');
      if (response.ok) {
        const data = await response.json();

        // Ensure stats object exists with default values
        if (data.success && data.stats) {
          setReferralData(data);
        } else {
          // Set default data structure if stats are missing
          setReferralData({
            referralCode: data.referralCode || '',
            referralLink: data.referralLink || '',
            socialLinks: data.socialLinks || {
              facebook: '', twitter: '', whatsapp: '', telegram: '', email: '', copy: ''
            },
            stats: {
              totalReferrals: 0,
              registeredReferrals: 0,
              qualifiedReferrals: 0,
              rewardedReferrals: 0,
              totalEarnings: 0,
              monthlyReferrals: 0,
              activities: []
            }
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load referral data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    } finally {
      setCopying(false);
    }
  };

  const openSocialShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'REWARDED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'QUALIFIED':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'REGISTERED':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PENDING':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REWARDED':
        return 'Rewarded';
      case 'QUALIFIED':
        return 'Qualified';
      case 'REGISTERED':
        return 'Registered';
      case 'PENDING':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Failed to load referral data</p>
          <Button onClick={fetchReferralData} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold">{referralData.stats?.totalReferrals || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registered</p>
                <p className="text-2xl font-bold">{referralData.stats?.registeredReferrals || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${(referralData.stats?.totalEarnings || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{referralData.stats?.monthlyReferrals || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Tools */}
      <Tabs defaultValue="share" className="space-y-4">
        <TabsList>
          <TabsTrigger value="share">Share & Earn</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="share" className="space-y-6">
          {/* Referral Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Your Referral Code
              </CardTitle>
              <CardDescription>
                Share your code or link with friends to earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={referralData.referralCode} 
                  readOnly 
                  className="font-mono"
                />
                <Button 
                  onClick={() => copyToClipboard(referralData.referralCode, 'Referral code')}
                  disabled={copying}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Input 
                  value={referralData.referralLink} 
                  readOnly 
                  className="text-sm"
                />
                <Button 
                  onClick={() => copyToClipboard(referralData.referralLink, 'Referral link')}
                  disabled={copying}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Social Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share on Social Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => openSocialShare(referralData.socialLinks.facebook)}
                  className="flex items-center gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => openSocialShare(referralData.socialLinks.twitter)}
                  className="flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => openSocialShare(referralData.socialLinks.whatsapp)}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => openSocialShare(referralData.socialLinks.email)}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Referral Activity</CardTitle>
              <CardDescription>
                Track your referral progress and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(referralData.stats?.activities || []).length > 0 ? (
                <div className="space-y-4">
                  {(referralData.stats?.activities || []).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(activity.status)}
                        <div>
                          <p className="font-medium">{getStatusText(activity.status)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {activity.rewardAmount && (
                          <p className="font-medium text-green-600">
                            +${activity.rewardAmount.toFixed(2)}
                          </p>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {activity.source}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No referral activity yet</p>
                  <p className="text-sm text-gray-400">Start sharing your referral link to see activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
