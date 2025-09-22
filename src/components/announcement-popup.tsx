"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  Gift,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { format } from "date-fns";

interface CustomOffer {
  type: "discount" | "bonus" | "cashback" | "free_tasks" | "position_upgrade";
  value: string;
  expiry?: string;
  code?: string;
  description?: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
  metadata?: string;
  targetType?: string;
  expiresAt?: string;
  scheduledAt?: string;
}

interface AnnouncementPopupProps {
  userId: string;
  isFirstLogin: boolean;
}

export default function AnnouncementPopup({
  userId,
  isFirstLogin,
}: AnnouncementPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch unread announcements for the user
  const fetchUnreadAnnouncements = async () => {
    try {
      setLoading(true);
      // Fixed the API endpoint URL - it should be /api/user/announcements not /api/user/announcements/unread
      const response = await fetch("/api/user/announcements");
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data.announcements);
        if (data.data.announcements.length > 0) {
          setIsOpen(true);
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch announcements",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark announcement as read
  const markAsRead = async (announcementId: string) => {
    try {
      // Fixed the API endpoint URL - it should be /api/user/announcements/[id]/read
      const response = await fetch(
        `/api/user/announcements/${announcementId}/read`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!data.success) {
        toast({
          title: "Error",
          description: data.error || "Failed to mark announcement as read",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error marking announcement as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark announcement as read",
        variant: "destructive",
      });
    }
  };

  // Handle next announcement
  const handleNext = () => {
    if (currentAnnouncementIndex < announcements.length - 1) {
      // Mark current announcement as read
      markAsRead(announcements[currentAnnouncementIndex].id);
      setCurrentAnnouncementIndex((prev) => prev + 1);
    } else {
      // Mark last announcement as read and close
      markAsRead(announcements[currentAnnouncementIndex].id);
      setIsOpen(false);
    }
  };

  // Handle previous announcement
  const handlePrevious = () => {
    if (currentAnnouncementIndex > 0) {
      setCurrentAnnouncementIndex((prev) => prev - 1);
    }
  };

  // Handle close
  const handleClose = () => {
    // Mark current announcement as read
    markAsRead(announcements[currentAnnouncementIndex].id);
    setIsOpen(false);
  };

  // Fetch announcements on component mount
  useEffect(() => {
    // For first login, show immediately
    if (isFirstLogin) {
      fetchUnreadAnnouncements();
    } else {
      // For dashboard, show after 3 seconds delay
      const timer = setTimeout(() => {
        fetchUnreadAnnouncements();
      }, 3000);

      // Clean up timer on unmount
      return () => clearTimeout(timer);
    }
  }, [isFirstLogin]);

  // If no announcements, don't render anything
  if (announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentAnnouncementIndex];

  // Parse custom offer from announcement metadata
  const getCustomOffer = (announcement: Announcement): CustomOffer | null => {
    if (!announcement.metadata) return null;
    try {
      const metadata = JSON.parse(announcement.metadata);
      return metadata.customOffer || null;
    } catch {
      return null;
    }
  };

  const currentOffer = getCustomOffer(currentAnnouncement);

  // Get offer type display info
  const getOfferTypeInfo = (type: CustomOffer["type"]) => {
    const types = {
      discount: { label: "Discount", icon: Tag, color: "bg-red-500" },
      bonus: { label: "Bonus", icon: Gift, color: "bg-green-500" },
      cashback: { label: "Cashback", icon: Sparkles, color: "bg-blue-500" },
      free_tasks: { label: "Free Tasks", icon: Users, color: "bg-purple-500" },
      position_upgrade: {
        label: "Position Upgrade",
        icon: Users,
        color: "bg-orange-500",
      },
    };
    return types[type];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl p-0 gap-0 max-h-[90vh] overflow-hidden">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="absolute inset-0 bg-black/10"></div>
          <DialogHeader className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold">
                  {currentAnnouncement.title}
                </DialogTitle>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(
                      new Date(currentAnnouncement.createdAt),
                      "MMM d, yyyy",
                    )}
                  </span>
                  {announcements.length > 1 && (
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white border-0"
                    >
                      {currentAnnouncementIndex + 1} of {announcements.length}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <CardContent className="p-6 space-y-6">
            {/* Image */}
            {currentAnnouncement.imageUrl && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={currentAnnouncement.imageUrl}
                  alt={currentAnnouncement.title}
                  width={800}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            )}

            {/* Message */}
            <div className="prose max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentAnnouncement.message}
              </p>
            </div>

            {/* Custom Offer Section */}
            {currentOffer && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${getOfferTypeInfo(currentOffer.type).color}`}
                  >
                    {(() => {
                      const IconComponent = getOfferTypeInfo(
                        currentOffer.type,
                      ).icon;
                      return <IconComponent className="h-6 w-6 text-white" />;
                    })()}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Special Offer:{" "}
                        {getOfferTypeInfo(currentOffer.type).label}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-yellow-200 text-yellow-800"
                      >
                        Exclusive
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-gray-900">
                          {currentOffer.value}
                        </div>
                        {currentOffer.code && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Use code:
                            </span>
                            <Badge
                              variant="outline"
                              className="font-mono text-lg px-3 py-1"
                            >
                              {currentOffer.code}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {currentOffer.expiry && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            Expires:{" "}
                            {format(
                              new Date(currentOffer.expiry),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {currentOffer.description && (
                      <p className="text-gray-600 italic">
                        {currentOffer.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Expiry Notice */}
            {currentAnnouncement.expiresAt && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  This announcement expires on{" "}
                  {format(
                    new Date(currentAnnouncement.expiresAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </div>

        {/* Footer with navigation */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {announcements.length > 1 && (
                <div className="flex items-center gap-1">
                  {announcements.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentAnnouncementIndex
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {currentAnnouncementIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {currentAnnouncementIndex < announcements.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4" />
                    Got it!
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
