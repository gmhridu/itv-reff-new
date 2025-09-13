"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
}

interface AnnouncementPopupProps {
  userId: string;
  isFirstLogin: boolean;
}

export default function AnnouncementPopup({ userId, isFirstLogin }: AnnouncementPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch unread announcements for the user
  const fetchUnreadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/announcements/unread");
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
      const response = await fetch(`/api/user/announcements/${announcementId}/read`, {
        method: "POST",
      });
      
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
      setCurrentAnnouncementIndex(prev => prev + 1);
    } else {
      // Mark last announcement as read and close
      markAsRead(announcements[currentAnnouncementIndex].id);
      setIsOpen(false);
    }
  };

  // Handle previous announcement
  const handlePrevious = () => {
    if (currentAnnouncementIndex > 0) {
      setCurrentAnnouncementIndex(prev => prev - 1);
    }
  };

  // Handle close
  const handleClose = () => {
    // Mark current announcement as read
    markAsRead(announcements[currentAnnouncementIndex].id);
    setIsOpen(false);
  };

  // Fetch announcements on component mount if it's first login
  useEffect(() => {
    if (isFirstLogin) {
      fetchUnreadAnnouncements();
    }
  }, [isFirstLogin]);

  // If not first login or no announcements, don't render anything
  if (!isFirstLogin || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentAnnouncementIndex];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl">
              {currentAnnouncement.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <CardContent className="p-6">
          {currentAnnouncement.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img 
                src={currentAnnouncement.imageUrl} 
                alt={currentAnnouncement.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          
          <p className="text-muted-foreground mb-6">
            {currentAnnouncement.message}
          </p>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {announcements.length > 1 && (
                <span>
                  {currentAnnouncementIndex + 1} of {announcements.length}
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              {currentAnnouncementIndex > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              
              <Button onClick={handleNext}>
                {currentAnnouncementIndex < announcements.length - 1 ? "Next" : "Got it"}
              </Button>
            </div>
          </div>
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}