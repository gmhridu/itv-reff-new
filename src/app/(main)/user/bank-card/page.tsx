"use client";

import React, { useState, useEffect } from "react";
import BankCard from "@/components/bank-card";
import UserDetailedInformation from "@/components/user-detailed-information";
import { Button } from "@/components/ui/button";
import { User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  userId: string;
  realName: string;
  createdAt: string;
  updatedAt: string;
}

const BankCardPage = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load user profile when user is available
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/user-profile?userId=${user.id}`);
      if (response.ok) {
        const { data } = await response.json();
        setUserProfile(data);
      } else if (response.status === 404) {
        // Profile doesn't exist yet, show modal to create one
        setIsProfileModalOpen(true);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (data: { realName: string }) => {
    // Profile updated successfully, reload the profile data
    await loadUserProfile();
    toast({
      title: "Success!",
      description: "Profile information updated successfully.",
      variant: "default",
    });
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  // Show loading state while auth is loading or profile is loading
  if (authLoading || isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-bold text-center mb-6">Bind Bank Card</h1>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (authError || !user) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-bold text-center mb-6">Bind Bank Card</h1>
        <div className="flex flex-col items-center justify-center py-8">
          <User className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center">
            {authError || "Please log in to access this page."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold text-center mb-6">Bind Bank Card</h1>

      {/* User Profile Section */}
      {userProfile ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Profile Name</p>
                <p className="font-semibold">{userProfile.realName}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openProfileModal}>
              Edit Profile
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-800">
                  Profile information required
                </p>
                <p className="text-xs text-yellow-600">
                  Please set up your profile before adding bank cards
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={openProfileModal}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Set Profile
            </Button>
          </div>
        </div>
      )}

      {/* Bank Card Component */}
      <BankCard userId={user.id} userRealName={userProfile?.realName} />

      {/* User Profile Modal */}
      <UserDetailedInformation
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        onSubmit={handleProfileUpdate}
        userId={user.id}
        title="Profile Information"
        defaultValues={
          userProfile ? { realName: userProfile.realName } : undefined
        }
      />
    </div>
  );
};

export default BankCardPage;
