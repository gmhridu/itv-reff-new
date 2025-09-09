"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  X,
  Loader2,
  Wallet,
  Trophy,
  Video,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationPopover({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  } = useNotifications({
    userId: user?.id || "",
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "SUCCESS":
        return "bg-green-50 text-green-700 border-green-200";
      case "WARNING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "ERROR":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "WITHDRAWAL":
        return <Wallet className="w-4 h-4" />;
      case "EARNINGS":
        return <DollarSign className="w-4 h-4" />;
      case "VIDEO_COMPLETE":
        return <Video className="w-4 h-4" />;
      case "LEVEL_UP":
        return <Trophy className="w-4 h-4" />;
      case "TASK":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-slate-100 border border-slate-200/50 hover:border-slate-300/50 rounded-xl transition-all duration-200"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500 text-white border-2 border-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Notifications
                    </h3>
                    <p className="text-xs text-slate-600">
                      {unreadCount} unread
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log("Manual refresh triggered");
                      fetchNotifications();
                    }}
                    className="text-xs h-8 px-3 hover:bg-white/50 border border-slate-200/50"
                  >
                    Refresh
                  </Button>
                  {unreadCount > 0 && !loading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-8 px-3 hover:bg-white/50 border border-slate-200/50"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="relative w-8 h-8 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-sm text-slate-600 animate-pulse">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="font-medium text-slate-900 mb-2">
                    No notifications yet
                  </h4>
                  <p className="text-sm text-slate-600">
                    We'll notify you about withdrawals, earnings, and more
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-all duration-200 cursor-pointer group ${
                        !notification.isRead
                          ? "bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                      onClick={() =>
                        !notification.isRead && markAsRead(notification.id)
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            notification.severity === "SUCCESS"
                              ? "bg-green-100 text-green-600"
                              : notification.severity === "WARNING"
                                ? "bg-yellow-100 text-yellow-600"
                                : notification.severity === "ERROR"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {getTypeIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex justify-between items-center">
                            <Badge
                              className={`text-xs px-2 py-1 border ${getSeverityColor(
                                notification.severity,
                              )}`}
                              variant="outline"
                            >
                              {notification.severity.toLowerCase()}
                            </Badge>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && !loading && (
              <div className="p-3 border-t border-slate-200/50 bg-slate-50/50">
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-600 hover:text-slate-900 h-8"
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to full notifications page if needed
                    }}
                  >
                    View all notifications
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
