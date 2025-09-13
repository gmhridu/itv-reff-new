'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Star, 
  Zap, 
  Check, 
  Clock, 
  Play, 
  Gift,
  ArrowRight,
  Users
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  dailyVideoLimit: number;
  rewardPerVideo: number;
  referralBonus: number;
}

interface UserPlan {
  hasActivePlan: boolean;
  subscription?: {
    id: string;
    plan: {
      id: string;
      name: string;
      description?: string;
      dailyVideoLimit: number;
      rewardPerVideo: number;
      referralBonus: number;
    };
    startDate: string;
    endDate: string;
    amountPaid: number;
    status: string;
    daysRemaining: number;
  };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchUserPlan();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const response = await fetch('/api/user/plan');
      if (response.ok) {
        const data = await response.json();
        setUserPlan(data);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribing(planId);
      
      const response = await fetch('/api/plans/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          paymentMethod: 'credit_card', // In real app, this would come from a payment form
          paymentDetails: {} // In real app, this would contain payment info
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Subscription successful!');
        fetchUserPlan(); // Refresh user plan
      } else {
        alert(data.error || 'Subscription failed');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Subscription failed');
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('basic')) return <Star className="h-6 w-6" />;
    if (planName.toLowerCase().includes('premium')) return <Crown className="h-6 w-6" />;
    if (planName.toLowerCase().includes('pro')) return <Zap className="h-6 w-6" />;
    return <Star className="h-6 w-6" />;
  };

  const getPlanColor = (planName: string) => {
    if (planName.toLowerCase().includes('basic')) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (planName.toLowerCase().includes('premium')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (planName.toLowerCase().includes('pro')) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plans...</p>
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
              <a href="/plans" className="text-blue-600 font-medium">Plans</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Plan Section */}
        {userPlan?.hasActivePlan && userPlan.subscription && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Check className="h-5 w-5" />
                Active Subscription
              </CardTitle>
              <CardDescription className="text-green-700">
                You currently have an active plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-green-600 mb-1">Current Plan</p>
                  <p className="font-semibold text-green-800">{userPlan.subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600 mb-1">Days Remaining</p>
                  <p className="font-semibold text-green-800">{userPlan.subscription.daysRemaining} days</p>
                </div>
                <div>
                  <p className="text-sm text-green-600 mb-1">Expires</p>
                  <p className="font-semibold text-green-800">
                    {new Date(userPlan.subscription.endDate).toLocaleDateString('en-US')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the perfect plan that fits your earning goals. Upgrade anytime to maximize your rewards.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const isCurrentPlan = userPlan?.subscription?.plan.id === plan.id;
            const canSubscribe = !userPlan?.hasActivePlan || !isCurrentPlan;

            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  isCurrentPlan ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-semibold">
                    Current Plan
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getPlanColor(plan.name)}`}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/{plan.durationDays} days</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Play className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{plan.dailyVideoLimit} videos daily</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Gift className="h-4 w-4 text-green-600" />
                      <span className="text-sm">PKR{plan.rewardPerVideo.toFixed(2)} per video</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">PKR{plan.referralBonus.toFixed(2)} referral bonus</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">{plan.durationDays} days access</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">Daily earning potential:</p>
                    <p className="text-2xl font-bold text-green-600">
                      PKR{(plan.dailyVideoLimit * plan.rewardPerVideo).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">per day</p>
                  </div>

                  <Button 
                    className="w-full" 
                    disabled={!canSubscribe || subscribing === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {subscribing === plan.id ? (
                      'Processing...'
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : userPlan?.hasActivePlan ? (
                      'Upgrade Plan'
                    ) : (
                      <>
                        Subscribe Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Plan Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
            <CardDescription>Detailed comparison of all available plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="text-center py-3 px-4">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Price</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        ${plan.price}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Duration</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.durationDays} days
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Daily Videos</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.dailyVideoLimit}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Reward per Video</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        PKR{plan.rewardPerVideo.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Referral Bonus</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        PKR{plan.referralBonus.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Daily Earning Potential</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4 font-semibold text-green-600">
                        PKR{(plan.dailyVideoLimit * plan.rewardPerVideo).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Monthly Earning Potential</td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4 font-semibold text-green-600">
                        PKR{(plan.dailyVideoLimit * plan.rewardPerVideo * 30).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Everything you need to know about our subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Can I change my plan later?</h3>
                <p className="text-gray-600">
                  Yes, you can upgrade your plan at any time. When you upgrade, you'll only pay the prorated difference for the remaining days.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What happens when my plan expires?</h3>
                <p className="text-gray-600">
                  When your plan expires, you'll revert to the free tier with limited features. You can renew your plan at any time to continue enjoying premium benefits.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Are there any hidden fees?</h3>
                <p className="text-gray-600">
                  No, the price you see is the price you pay. There are no hidden fees or additional charges. All earnings are yours to keep.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Can I cancel my subscription?</h3>
                <p className="text-gray-600">
                  You can cancel your subscription at any time. You'll continue to have access to your plan benefits until the end of your current billing period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}