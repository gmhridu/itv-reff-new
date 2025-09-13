"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  Trophy,
  Heart,
  Target,
  TrendingUp,
  CheckCircle,
  Award,
  Handshake,
  Star,
  ArrowRight,
  Building2,
  Globe,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

export default function CompanyProfilePage() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 lg:px-6 py-2 mb-4 sm:mb-6 border border-white/30 text-sm sm:text-base">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">Trusted Legacy of ICL Group</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              ICL Finance
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed px-4">
              Powered by the trusted legacy of ICL Group, created with one
              purpose:
              <span className="font-semibold text-white">
                {" "}
                to give people genuine earning opportunities
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                asChild
              >
                <Link href="/register">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Join Our Team
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => scrollToSection("mission")}
              >
                Learn More
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section id="mission" className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              variant="outline"
              className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 text-sm sm:text-base lg:text-lg border-blue-200 text-blue-600"
            >
              Our Mission
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-gray-900 px-4">
              We are not here for profit—
              <span className="text-blue-600">
                {" "}
                we are here to create value
              </span>
              <br className="hidden sm:block" />
              for individuals and communities.
            </h2>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed px-4">
              At ICL Finance, your success is our only measure of growth. We
              exist to support you, reward your effort, and help you achieve
              financial independence with honesty and fairness.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-50 to-emerald-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge
              variant="outline"
              className="mb-4 px-3 sm:px-4 py-2 text-sm sm:text-base border-emerald-200 text-emerald-600"
            >
              What We Offer
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 px-4">
              Your Path to Financial Independence
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Join as a recognized employee and build your growth while helping
              others succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl mb-3 sm:mb-4 text-gray-900">
                Recognized Employee Status
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Join as a recognized employee of ICL Finance with full dignity
                and respect as part of our workforce
              </CardDescription>
            </Card>

            <Card className="text-center p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl mb-3 sm:mb-4 text-gray-900">
                Fair Earning Through Participation
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Earn fairly through your participation and contribution with
                transparent reward systems
              </CardDescription>
            </Card>

            <Card className="text-center p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl mb-3 sm:mb-4 text-gray-900">
                Build Your Own Growth
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Grow your own success by helping others grow, creating a
                community of mutual support
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose ICL Finance */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge
              variant="outline"
              className="mb-4 px-3 sm:px-4 py-2 text-sm sm:text-base border-blue-200 text-blue-600"
            >
              Why Choose Us
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 px-4">
              Built on Trust, Transparency & Empowerment
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto items-center">
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Transparent Rewards
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    No hidden terms, no complex conditions. Every reward is
                    clear, fair, and transparent from day one.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Respect & Dignity
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Every member is part of the workforce, not just a number.
                    You are valued, respected, and heard.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Empowerment for All
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Designed to uplift students, homemakers, freelancers, and
                    professionals alike. Everyone deserves opportunity.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-6 sm:p-8 border border-blue-100 order-1 lg:order-2">
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
                  <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Our Promise to You
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Your success is our only measure of growth. We are committed
                  to supporting your journey with integrity and fairness.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">
                    Honest and transparent operations
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">
                    Fair reward distribution
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">
                    Community-focused growth
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">
                    Long-term financial independence
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <Badge
              variant="outline"
              className="mb-4 px-3 sm:px-4 py-2 text-sm sm:text-base border-emerald-200 text-emerald-600"
            >
              Who We Serve
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 px-4">
              Empowering Every Individual
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              ICL Finance is designed to create opportunities for everyone,
              regardless of their background or current situation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
                <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg mb-2 text-gray-900">
                Students
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Earn while you learn and build your future
              </CardDescription>
            </Card>

            <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg mb-2 text-gray-900">
                Homemakers
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Financial independence from the comfort of home
              </CardDescription>
            </Card>

            <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
                <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg mb-2 text-gray-900">
                Freelancers
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Supplement your income with reliable earnings
              </CardDescription>
            </Card>

            <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm sm:col-span-2 lg:col-span-1 sm:max-w-xs sm:mx-auto lg:max-w-none">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg mb-2 text-gray-900">
                Professionals
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Diversify your income streams securely
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-emerald-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center gap-1 sm:gap-2 mb-4 sm:mb-6">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-current" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Be part of ICL Finance
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl px-4">
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300 flex-shrink-0" />
                Be valued
              </span>
              <span className="text-blue-200 hidden sm:block">•</span>
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300 flex-shrink-0" />
                Be empowered
              </span>
              <span className="text-blue-200 hidden sm:block">•</span>
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300 flex-shrink-0" />
                Be successful
              </span>
            </div>

            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
              Join thousands of individuals who have found genuine earning
              opportunities with ICL Finance. Your journey to financial
              independence starts today.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 sm:px-10 py-3 sm:py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-base sm:text-lg"
                asChild
              >
                <Link href="/register">
                  <Handshake className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Join ICL Finance Today
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => scrollToSection("mission")}
              >
                Learn More About Us
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
