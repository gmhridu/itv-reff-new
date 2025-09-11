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
  Phone,
  User,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AdminWallet {
  id: string;
  walletType: "JAZZCASH" | "EASYPAISA";
  walletNumber: string;
  walletHolderName: string;
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
    limit: 10,
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
  const [selectedWallet, setSelectedWallet] = useState<AdminWallet | null>(null);
  const [deleteWalletId, setDeleteWalletId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    walletType: "" as "JAZZCASH" | "EASYPAISA" | "",
    walletNumber: "",
    walletHolderName: "",
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

      if (walletTypeFilter !== "ALL") params.append("walletType", walletTypeFilter);
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
        description: "Failed to fetch wallets. Please check your connection.",
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

    // Validate form
    if (!formData.walletType || !formData.walletNumber || !formData.walletHolderName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

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
          description: data.message || `Wallet ${showEditModal ? 'updated' : 'created'} successfully`,
        });

        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        fetchWallets();
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${showEditModal ? 'update' : 'create'} wallet`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle wallet deletion
  const handleDelete = async (walletId: string) => {
    try {
      const response = await fetch(`/api/admin/topup-wallets/${walletId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Wallet deleted successfully",
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
      setDeleteWalletId(null);
    }
  };

  // Handle wallet status toggle
  const handleToggleStatus = async (wallet: AdminWallet) => {
    try {
      const response = await fetch(`/api/admin/topup-wallets/${wallet.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !wallet.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Wallet ${!wallet.isActive ? 'activated' : 'deactivated'} successfully`,
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

  // Reset form
  const resetForm = () => {
    setFormData({
      walletType: "",
      walletNumber: "",
      walletHolderName: "",
      isActive: true,
    });
    setSelectedWallet(null);
  };

  // Handle edit wallet
  const handleEdit = (wallet: AdminWallet) => {
    setSelectedWallet(wallet);
    setFormData({
      walletType: wallet.walletType,
      walletNumber: wallet.walletNumber,
      walletHolderName: wallet.walletHolderName,
      isActive: wallet.isActive,
    });
    setShowEditModal(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get wallet type badge
  const getWalletTypeBadge = (type: string) => {
    const config = {
      JAZZCASH: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Phone },
      EASYPAISA: { color: "bg-green-100 text-green-800 border-green-200", icon: CreditCard },
    };

    const { color, icon: Icon } = config[type as keyof typeof config] || config.JAZZCASH;

    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {type === "JAZZCASH" ? "JazzCash" : "EasyPaisa"}
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Inactive
      </Badge>
    );
  };

  // Load data on component mount
  useEffect(() => {
    fetchWallets();
  }, [pagination.page, walletTypeFilter, statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchWallets();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">All registered wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
            <p className="text-xs text-muted-foreground">Available for topup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Wallets</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statistics.inactive}</div>
            <p className="text-xs text-muted-foreground">Currently disabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Wallet Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Wallet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet number or holder name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={walletTypeFilter} onValueChange={setWalletTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Wallet Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                  <SelectItem value="EASYPAISA">EasyPaisa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wallets Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <div className="flex items-center space-x-4 p-4">
                          <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : wallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No wallets found</p>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddModal(true)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Wallet
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  wallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                            {wallet.walletHolderName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{wallet.walletHolderName}</p>
                            <p className="text-sm text-muted-foreground">{wallet.walletNumber}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getWalletTypeBadge(wallet.walletType)}</TableCell>
                      <TableCell>{getStatusBadge(wallet.isActive)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{wallet._count.topupRequests}</span>
                          <span className="text-xs text-muted-foreground">requests</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(wallet.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(wallet)}
                            title={wallet.isActive ? "Deactivate" : "Activate"}
                          >
                            {wallet.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(wallet)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Wallet</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this wallet? This action cannot be undone.
                                  {wallet._count.topupRequests > 0 && (
                                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                      <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm text-yellow-800">
                                          This wallet has {wallet._count.topupRequests} topup requests. Consider deactivating instead.
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(wallet.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} results
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Wallet Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Wallet</DialogTitle>
            <DialogDescription>
              Add a new admin wallet for users to send topup payments
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="walletType">Wallet Type *</Label>
              <Select
                value={formData.walletType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, walletType: value as "JAZZCASH" | "EASYPAISA" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                  <SelectItem value="EASYPAISA">EasyPaisa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletNumber">Wallet Number *</Label>
              <Input
                id="walletNumber"
                placeholder="Enter wallet/account number"
                value={formData.walletNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, walletNumber: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletHolderName">Account Holder Name *</Label>
              <Input
                id="walletHolderName"
                placeholder="Enter account holder name"
                value={formData.walletHolderName}
                onChange={(e) => setFormData(prev => ({ ...prev, walletHolderName: e.target.value }))}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <Label htmlFor="isActive">Active (available for topup)</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Wallet
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Wallet Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wallet</DialogTitle>
            <DialogDescription>
              Update wallet information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editWalletType">Wallet Type *</Label>
              <Select
                value={formData.walletType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, walletType: value as "JAZZCASH" | "EASYPAISA" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                  <SelectItem value="EASYPAISA">EasyPaisa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editWalletNumber">Wallet Number *</Label>
              <Input
                id="editWalletNumber"
                placeholder="Enter wallet/account number"
                value={formData.walletNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, walletNumber: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editWalletHolderName">Account Holder Name *</Label>
              <Input
                id="editWalletHolderName"
                placeholder="Enter account holder name"
                value={formData.walletHolderName}
                onChange={(e) => setFormData(prev => ({ ...prev, walletHolderName: e.target.value }))}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <Label htmlFor="editIsActive">Active (available for topup)</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Wallet
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
