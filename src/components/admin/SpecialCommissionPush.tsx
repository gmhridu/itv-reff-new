"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Users,
  Gift,
  AlertCircle,
  CheckCircle,
  Loader2,
  Send,
  Target,
  Calendar,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SpecialCommissionPushProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  onSuccess?: () => void;
}

interface CommissionPushForm {
  targetType: "single" | "multiple" | "all";
  targetUserId?: string;
  targetUserIds: string[];
  amount: number;
  reason: string;
  description: string;
  isBonus: boolean;
  isUrgent: boolean;
  notifyUser: boolean;
  expiresAt?: Date;
}

export function SpecialCommissionPush({
  userId,
  userName,
  userEmail,
  onSuccess,
}: SpecialCommissionPushProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CommissionPushForm>({
    targetType: userId ? "single" : "multiple",
    targetUserId: userId,
    targetUserIds: userId ? [userId] : [],
    amount: 0,
    reason: "",
    description: "",
    isBonus: false,
    isUrgent: false,
    notifyUser: true,
    expiresAt: undefined,
  });

  const [previewData, setPreviewData] = useState<{
    totalUsers: number;
    totalAmount: number;
    affectedUsers: Array<{ id: string; name: string; email: string }>;
  } | null>(null);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || formData.amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid commission amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for this commission push",
        variant: "destructive",
      });
      return;
    }

    if (formData.targetType === "multiple" && formData.targetUserIds.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user for the commission push",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/special-commission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          targetUserId: formData.targetType === "single" ? formData.targetUserId : undefined,
          targetUserIds: formData.targetType === "multiple" ? formData.targetUserIds : undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to process commission push");
      }

      toast({
        title: "Success",
        description: result.message || "Commission push processed successfully",
      });

      setIsOpen(false);
      onSuccess?.();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      targetType: userId ? "single" : "multiple",
      targetUserId: userId,
      targetUserIds: userId ? [userId] : [],
      amount: 0,
      reason: "",
      description: "",
      isBonus: false,
      isUrgent: false,
      notifyUser: true,
      expiresAt: undefined,
    });
    setPreviewData(null);
  };

  const handlePreview = async () => {
    if (formData.targetType === "multiple" && formData.targetUserIds.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to preview the commission push",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/special-commission/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType: formData.targetType,
          targetUserId: formData.targetType === "single" ? formData.targetUserId : undefined,
          targetUserIds: formData.targetType === "multiple" ? formData.targetUserIds : undefined,
          amount: formData.amount,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to generate preview");
      }

      setPreviewData(result.data);
    } catch (error) {
      toast({
        title: "Preview Error",
        description: error instanceof Error ? error.message : "Failed to generate preview",
        variant: "destructive",
      });
    }
  };

  const predefinedReasons = [
    "Performance Bonus",
    "Referral Bonus",
    "Special Incentive",
    "Holiday Bonus",
    "Achievement Reward",
    "Customer Service Excellence",
    "Sales Target Achievement",
    "Team Performance",
    "Quality Improvement",
    "Innovation Award",
    "Other",
  ];

  const predefinedAmounts = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Gift className="h-4 w-4" />
          Special Commission Push
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Special Commission Push
          </DialogTitle>
          <DialogDescription>
            Send special commission payments to users. This will be added to their wallet balance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Target Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value: "single" | "multiple" | "all") =>
                    setFormData((prev) => ({ ...prev, targetType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single User</SelectItem>
                    <SelectItem value="multiple">Multiple Users</SelectItem>
                    <SelectItem value="all">All Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.targetType === "single" && (
                <div className="space-y-2">
                  <Label>Target User</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{userName || "Selected User"}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {userEmail || "User Email"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.targetType === "multiple" && (
                <div className="space-y-2">
                  <Label>User Selection</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Multiple user selection will be implemented with user search functionality
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {formData.targetUserIds.length} users
                    </p>
                  </div>
                </div>
              )}

              {formData.targetType === "all" && (
                <div className="space-y-2">
                  <Label>All Users</Label>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        This will send commission to ALL active users in the system
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Commission Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commission Amount (PKR)</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="Enter amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quick Select</Label>
                  <div className="flex flex-wrap gap-1">
                    {predefinedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, amount }))
                        }
                        className="text-xs"
                      >
                        {amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, reason: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Additional details about this commission push"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mark as Bonus</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This commission will be marked as a bonus payment
                  </p>
                </div>
                <Switch
                  checked={formData.isBonus}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isBonus: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Urgent Payment</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mark this as an urgent payment requiring immediate processing
                  </p>
                </div>
                <Switch
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isUrgent: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify User</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send notification to user about this commission
                  </p>
                </div>
                <Switch
                  checked={formData.notifyUser}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, notifyUser: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          {formData.amount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Commission Amount:</span>
                    <Badge variant="outline" className="font-mono">
                      PKR {formData.amount.toLocaleString()}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Target Type:</span>
                    <Badge variant="secondary">
                      {formData.targetType === "single"
                        ? "Single User"
                        : formData.targetType === "multiple"
                        ? "Multiple Users"
                        : "All Users"}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reason:</span>
                    <Badge variant="outline">{formData.reason}</Badge>
                  </div>

                  {formData.isBonus && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Type:</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Bonus Payment
                      </Badge>
                    </div>
                  )}

                  {formData.isUrgent && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Priority:</span>
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Urgent
                      </Badge>
                    </div>
                  )}

                  <Separator />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Generate Preview
                  </Button>

                  {previewData && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Users:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {previewData.totalUsers}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Amount:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            PKR {previewData.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Commission Push
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
