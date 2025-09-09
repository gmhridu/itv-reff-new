"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
  Copy,
  ExternalLink,
  Wallet,
  RefreshCw,
  Receipt,
  Hash,
  MessageSquare,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  walletBalance: number;
  commissionBalance: number;
}

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  paymentDetails: {
    bankName: string;
    accountNumber: string;
    cardHolderName: string;
    walletType: string;
    handlingFee: number;
  };
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  adminNotes?: string;
  processedAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface Statistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  processed: number;
  totalAmount: number;
  pendingAmount: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const WithdrawalManagement = () => {
  const { toast } = useToast();

  // State management
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    processed: 0,
    totalAmount: 0,
    pendingAmount: 0,
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Modal states
  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(
    null,
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (dateRange.from) params.append("dateFrom", dateRange.from);
      if (dateRange.to) params.append("dateTo", dateRange.to);

      const response = await fetch(
        `/api/admin/withdrawal-management?${params}`,
      );
      const data = await response.json();

      if (data.success) {
        setWithdrawalRequests(data.data.withdrawalRequests);
        setStatistics(data.data.statistics);
        setPagination(data.data.pagination);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch withdrawal requests",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update withdrawal status
  const updateWithdrawalStatus = async (
    requestId: string,
    status: string,
    notes?: string,
    txId?: string,
  ) => {
    try {
      setIsProcessing(true);

      const response = await fetch("/api/admin/withdrawal-management", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          withdrawalRequestId: requestId,
          status,
          adminNotes: notes,
          transactionId: txId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default",
        });

        // Refresh the list
        await fetchWithdrawalRequests();

        // Close modals
        setShowActionModal(false);
        setShowDetailsModal(false);
        resetModalStates();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update withdrawal status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      toast({
        title: "Error",
        description: "Failed to update withdrawal status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModalStates = () => {
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes("");
    setTransactionId("");
  };

  const handleAction = (
    request: WithdrawalRequest,
    action: "APPROVE" | "REJECT",
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    await updateWithdrawalStatus(
      selectedRequest.id,
      actionType === "APPROVE" ? "APPROVED" : "REJECTED",
      adminNotes,
      actionType === "APPROVE" && transactionId ? transactionId : undefined,
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: {
        className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
        icon: Clock,
        text: "Pending",
      },
      APPROVED: {
        className: "bg-green-50 text-green-700 border border-green-200",
        icon: CheckCircle,
        text: "Approved",
      },
      REJECTED: {
        className: "bg-red-50 text-red-700 border border-red-200",
        icon: XCircle,
        text: "Rejected",
      },
      PROCESSED: {
        className: "bg-blue-50 text-blue-700 border border-blue-200",
        icon: CheckCircle,
        text: "Processed",
      },
    };

    const variant =
      variants[status as keyof typeof variants] || variants.PENDING;
    const IconComponent = variant.icon;

    return (
      <Badge
        className={`${variant.className} flex items-center gap-1 px-2 py-1`}
      >
        <IconComponent className="w-3 h-3" />
        {variant.text}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchWithdrawalRequests();
  }, [pagination.page, pagination.limit, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        fetchWithdrawalRequests();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Modern Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Withdrawal Management
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Manage user withdrawal requests and track payment statuses
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-slate-200 hover:bg-slate-50"
                onClick={fetchWithdrawalRequests}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Total Requests
              </CardTitle>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {statistics.total}
              </div>
              <p className="text-sm text-slate-500">All withdrawal requests</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Pending
              </CardTitle>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {statistics.pending}
              </div>
              <p className="text-sm text-slate-500">
                {formatCurrency(statistics.pendingAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Approved
              </CardTitle>
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {statistics.approved}
              </div>
              <p className="text-sm text-slate-500">Ready for processing</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">
                Total Amount
              </CardTitle>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {formatCurrency(statistics.totalAmount)}
              </div>
              <p className="text-sm text-slate-500">All withdrawal requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Modern Filters */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <CardTitle className="text-lg font-semibold text-slate-900">
                Filters & Search
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by user name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 border-slate-200">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="PROCESSED">Processed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        from: e.target.value,
                      }))
                    }
                    className="w-full sm:w-40 border-slate-200"
                  />
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, to: e.target.value }))
                    }
                    className="w-full sm:w-40 border-slate-200"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modern Withdrawal Requests Table */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Withdrawal Requests
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-700"
                >
                  {withdrawalRequests.length} results
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}>
                          <div className="h-12 bg-gray-100 animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : withdrawalRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-500">
                            No withdrawal requests found
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    withdrawalRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {request.user.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.user.phone}
                            </div>
                            {request.user.email && (
                              <div className="text-xs text-gray-400">
                                {request.user.email}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatCurrency(request.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Fee:{" "}
                              {formatCurrency(
                                request.paymentDetails.handlingFee,
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              From: {request.paymentDetails.walletType}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {request.paymentMethod === "JAZZCASH"
                                ? "JazzCash"
                                : "EasyPaisa"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.paymentDetails.accountNumber}
                            </div>
                            <div className="text-xs text-gray-400">
                              {request.paymentDetails.cardHolderName}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>{getStatusBadge(request.status)}</TableCell>

                        <TableCell>
                          <div className="text-sm">
                            {formatDate(request.createdAt)}
                          </div>
                          {request.processedAt && (
                            <div className="text-xs text-gray-500">
                              Processed: {formatDate(request.processedAt)}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              {request.status === "PENDING" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction(request, "APPROVE")
                                    }
                                    className="text-green-600 focus:text-green-600"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction(request, "REJECT")
                                    }
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modern Pagination */}
        {pagination.pages > 1 && (
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} results
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="border-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-slate-700 px-3">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="border-slate-200"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Withdrawal Request Details
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Complete information about the withdrawal request
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6">
                {/* User Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">User Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span>{selectedRequest.user.name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <div className="flex items-center gap-2">
                          <span>{selectedRequest.user.phone}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(selectedRequest.user.phone)
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {selectedRequest.user.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email:</span>
                          <div className="flex items-center gap-2">
                            <span>{selectedRequest.user.email}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (selectedRequest.user.email) {
                                  copyToClipboard(selectedRequest.user.email);
                                }
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Wallet Balances</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Main Wallet:</span>
                        <span>
                          {formatCurrency(selectedRequest.user.walletBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Commission:</span>
                        <span>
                          {formatCurrency(
                            selectedRequest.user.commissionBalance,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request Information */}
                <div>
                  <h4 className="font-medium mb-2">Request Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedRequest.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Handling Fee:</span>
                        <span>
                          {formatCurrency(
                            selectedRequest.paymentDetails.handlingFee,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Deducted:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            selectedRequest.amount +
                              selectedRequest.paymentDetails.handlingFee,
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Wallet Type:</span>
                        <span>{selectedRequest.paymentDetails.walletType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        {getStatusBadge(selectedRequest.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Requested:</span>
                        <span>{formatDate(selectedRequest.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="font-medium mb-2">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method:</span>
                      <span>
                        {selectedRequest.paymentMethod === "JAZZCASH"
                          ? "JazzCash"
                          : "EasyPaisa"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account:</span>
                      <div className="flex items-center gap-2">
                        <span>
                          {selectedRequest.paymentDetails.accountNumber}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              selectedRequest.paymentDetails.accountNumber,
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Holder:</span>
                      <span>
                        {selectedRequest.paymentDetails.cardHolderName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedRequest.adminNotes && (
                  <div>
                    <h4 className="font-medium mb-2">Admin Notes</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      {selectedRequest.adminNotes}
                    </div>
                  </div>
                )}

                {/* Transaction ID */}
                {selectedRequest.transactionId && (
                  <div>
                    <h4 className="font-medium mb-2">Transaction ID</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {selectedRequest.transactionId}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          selectedRequest.transactionId &&
                          copyToClipboard(selectedRequest.transactionId)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Action Modal */}
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent className="max-w-md">
            <DialogHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    actionType === "APPROVE"
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : "bg-gradient-to-br from-red-500 to-red-600"
                  }`}
                >
                  {actionType === "APPROVE" ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {actionType === "APPROVE" && "Approve Withdrawal"}
                    {actionType === "REJECT" && "Reject Withdrawal"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    {actionType === "APPROVE" &&
                      "This will approve the withdrawal request and mark it as ready for processing."}
                    {actionType === "REJECT" &&
                      "This will reject the withdrawal request and refund the amount to user's wallet."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5">
              {actionType === "APPROVE" && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Transaction ID (Optional)
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Enter transaction/reference ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="pl-10 border-slate-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Add transaction ID now or leave empty to add later
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  {actionType === "REJECT" ? "Rejection Reason" : "Admin Notes"}
                  {actionType === "REJECT" && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Textarea
                    placeholder={
                      actionType === "REJECT"
                        ? "Please provide a reason for rejection"
                        : "Optional notes about this approval"
                    }
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className={`pl-10 border-slate-200 resize-none ${
                      actionType === "REJECT"
                        ? "focus:border-red-500 focus:ring-red-500"
                        : "focus:border-green-500 focus:ring-green-500"
                    }`}
                  />
                </div>
                {actionType === "REJECT" && (
                  <p className="text-xs text-red-600 mt-1">
                    Rejection reason is required
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setShowActionModal(false)}
                disabled={isProcessing}
                className="border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={
                  isProcessing ||
                  (actionType === "REJECT" && !adminNotes.trim())
                }
                className={`shadow-md ${
                  actionType === "REJECT"
                    ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  `${actionType === "APPROVE" ? "Approve" : "Reject"} Request`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
