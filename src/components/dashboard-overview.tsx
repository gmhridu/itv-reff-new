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
import Marquee from "react-fast-marquee";
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
  Volume2,
  BookOpen,
  Building,
  UserCheck,
  Gift,
  Coins,
  CreditCard,
  CircleDollarSign,
  Award,
  ArrowUpCircle,
  ArrowDownCircle,
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
import Link from "next/link";
import AnnouncementPopup from "@/components/announcement-popup";
import { useMembershipList } from "@/hooks/use-membership-list";
import { useSliderImages } from "@/hooks/use-slider-images";

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
  const {
    data: membershipData,
    isLoading: membershipLoading,
    error: membershipError,
  } = useMembershipList("weekly", 5);
  const {
    data: sliderImages,
    isLoading: sliderLoading,
    error: sliderError,
  } = useSliderImages();

  // Handle authentication errors using the global handler
  useAuthErrorHandler(dashboardError);
  useAuthErrorHandler(videosError);
  useAuthErrorHandler(membershipError);
  useAuthErrorHandler(sliderError);

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-emerald-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg font-semibold">
            Failed to load dashboard
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AnnouncementPopup userId={user.id} isFirstLogin={false} />

      <DashboardHeader user={user} />

      {/* Hero Slider Section - Restored */}
      <div className="overflow-hidden h-48 relative">
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
          className="h-full"
        >
          {sliderImages && sliderImages.length > 0 ? (
            sliderImages.map((image) => (
              <SwiperSlide key={image.id}>
                <Image
                  src={image.url}
                  alt={image.altText || "Slider image"}
                  fill
                  className="object-cover"
                  priority
                />
              </SwiperSlide>
            ))
          ) : (
            // Fallback content when no slider images are available
            <SwiperSlide>
              <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome to ICL Finance
                  </h2>
                  <p className="text-emerald-100">
                    Your entertainment destination
                  </p>
                </div>
              </div>
            </SwiperSlide>
          )}
        </Swiper>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-lg font-bold">Cocoon Films</h2>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="flex items-center w-full overflow-hidden bg-white border mx-2 my-4 p-3 rounded-lg border-gray-200 shadow-sm">
        <div className="text-emerald-600 mr-3">
          <Volume2 size={20} />
        </div>
        <div className="flex-1">
          <Marquee speed={50} gradient={false} pauseOnHover={false}>
            <span className="text-gray-700 text-sm">
              We sincerely invite you to join our team! Here you will work with
              passionate and creative people who share the pursuit of
              excellence. We value the unique contribution of each member and
              encourage participation and creativity. We look forward to joining
              us to create beauty together!
            </span>
          </Marquee>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Navigation Grid - Only 4 cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Link
            href="/top-up"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-emerald-200 transition-all shadow-sm"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-gray-700 text-xs font-medium text-center">
              Top up
            </span>
          </Link>

          <Link
            href="/withdraw"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-emerald-200 transition-all shadow-sm"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-gray-700 text-xs font-medium text-center">
              Withdraw money
            </span>
          </Link>

          <Link
            href="/referral"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-emerald-200 transition-all shadow-sm"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-gray-700 text-xs font-medium text-center">
              Invite friends
            </span>
          </Link>

          <Link
            href="/company-profile"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-emerald-200 transition-all shadow-sm"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-gray-700 text-xs font-medium text-center">
              Company Profile
            </span>
          </Link>
        </div>

        {/* Task Hall Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800 text-lg font-semibold">Task hall</h3>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-sm">Grade:</span>
              <span className="bg-emerald-600 px-3 py-1 rounded-full text-xs font-medium text-white">
                {user?.currentPosition?.name || "Intern"}
              </span>
            </div>
          </div>

          {/* Task Buttons Grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {(
              user?.availableLevels || [
                { name: "Intern", level: 0, isUnlocked: true },
                { name: "L1", level: 1, isUnlocked: false },
                { name: "L2", level: 2, isUnlocked: false },
                { name: "L3", level: 3, isUnlocked: false },
                { name: "L4", level: 4, isUnlocked: false },
                { name: "L5", level: 5, isUnlocked: false },
                { name: "L6", level: 6, isUnlocked: false },
                { name: "L7", level: 7, isUnlocked: false },
                { name: "L8", level: 8, isUnlocked: false },
                { name: "L9", level: 9, isUnlocked: false },
              ]
            ).map((level) => (
              <Button
                key={level.name}
                disabled={!level.isUnlocked}
                className={`h-12 rounded-xl font-medium transition-all ${
                  level.name === (user?.currentPosition?.name || "Intern")
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                    : level.isUnlocked
                      ? "bg-white border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                      : "bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Play className="w-4 h-4 mr-1" />
                {level.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Original Video Tasks Section (Updated Styling) */}
        <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200 p-4">
            <CardTitle className="flex items-center gap-3 text-gray-800">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Today's Video Tasks</h3>
              </div>
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Watch videos to earn rewards. Complete all{" "}
              {todayProgress.dailyLimit || 0} videos to maximize your daily
              earnings.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {(todayProgress.videosWatched || 0) >=
            (todayProgress.dailyLimit || 0) ? (
              <div className="text-center py-12">
                <div className="text-emerald-500 text-8xl mb-6">🎉</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Daily Goal Completed!
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Congratulations! You've completed all your video tasks for
                  today.
                </p>
                <p className="text-sm text-gray-500">
                  Come back tomorrow for more videos and rewards.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Videos Grid */}
                {videosLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3].map((i) => (
                      <Card
                        key={i}
                        className="animate-pulse bg-gray-50 border border-gray-200"
                      >
                        <div className="aspect-video bg-gray-100 rounded-t-xl"></div>
                        <CardContent className="p-4">
                          <div className="h-4 bg-gray-100 rounded mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded mb-3"></div>
                          <div className="flex justify-between">
                            <div className="h-6 w-16 bg-gray-100 rounded"></div>
                            <div className="h-6 w-12 bg-gray-100 rounded"></div>
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
                    <p className="text-gray-600 mb-6 text-base">
                      {videosError.message ||
                        "Unable to fetch videos. Please try again."}
                    </p>
                    <Button
                      onClick={() => refetchVideos()}
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
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
                    <div className="text-emerald-400 text-8xl mb-6">📹</div>
                    <h3 className="text-xl font-bold text-emerald-800 mb-4">
                      No Videos Available
                    </h3>
                    <p className="text-emerald-700 mb-6 text-base">
                      {videosData?.canCompleteTask === false
                        ? videosData.reason ||
                          "You have reached your daily limit."
                        : "Check back later for new videos to watch and earn rewards."}
                    </p>
                    {videosData?.currentPosition && (
                      <div className="text-sm text-emerald-600">
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

        {/* Membership List Section */}
        <div className="mb-6 mt-5">
          <h3 className="text-gray-800 text-lg font-semibold mb-4">
            Membership list
          </h3>
          <div className="space-y-3">
            {membershipLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <Card
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : membershipError ? (
              // Error state
              <Card className="bg-red-50 border border-red-200 rounded-xl shadow-sm">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 text-sm">
                    Failed to load membership data
                  </p>
                </CardContent>
              </Card>
            ) : membershipData && membershipData?.membershipList?.length > 0 ? (
              // Real data
              membershipData.membershipList.map((member, index) => (
                <Card
                  key={member.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:border-emerald-200 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-gray-800 font-medium text-sm">
                            {member.name}
                          </h4>
                          {member.subtitle && (
                            <p className="text-gray-600 text-xs">
                              {member.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-600 font-bold text-sm">
                          {member.amount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // No data state
              <Card className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h4 className="text-gray-600 font-medium mb-2">
                    No earnings this week
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Complete video tasks to start earning and appear on the
                    leaderboard!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
