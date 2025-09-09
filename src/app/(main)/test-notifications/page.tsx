"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { NotificationPopover } from "@/components/notification-popover";
import DashboardHeader from "@/components/DashboardHeader";

export default function TestNotificationsPage() {
  const [testMessage, setTestMessage] = useState("Test withdrawal notification");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createTestNotification = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/test-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Test Notification",
          message: testMessage,
          type: "WITHDRAWAL_REQUEST",
          severity: "SUCCESS",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Test notification created!",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating test notification:", error);
      toast({
        title: "Error",
        description: "Failed to create test notification",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <DashboardHeader user={{ id: "test-user" }} />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Test Notification System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-message">Test Message</Label>
              <Input
                id="test-message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test notification message"
              />
            </div>

            <Button
              onClick={createTestNotification}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Test Notification"}
            </Button>

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Instructions:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Create Test Notification" to send a test notification</li>
                <li>Check the notification bell icon in the header</li>
                <li>The notification should appear in real-time if Socket.IO is working</li>
                <li>If not real-time, try clicking "Refresh" in the notification popover</li>
              </ol>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Socket.IO Connection Status</h3>
              <p className="text-sm text-gray-600">
                Check browser console for Socket.IO connection logs when this page loads.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
