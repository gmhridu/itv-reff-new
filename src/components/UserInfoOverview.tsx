"use client";

import React, { useState, useEffect } from "react";
import { AvatarSelector } from "./ui/avatar-selector";
import { ChangePasswordModal } from "./ui/change-password-modal";
import { FundPasswordModal } from "./ui/fund-password-modal";
import {
  User,
  Phone,
  FileText,
  CreditCard,
  Lock,
  Shield,
  Trash2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import UserDetailedInformation from "./user-detailed-information";
import { redirect } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Import the form data type for better type safety
type UserDetailedInformationFormData = {
  realName: string;
};

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode: string;
  status: string;
  walletBalance: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

const UserInfoOverview = () => {
  const { toast } = useToast();

  // Default avatar
  const defaultAvatar =
    "https://images.unsplash.com/photo-1494790108755-2616b332c6d7?w=80&h=80&fit=crop&crop=face";

  // State to track selected avatar
  const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatar);

  // State to track dialog open/close
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailedDialogOpen, setIsDetailedDialogOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isFundPasswordModalOpen, setIsFundPasswordModalOpen] = useState(false);

  // State for user data
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
      } else {
        console.error("Failed to fetch user data");
        toast({
          title: "Error",
          description: "Failed to load user information",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSettingsClick = (section: string) => {
    if (section === "login-password") {
      setIsChangePasswordModalOpen(true);
    } else if (section === "fund-password") {
      setIsFundPasswordModalOpen(true);
    }
    console.log(`Navigating to ${section} settings`);
  };

  const handleExitLogin = async () => {
    try {
      // Call the logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirect to the login page after successful logout
        window.location.href = "/";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleEmptyCache = async () => {
    try {
      const response = await fetch("/api/auth/clear-cache-logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Cache cleared successfully. Redirecting to login...",
        });

        // Clear any local storage/session storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to clear cache",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Clear cache error:", error);
      toast({
        title: "Error",
        description: "An error occurred while clearing cache",
        variant: "destructive",
      });
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    console.log("Avatar updated:", avatarUrl);
  };

  const handleModalOpen = () => {
    setIsDialogOpen(true);
  };

  const handleModalClose = () => {
    setIsDialogOpen(false);
  };

  const handleDetailedModalOpen = () => {
    setIsDetailedDialogOpen(true);
  };

  const handleDetailedModalClose = () => {
    setIsDetailedDialogOpen(false);
  };

  const handleDetailedFormSubmit = (data: UserDetailedInformationFormData) => {
    console.log("Detailed information submitted:", data);
    // Handle the form submission here
  };

  const handleBankCardClick = () => {
    redirect("/user/bank-card");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer">
        <div className="w-full px-4 py-4">
          <h1 className="text-lg font-medium text-center">
            Personal information
          </h1>
        </div>
      </div>

      {/* Content Container */}
      <div className="w-full px-4 py-6">
        <div className="space-y-3">
          {/* Head Portrait */}
          <div className="w-full shadow-sm bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <User className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span className="font-medium text-gray-800 truncate">
                  Head portrait
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-indigo-200">
                  <Avatar>
                    <AvatarImage src={selectedAvatar} />
                    <AvatarFallback>UN</AvatarFallback>
                  </Avatar>
                  <User className="w-5 h-5 text-indigo-600 hidden" />
                </div>
                <button
                  onClick={handleModalOpen}
                  className="flex items-center justify-center hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer" />
                </button>
              </div>
            </div>
          </div>

          {/* Avatar Selection Modal */}
          <AvatarSelector
            isOpen={isDialogOpen}
            onClose={handleModalClose}
            onSelect={handleAvatarSelect}
            selectedAvatar={selectedAvatar}
          />

          {/* Mobile Number */}
          <div className="w-full shadow-sm bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-gray-800 truncate">
                  Mobile number
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-gray-600 text-sm font-mono">
                  {isLoadingUser
                    ? "Loading..."
                    : userData?.phone || "Not available"}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="w-full shadow-sm bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="px-4 py-4">
              <button
                className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-1 -m-1 cursor-pointer"
                onClick={handleDetailedModalOpen}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-gray-800 truncate text-left">
                    Detailed information
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-indigo-600 font-medium text-sm">
                    Click Settings
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </div>
          </div>

          <UserDetailedInformation
            isOpen={isDetailedDialogOpen}
            onClose={handleDetailedModalClose}
            onSubmit={handleDetailedFormSubmit}
            userId={userData?.id || ""}
          />

          {/* Bank Card */}
          <div className="w-full shadow-sm bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="px-4 py-4">
              <button
                onClick={handleBankCardClick}
                className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-1 -m-1 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <span className="font-medium text-gray-800 truncate text-left">
                    Bank card
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-indigo-600 font-medium text-sm">
                    Click Settings
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Login Password */}
          <div className="w-full shadow-sm bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="px-4 py-4 cursor-pointer">
              <button
                onClick={() => handleSettingsClick("login-password")}
                className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-1 -m-1"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                  <Lock className="w-5 h-5 text-red-600 flex-shrink-0 cursor-pointer" />
                  <span className="font-medium text-gray-800 truncate text-left">
                    Login password
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer">
                  <span className="text-indigo-600 font-medium text-sm">
                    Click Settings
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Fund Password */}
          <div className="w-full shadow-sm bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="px-4 py-4 cursor-pointer">
              <button
                onClick={() => handleSettingsClick("fund-password")}
                className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-1 -m-1"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                  <Shield className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="font-medium text-gray-800 truncate text-left">
                    Fund password
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer">
                  <span className="text-indigo-600 font-medium text-sm">
                    Click Settings
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Empty Cache */}
          <div className="w-full shadow-sm bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="px-4 py-4 cursor-pointer">
              <button
                onClick={handleEmptyCache}
                className="w-full flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg p-1 -m-1"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                  <Trash2 className="w-5 h-5 text-gray-500 flex-shrink-0 cursor-pointer" />
                  <span className="font-medium text-gray-500 truncate text-left">
                    Empty the cache
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-6"></div>

          {/* Exit Login */}
          <div className="w-full shadow-sm bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="px-4 py-4 cursor-pointer">
              <button
                onClick={handleExitLogin}
                className="w-full flex items-center justify-center gap-3 hover:bg-red-50 transition-colors rounded-lg p-2 -m-2 cursor-pointer"
              >
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-600">Exit login</span>
              </button>
            </div>
          </div>

          {/* Change Password Modal */}
          <ChangePasswordModal
            isOpen={isChangePasswordModalOpen}
            onClose={() => setIsChangePasswordModalOpen(false)}
          />

          {/* Fund Password Modal */}
          <FundPasswordModal
            isOpen={isFundPasswordModalOpen}
            onClose={() => setIsFundPasswordModalOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default UserInfoOverview;
