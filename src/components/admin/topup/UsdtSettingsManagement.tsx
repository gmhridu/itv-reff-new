"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  DollarSign,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Calendar,
  Wallet,
  Zap,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Edit2,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface UsdtSettings {
  usdtToPkrRate: number;
  lastUpdated: string | null;
  bonusPercentage: number;
  usdtWallet: {
    id: string;
    walletHolderName: string;
    usdtWalletAddress: string;
    qrCodeUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
      topupRequests: number;
    };
  } | null;
}

export function UsdtSettingsManagement() {
  const { toast } = useToast();

  // State management
  const [settings, setSettings] = useState<UsdtSettings>({
    usdtToPkrRate: 295,
    lastUpdated: null,
    bonusPercentage: 3,
    usdtWallet: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    usdtToPkrRate: 295,
    walletHolderName: "",
    usdtWalletAddress: "",
    qrCodeUrl: "",
  });

  // Modal states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Fetch USDT settings
  const fetchSettings = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/admin/usdt-settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setFormData({
          usdtToPkrRate: data.data.usdtToPkrRate,
          walletHolderName: data.data.usdtWallet?.walletHolderName || "",
          usdtWalletAddress: data.data.usdtWallet?.usdtWalletAddress || "",
          qrCodeUrl: data.data.usdtWallet?.qrCodeUrl || "",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch USDT settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching USDT settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch USDT settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchSettings(true);
  };

  // Handle save settings
  const handleSave = async () => {
    setSaving(true);

    try {
      // Validate rate
      if (formData.usdtToPkrRate <= 0) {
        toast({
          title: "Validation Error",
          description: "USDT to PKR rate must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/admin/usdt-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchSettings();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update USDT settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating USDT settings:", error);
      toast({
        title: "Error",
        description: "Failed to update USDT settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Copied to clipboard",
      });
    });
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never updated";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate rate change percentage (mock data)
  const getRateChangePercentage = () => {
    // In a real implementation, you would calculate this based on historical data
    return Math.random() > 0.5 ? "+2.3%" : "-1.8%";
  };

  const isPositiveChange = getRateChangePercentage().startsWith("+");

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-600" />
            USDT Settings Management
          </h2>
          <p className="text-gray-600">
            Configure USDT exchange rates and wallet settings
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Current Rate Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current USDT Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {settings.usdtToPkrRate} PKR
                </p>
                <p className="text-xs text-gray-500">per 1 USDT</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <div
                className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  isPositiveChange
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-red-700 bg-red-50"
                }`}
              >
                <TrendingUp
                  className={`w-3 h-3 mr-1 ${!isPositiveChange ? "rotate-180" : ""}`}
                />
                {getRateChangePercentage()}
              </div>
              <span className="text-xs text-gray-500 ml-2">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bonus Percentage</p>
                <p className="text-2xl font-bold text-emerald-600">
                  +{settings.bonusPercentage}%
                </p>
                <p className="text-xs text-gray-500">commission bonus</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <Badge className="mt-2 bg-emerald-500 hover:bg-emerald-600">
              Fixed Rate
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(settings.lastUpdated)}
                </p>
                <p className="text-xs text-gray-500">rate update</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-600" />
            Exchange Rate Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usdtRate">USDT to PKR Rate</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  id="usdtRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.usdtToPkrRate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      usdtToPkrRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="Enter rate (e.g., 295.50)"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update Rate
              </Button>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Rate Update Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This rate will be displayed to users during top-up</li>
                  <li>
                    Users will see the PKR equivalent of their USDT amount
                  </li>
                  <li>
                    Rate should be updated regularly to reflect market prices
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USDT Wallet Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-600" />
            USDT Wallet Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.usdtWallet ? (
            <div className="space-y-4">
              {/* Wallet Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      settings.usdtWallet.isActive
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {settings.usdtWallet.walletHolderName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {settings.usdtWallet._count.topupRequests} transactions
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    settings.usdtWallet.isActive
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-red-500 hover:bg-red-600"
                  }
                >
                  {settings.usdtWallet.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Wallet Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Wallet Holder Name</Label>
                  <Input
                    value={formData.walletHolderName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        walletHolderName: e.target.value,
                      }))
                    }
                    placeholder="Enter wallet holder name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>USDT Wallet Address (TRC20)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.usdtWalletAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          usdtWalletAddress: e.target.value,
                        }))
                      }
                      placeholder="Enter USDT TRC20 wallet address"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopy(settings.usdtWallet?.usdtWalletAddress || "")
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddressModal(true)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>QR Code URL (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.qrCodeUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          qrCodeUrl: e.target.value,
                        }))
                      }
                      placeholder="Enter QR code image URL"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQrModal(true)}
                      disabled={!settings.usdtWallet?.qrCodeUrl}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload QR code image and paste the URL here
                  </p>
                </div>
              </div>

              {/* QR Code Preview */}
              {settings.usdtWallet.qrCodeUrl && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-4">
                    <img
                      src={settings.usdtWallet.qrCodeUrl}
                      alt="USDT QR Code"
                      className="w-24 h-24 border-2 border-purple-300 rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-900 mb-2">
                        QR Code Preview
                      </h4>
                      <p className="text-sm text-purple-700">
                        Users will see this QR code when selecting USDT payment
                        method. Make sure it's clear and scannable.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQrModal(true)}
                        className="mt-2"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Size
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Wallet Configuration
              </Button>
            </div>
          ) : (
            /* No Wallet Configured */
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No USDT Wallet Configured
              </h3>
              <p className="text-gray-600 mb-6">
                Configure a USDT wallet to enable cryptocurrency top-ups with
                bonus rewards.
              </p>
              <Button onClick={() => setShowWalletModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Configure USDT Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bonus Information */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Zap className="w-5 h-5" />
            USDT Bonus System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-emerald-800">How it works:</h4>
              <ul className="space-y-2 text-sm text-emerald-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  User selects USDT (TRC20) payment method
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Amount is added to Main Wallet at current rate
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-600" />
                  Additional 3% bonus goes to Commission Wallet
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-emerald-800">Example:</h4>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-700">
                  <strong>User deposits:</strong> 100 USDT
                  <br />
                  <strong>Rate:</strong> {settings.usdtToPkrRate} PKR/USDT
                  <br />
                  <strong>Main Wallet:</strong> +
                  {(100 * settings.usdtToPkrRate).toLocaleString()} PKR
                  <br />
                  <strong>Commission Wallet:</strong> +
                  {(100 * settings.usdtToPkrRate * 0.03).toLocaleString()} PKR
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
            <DialogDescription>
              USDT wallet QR code for user scanning
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {settings.usdtWallet?.qrCodeUrl && (
              <div className="text-center">
                <img
                  src={settings.usdtWallet.qrCodeUrl}
                  alt="USDT QR Code"
                  className="w-full max-w-xs mx-auto border-2 border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {settings.usdtWallet.usdtWalletAddress?.substring(0, 20)}...
                </p>
              </div>
            )}
            <Button
              onClick={() => setShowQrModal(false)}
              className="w-full"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>USDT Wallet Address</DialogTitle>
            <DialogDescription>Full wallet address details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium text-gray-700">
                Wallet Address:
              </Label>
              <p className="font-mono text-sm break-all mt-1">
                {settings.usdtWallet?.usdtWalletAddress}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  handleCopy(settings.usdtWallet?.usdtWalletAddress || "")
                }
                className="flex-1"
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
              <Button
                onClick={() => setShowAddressModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
