"use client";
import { useRouter } from "next/navigation";
import { useAuthErrorHandler } from "@/lib/auth-error-handler";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/video-card";
import { useVideos } from "@/hooks/use-videos";
import { useDashboard } from "@/hooks/use-dashboard";
import {
  Wallet,
  Play,
  Users,
  TrendingUp,
  Target,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-fade";
import Image from "next/image";
import DashboardHeader from "./DashboardHeader";
import WithdrawTab from "./withdraw-tab";
import WalletTab from "./wallet-tab";

const sliderImages = [
  {
    id: 1,
    src: "/slide1.jpg",
    alt: "Slider 1",
  },
  {
    id: 2,
    src: "/slide2.png",
    alt: "Slider 2",
  },
  {
    id: 3,
    src: "/slide3.jpg",
    alt: "Slider 3",
  },
  {
    id: 4,
    src: "/slide4.png",
    alt: "Slider 4",
  },
];

export default function DashboardOverview() {
  const router = useRouter();

  // TanStack Query hooks
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useDashboard();
  const {
    data: videosData,
    isLoading: videosLoading,
    error: videosError,
    refetch: refetchVideos,
  } = useVideos();

  // Handle authentication errors using the global handler
  useAuthErrorHandler(dashboardError);
  useAuthErrorHandler(videosError);

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg font-semibold">
            Failed to load dashboard
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const { user, todayProgress, recentTransactions, referralStats } =
    dashboardData;
  const progressPercentage =
    todayProgress.dailyLimit > 0
      ? ((todayProgress.videosWatched || 0) / todayProgress.dailyLimit) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <DashboardHeader user={user} />

      {/* Hero Slider Section */}
      <div className="h-64 sm:h-80 mb-6 sm:mb-8 mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-2xl overflow-hidden shadow-2xl">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{
            crossFade: true,
          }}
          spaceBetween={0}
          centeredSlides={true}
          autoplay={{
            delay: 1500,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
            stopOnLastSlide: false,
          }}
          loop={true}
          speed={800}
          allowTouchMove={false}
          simulateTouch={false}
          touchRatio={0}
          resistance={false}
          grabCursor={false}
          preventClicks={true}
          preventClicksPropagation={true}
        >
          {sliderImages.map((image) => (
            <SwiperSlide key={image.id}>
              <Image
                src={image.src}
                alt={image.alt}
                width={500}
                height={300}
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            Ready to earn rewards by watching videos today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-700/70 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Wallet Balance
              </CardTitle>
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                ${user.walletBalance.toFixed(2)}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Total earned: ${user.totalEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-700/70 backdrop-blur-xl border border-blue-200/50 dark:border-blue-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Today's Progress
              </CardTitle>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {todayProgress.videosWatched || 0}/
                {todayProgress.dailyLimit || 0}
              </div>
              <Progress value={progressPercentage} className="mt-2 h-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Earned: ${(todayProgress.earningsToday || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-700/70 backdrop-blur-xl border border-purple-200/50 dark:border-purple-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Referrals
              </CardTitle>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {referralStats?.totalReferrals || 0}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Bonus earned: $
                {(referralStats?.referralEarnings || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-700/70 backdrop-blur-xl border border-orange-200/50 dark:border-orange-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Daily Goal
              </CardTitle>
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {progressPercentage >= 100
                  ? "Completed!"
                  : `${Math.round(progressPercentage)}%`}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {(todayProgress.dailyLimit || 0) -
                  (todayProgress.videosWatched || 0)}{" "}
                videos remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/50 rounded-2xl p-1 shadow-lg">
            <TabsTrigger
              className="cursor-pointer data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-300"
              value="tasks"
            >
              Video Tasks
            </TabsTrigger>
            <TabsTrigger
              className="cursor-pointer data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-300"
              value="wallet"
            >
              Wallet
            </TabsTrigger>
            <TabsTrigger
              className="cursor-pointer data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-300"
              value="withdraw"
            >
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <Card className="bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-700/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/50 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:to-cyan-500/20 border-b border-slate-200/50 dark:border-slate-600/50">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Today's Video Tasks</h3>
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                  Watch videos to earn rewards. Complete all{" "}
                  {todayProgress.dailyLimit || 0} videos to maximize your daily
                  earnings.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {(todayProgress.videosWatched || 0) >=
                (todayProgress.dailyLimit || 0) ? (
                  <div className="text-center py-12">
                    <div className="text-green-600 text-8xl mb-6">🎉</div>
                    <h3 className="text-2xl font-bold text-green-600 mb-4">
                      Daily Goal Completed!
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
                      Congratulations! You've completed all your video tasks for
                      today.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Come back tomorrow for more videos and rewards.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Video Status Section */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50/80 to-cyan-50/80 dark:from-emerald-900/30 dark:to-cyan-900/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-500/30 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                            Available Videos
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {videosData?.videos
                              ? `${
                                  videosData.videos.length
                                } videos available • ${
                                  videosData.tasksRemaining ?? 0
                                } tasks remaining`
                              : `${Math.max(
                                  0,
                                  (todayProgress?.dailyLimit ?? 0) -
                                    (todayProgress?.videosWatched ?? 0)
                                )} videos remaining today`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Videos Grid */}
                    {videosLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3].map((i) => (
                          <Card key={i} className="animate-pulse">
                            <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-t-2xl"></div>
                            <CardContent className="p-4">
                              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                              <div className="flex justify-between">
                                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : videosError ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-red-600 mb-4">
                          Failed to Load Videos
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 text-base">
                          {videosError.message ||
                            "Unable to fetch videos. Please try again."}
                        </p>
                        <Button
                          onClick={() => refetchVideos()}
                          variant="outline"
                          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 hover:from-emerald-600 hover:to-cyan-600"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    ) : videosData && videosData.videos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {videosData.videos.map((video) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            disabled={!videosData.canCompleteTask}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-slate-400 text-8xl mb-6">📹</div>
                        <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-4">
                          No Videos Available
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-base">
                          {videosData?.canCompleteTask === false
                            ? videosData.reason ||
                              "You have reached your daily limit."
                            : "Check back later for new videos to watch and earn rewards."}
                        </p>
                        {videosData?.currentPosition && (
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Current Position: {videosData.currentPosition.name}{" "}
                            (Level {videosData.currentPosition.level})
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <div className="bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-700/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/50 shadow-xl rounded-2xl overflow-hidden">
              <WalletTab user={user} recentTransactions={recentTransactions} />
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <div className="bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-700/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-600/50 shadow-xl rounded-2xl overflow-hidden">
              <WithdrawTab />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
