"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  Users,
  Headphones,
  Lock,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useRouter } from "next/navigation";

interface SupportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  contact: string;
  availability: string;
  color: string;
  bgColor: string;
  action: () => void;
}

const SupportPage = () => {
  const router = useRouter();

  const handleWhatsAppContact = () => {
    const phoneNumber = "+923001234567"; // Replace with your actual WhatsApp number
    const message = "Hello! I need help with my ITV account.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message,
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleTelegramContact = () => {
    const telegramUsername = "itv_support"; // Replace with your actual Telegram username
    const telegramUrl = `https://t.me/${telegramUsername}`;
    window.open(telegramUrl, "_blank");
  };

  const handleEmailContact = () => {
    const email = "support@itv.com"; // Replace with your actual support email
    const subject = "Support Request - ITV Account";
    const body =
      "Hello,\n\nI need assistance with my ITV account.\n\nPlease describe your issue:\n\n\nThank you.";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_self");
  };

  const handlePhoneContact = () => {
    const phoneNumber = "+923001234567"; // Replace with your actual phone number
    window.open(`tel:${phoneNumber}`, "_self");
  };

  const supportOptions: SupportOption[] = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Get instant help via WhatsApp chat",
      icon: MessageCircle,
      contact: "+92 300 1234567",
      availability: "24/7 Available",
      color: "text-green-600",
      bgColor: "bg-green-100",
      action: handleWhatsAppContact,
    },
    {
      id: "telegram",
      name: "Telegram",
      description: "Connect with us on Telegram",
      icon: MessageCircle,
      contact: "@itv_support",
      availability: "24/7 Available",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      action: handleTelegramContact,
    },
  ];

  const faqItems = [
    {
      question: "How do I withdraw my earnings?",
      answer:
        "Go to your wallet, click withdraw, enter your fund password, and select your preferred payment method (JazzCash, Easypaisa, or Bank Transfer).",
    },
    {
      question: "What is a Fund Password?",
      answer:
        "A Fund Password is a security measure required for all withdrawal transactions. You can set it up in the Security section of your profile.",
    },
    {
      question: "How do I complete tasks?",
      answer:
        "Navigate to the Tasks section, select available tasks, and follow the instructions. Each task has specific requirements and rewards.",
    },
    {
      question: "How does the referral program work?",
      answer:
        "Share your referral link with friends. When they join and complete tasks, you earn commissions based on your level (A-level: 6%, B-level: 3%, C-level: 1%).",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-white/20 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center">
            Support Center
          </h1>
          <div className="w-12 sm:w-20"></div>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
        {/* Welcome Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Headphones className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2">
              How can we help you?
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
              Our support team is here to assist you 24/7. Choose your preferred
              contact method below.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Contact Options */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2 px-1">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Contact Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {supportOptions.map((option) => (
              <Card
                key={option.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-white/90 backdrop-blur-sm"
                onClick={option.action}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 ${option.bgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        <option.icon
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${option.color}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">
                          {option.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {option.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {option.contact}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-green-600">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium">
                          {option.availability}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 sm:mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 px-1">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {faqItems.map((faq, index) => (
              <Card
                key={index}
                className="shadow-md border-0 bg-white/90 backdrop-blur-sm"
              >
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base leading-tight">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Support Hours */}
        <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-800">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              Support Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      WhatsApp
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-green-600">
                    24/7 (2-4h response)
                  </span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      Telegram
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-blue-600">
                    24/7 (2-4h response)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        {/*<Card className="border-red-200 bg-red-50 shadow-lg">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-800 mb-2 text-sm sm:text-base md:text-lg">
                  Emergency Contact
                </h3>
                <p className="text-xs sm:text-sm text-red-700 mb-3 sm:mb-4 leading-relaxed">
                  For urgent issues related to account security or unauthorized
                  transactions:
                </p>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 h-auto"
                  onClick={() => window.open("tel:+923001234567", "_self")}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Emergency Line
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>*/}
      </div>

      {/* Bottom spacing */}
      <div className="h-6 sm:h-8 lg:h-12"></div>
    </div>
  );
};

export default SupportPage;
