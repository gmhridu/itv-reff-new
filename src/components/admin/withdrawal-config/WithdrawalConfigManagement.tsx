"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useWithdrawalConfig } from "@/hooks/useWithdrawalConfig";
import {
  Settings,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
} from "lucide-react";

interface ConfigFormData {
  minimumWithdrawal: string;
  maxDailyWithdrawals: string;
  withdrawalFeePercentage: string;
  usdtWithdrawalEnabled: boolean;
  bankWithdrawalEnabled: boolean;
  withdrawalProcessingTime: string;
  usdtProcessingTime: string;
  usdtToPkrRate: string;
}

export const WithdrawalConfigManagement = () => {
  const { toast } = useToast();
  const {
    config,
    stats,
    loading,
    error,
    updateConfig,
    refresh,
  } = useWithdrawalConfig();

  const [formData, setFormData] = useState<ConfigFormData>({
    minimumWithdrawal: "500",
    maxDailyWithdrawals: "5",
    withdrawalFeePercentage: "10",
    usdtWithdrawalEnabled: true,
    bankWithdrawalEnabled: true,
    withdrawalProcessingTime: "0-72 hours",
    usdtProcessingTime: "0-30 minutes",
    usdtToPkrRate: "295",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when config is loaded
  useEffect(() => {
    if (config) {
      setFormData({
        minimumWithdrawal: config.minimumWithdrawal.toString(),
        maxDailyWithdrawals: config.maxDailyWithdrawals.toString(),
        withdrawalFeePercentage: config.withdrawalFeePercentage.toString(),
        usdtWithdrawalEnabled: config.usdtWithdrawalEnabled,
        bankWithdrawalEnabled: config.bankWithdrawalEnabled,
        withdrawalProcessingTime: config.withdrawalProcessingTime,
        usdtProcessingTime: config.usdtProcessingTime,
        usdtToPkrRate: config.usdtToPkrRate.toString(),
      });
    }
  }, [config]);

  const handleInputChange = (
    field: keyof ConfigFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        minimumWithdrawal: parseFloat(formData.minimumWithdrawal),
        maxDailyWithdrawals: parseInt(formData.maxDailyWithdrawals),
        withdrawalFeePercentage: parseFloat(formData.withdrawalFeePercentage),
        usdtWithdrawalEnabled: formData.usdtWithdrawalEnabled,
        bankWithdrawalEnabled: formData.bankWithdrawalEnabled,
        withdrawalProcessingTime: formData.withdrawalProcessingTime,
        usdtProcessingTime: formData.usdtProcessingTime,
        usdtToPkrRate: parseFloat(formData.usdtToPkrRate),
      };

      const success = await updateConfig(updates);
      if (success) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData({
        minimumWithdrawal: config.minimumWithdrawal.toString(),
        maxDailyWithdrawals: config.maxDailyWithdrawals.toString(),
        withdrawalFeePercentage: config.withdrawalFeePercentage.toString(),
        usdtWithdrawalEnabled: config.usdtWithdrawalEnabled,
        bankWithdrawalEnabled: config.bankWithdrawalEnabled,
        withdrawalProcessingTime: config.withdrawalProcessingTime,
        usdtProcessingTime: config.usdtProcessingTime,
        usdtToPkrRate: config.usdtToPkrRate.toString(),
      });
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium text-red-600">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Withdrawal Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage withdrawal settings and system parameters
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {hasChanges && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Configuration</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reset all changes? This will restore
                    the configuration to its last saved state.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Withdrawals
                  </p>
                  <p className="text-2xl font-bold">{stats.totalWithdrawals}</p>
                </div>
                <Wallet className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Requests
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingWithdrawals}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Processed Today
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.todaysWithdrawals}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Amount
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₨{stats.pendingAmount.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Basic Settings</span>
            </CardTitle>
            <CardDescription>
              Configure basic withdrawal parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minimumWithdrawal">
                Minimum Withdrawal Amount (PKR)
              </Label>
              <Input
                id="minimumWithdrawal"
                type="number"
                value={formData.minimumWithdrawal}
                onChange={(e) =>
                  handleInputChange("minimumWithdrawal", e.target.value)
                }
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDailyWithdrawals">
                Daily Withdrawal Limit
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="maxDailyWithdrawals"
                  type="number"
                  value="1"
                  readOnly
                  className="bg-gray-50 text-gray-500"
                  title="Fixed at 1 withdrawal per day"
                />
                <Badge variant="secondary" className="text-xs">
                  Fixed Limit
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Users can make only one withdrawal request per day. This limit cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalFeePercentage">
                Bank Withdrawal Fee (%)
              </Label>
              <Input
                id="withdrawalFeePercentage"
                type="number"
                value={formData.withdrawalFeePercentage}
                onChange={(e) =>
                  handleInputChange("withdrawalFeePercentage", e.target.value)
                }
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usdtToPkrRate">USDT to PKR Rate</Label>
              <Input
                id="usdtToPkrRate"
                type="number"
                value={formData.usdtToPkrRate}
                onChange={(e) =>
                  handleInputChange("usdtToPkrRate", e.target.value)
                }
                min="100"
                max="1000"
                step="0.01"
              />
            </div>
          </CardContent>
        </Card>

        {/* Processing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Processing Settings</span>
            </CardTitle>
            <CardDescription>
              Configure processing times and method availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdrawalProcessingTime">
                Bank Withdrawal Processing Time
              </Label>
              <Input
                id="withdrawalProcessingTime"
                type="text"
                value={formData.withdrawalProcessingTime}
                onChange={(e) =>
                  handleInputChange("withdrawalProcessingTime", e.target.value)
                }
                placeholder="e.g., 0-72 hours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usdtProcessingTime">
                USDT Processing Time
              </Label>
              <Input
                id="usdtProcessingTime"
                type="text"
                value={formData.usdtProcessingTime}
                onChange={(e) =>
                  handleInputChange("usdtProcessingTime", e.target.value)
                }
                placeholder="e.g., 0-30 minutes"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Withdrawal Methods</Label>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Bank Withdrawals</span>
                </div>
                <Switch
                  checked={formData.bankWithdrawalEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("bankWithdrawalEnabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>USDT Withdrawals</span>
                </div>
                <Switch
                  checked={formData.usdtWithdrawalEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("usdtWithdrawalEnabled", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predefined Amounts */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Predefined Withdrawal Amounts</CardTitle>
            <CardDescription>
              Available withdrawal amounts for users to select
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {config.predefinedAmounts.map((amount) => (
                <Badge key={amount} variant="secondary" className="text-sm">
                  ₨{amount.toLocaleString()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Status Overview</CardTitle>
            <CardDescription>
              Current status breakdown of all withdrawal requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>Pending</span>
                  </TableCell>
                  <TableCell>{stats.pendingWithdrawals}</TableCell>
                  <TableCell>₨{stats.pendingAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {stats.totalWithdrawals > 0
                      ? ((stats.pendingWithdrawals / stats.totalWithdrawals) * 100).toFixed(1)
                      : 0}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Approved</span>
                  </TableCell>
                  <TableCell>{stats.approvedWithdrawals}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    {stats.totalWithdrawals > 0
                      ? ((stats.approvedWithdrawals / stats.totalWithdrawals) * 100).toFixed(1)
                      : 0}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Processed</span>
                  </TableCell>
                  <TableCell>{stats.processedWithdrawals}</TableCell>
                  <TableCell>₨{stats.processedAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {stats.totalWithdrawals > 0
                      ? ((stats.processedWithdrawals / stats.totalWithdrawals) * 100).toFixed(1)
                      : 0}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Rejected</span>
                  </TableCell>
                  <TableCell>{stats.rejectedWithdrawals}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    {stats.totalWithdrawals > 0
                      ? ((stats.rejectedWithdrawals / stats.totalWithdrawals) * 100).toFixed(1)
                      : 0}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
