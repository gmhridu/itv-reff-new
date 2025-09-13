"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Wallet,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "@/hooks/use-toast";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface AdminWallet {
  id: string;
  walletType: "JAZZCASH" | "EASYPAISA" | "USDT_TRC20";
  walletNumber?: string;
  walletHolderName: string;
  usdtWalletAddress?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    topupRequests: number;
  };
}

interface Statistics {
  total: number;
  active: number;
  inactive: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const TopupWalletManagement = () => {
  const { toast } = useToast();

  // State management
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [walletTypeFilter, setWalletTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<AdminWallet | null>(
    null,
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<AdminWallet | null>(
    null,
  );

  // Form states
  const [formData, setFormData] = useState({
    walletType: "" as "JAZZCASH" | "EASYPAISA" | "USDT_TRC20" | "",
    walletNumber: "",
    walletHolderName: "",
    usdtWalletAddress: "",
    qrCodeUrl: "",
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Fetch wallets
  const fetchWallets = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (walletTypeFilter !== "ALL")
        params.append("walletType", walletTypeFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/admin/topup-wallets?${params}`);
      const data = await response.json();

      if (data.success) {
        setWallets(data.data.wallets);
        setStatistics(data.data.statistics);
        setPagination(data.data.pagination);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch wallets",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch wallets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchWallets(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = showEditModal
        ? `/api/admin/topup-wallets/${selectedWallet?.id}`
        : "/api/admin/topup-wallets";

      const method = showEditModal ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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

        setShowAddModal(false);
        setShowEditModal(false);
        setFormData({
          walletType: "",
          walletNumber: "",
          walletHolderName: "",
          usdtWalletAddress: "",
          qrCodeUrl: "",
          isActive: true,
        });
        setSelectedWallet(null);
        fetchWallets();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving wallet:", error);
      toast({
        title: "Error",
        description: "Failed to save wallet",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!walletToDelete) return;

    try {
      const response = await fetch(
        `/api/admin/topup-wallets/${walletToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchWallets();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting wallet:", error);
      toast({
        title: "Error",
        description: "Failed to delete wallet",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setWalletToDelete(null);
    }
  };

  // Handle edit
  const handleEdit = (wallet: AdminWallet) => {
    setSelectedWallet(wallet);
    setFormData({
      walletType: wallet.walletType,
      walletNumber: wallet.walletNumber || "",
      walletHolderName: wallet.walletHolderName,
      usdtWalletAddress: wallet.usdtWalletAddress || "",
      qrCodeUrl: wallet.qrCodeUrl || "",
      isActive: wallet.isActive,
    });
    setShowEditModal(true);
  };

  // Handle toggle status
  const handleToggleStatus = async (wallet: AdminWallet) => {
    try {
      const response = await fetch(`/api/admin/topup-wallets/${wallet.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !wallet.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Wallet ${!wallet.isActive ? "activated" : "deactivated"} successfully`,
        });
        fetchWallets();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update wallet status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating wallet status:", error);
      toast({
        title: "Error",
        description: "Failed to update wallet status",
        variant: "destructive",
      });
    }
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        className={`${
          isActive
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-red-100 text-red-800 border-red-200"
        } flex items-center gap-1 px-3 py-1`}
      >
        {isActive ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  // Get wallet type badge
  const getWalletTypeBadge = (type: string) => {
    if (type === "USDT_TRC20") {
      return (
        <Badge className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-orange-200 flex items-center gap-1 px-3 py-1">
          <span className="text-xs font-bold">₿</span>
          USDT (TRC20)
        </Badge>
      );
    }

    const isJazzCash = type === "JAZZCASH";
    return (
      <Badge
        className={`${
          isJazzCash
            ? "bg-orange-100 text-orange-800 border-orange-200"
            : "bg-blue-100 text-blue-800 border-blue-200"
        } flex items-center gap-1 px-3 py-1`}
      >
        <CreditCard className="w-3 h-3" />
        {isJazzCash ? "JazzCash" : "EasyPaisa"}
      </Badge>
    );
  };

  // Filter wallets based on search term
  const filteredWallets = wallets.filter(
    (wallet) =>
      searchTerm === "" ||
      (wallet.walletNumber && wallet.walletNumber.includes(searchTerm)) ||
      wallet.walletHolderName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      wallet.walletType.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchWallets();
  }, [pagination.page, walletTypeFilter, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [walletTypeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Wallets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Wallets</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inactive Wallets</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.inactive}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Wallet Management
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="outline"
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button onClick={() => setShowAddModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Wallet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search wallets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={walletTypeFilter}
              onValueChange={setWalletTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                <SelectItem value="EASYPAISA">EasyPaisa</SelectItem>
                <SelectItem value="USDT_TRC20">USDT (TRC20)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Wallets List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Wallets ({filteredWallets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : filteredWallets.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Wallets Found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ||
                walletTypeFilter !== "ALL" ||
                statusFilter !== "ALL"
                  ? "No wallets found matching your filters."
                  : "No wallets have been added yet."}
              </p>
              {(searchTerm ||
                walletTypeFilter !== "ALL" ||
                statusFilter !== "ALL") && (
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setWalletTypeFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getWalletTypeBadge(wallet.walletType)}
                        {getStatusBadge(wallet.isActive)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {wallet.walletHolderName}
                      </h3>
                      <p className="text-gray-600 font-mono">
                        {wallet.walletType === "USDT_TRC20"
                          ? `${wallet.usdtWalletAddress?.substring(0, 20)}...`
                          : wallet.walletNumber || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {wallet._count.topupRequests} topup requests
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(wallet)}
                      >
                        {wallet.isActive ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(wallet)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setWalletToDelete(wallet);
                          setShowDeleteDialog(true);
                        }}
                        disabled={wallet._count.topupRequests > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Wallet Modal */}
      <Dialog
        open={showAddModal || showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedWallet(null);
            setFormData({
              walletType: "",
              walletNumber: "",
              walletHolderName: "",
              usdtWalletAddress: "",
              qrCodeUrl: "",
              isActive: true,
            });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showEditModal ? "Edit Wallet" : "Add New Wallet"}
            </DialogTitle>
            <DialogDescription>
              {showEditModal
                ? "Update wallet information"
                : "Add a new wallet for topup requests"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walletType">Wallet Type</Label>
              <Select
                value={formData.walletType}
                onValueChange={(value: "JAZZCASH" | "EASYPAISA") =>
                  setFormData((prev) => ({ ...prev, walletType: value }))
                }
                disabled={showEditModal}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                  <SelectItem value="EASYPAISA">EasyPaisa</SelectItem>
                  <SelectItem value="USDT_TRC20">USDT (TRC20)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.walletType === "USDT_TRC20" ? (
              <div className="space-y-2">
                <Label htmlFor="usdtWalletAddress">
                  USDT Wallet Address (TRC20)
                </Label>
                <Input
                  id="usdtWalletAddress"
                  type="text"
                  value={formData.usdtWalletAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      usdtWalletAddress: e.target.value,
                    }))
                  }
                  placeholder="Enter USDT TRC20 wallet address"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="walletNumber">Wallet Number</Label>
                <Input
                  id="walletNumber"
                  type="text"
                  value={formData.walletNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      walletNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter wallet number"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="walletHolderName">Wallet Holder Name</Label>
              <Input
                id="walletHolderName"
                type="text"
                value={formData.walletHolderName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    walletHolderName: e.target.value,
                  }))
                }
                placeholder="Enter holder name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qrCodeUrl">QR Code URL (Optional)</Label>
              <Input
                id="qrCodeUrl"
                type="url"
                value={formData.qrCodeUrl}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    qrCodeUrl: e.target.value,
                  }))
                }
                placeholder="Enter QR code image URL"
              />
              <p className="text-xs text-gray-500">
                Upload QR code image and paste the URL here
              </p>
            </div>

            {showEditModal && (
              <div className="flex items-center space-x-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                disabled={formLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                <Save className="w-4 h-4 mr-2" />
                {formLoading
                  ? "Saving..."
                  : showEditModal
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              wallet "{walletToDelete?.walletHolderName}" (
              {walletToDelete?.walletNumber}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
