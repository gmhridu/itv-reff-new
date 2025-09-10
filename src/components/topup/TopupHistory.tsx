"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  Eye,
  Copy,
  TrendingUp,
  DollarSign,
  FileText,
  Search,
  ChevronRight,
  Info,
  CreditCard,
  Wallet,
  Timer,
  AlertTriangle,
  Banknote,
  User,
  Image as ImageIcon,
  ExternalLink,
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
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "@/hooks/use-toast";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface TopupRequest {
  id: string;
  amount: number;
  paymentProof?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string;
  processedAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  selectedWallet: {
    id: string;
    walletType: "JAZZCASH" | "EASYPAISA";
    walletNumber: string;
    walletHolderName: string;
  };
}

interface Statistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const TopupHistory = () => {
  const { toast } = useToast();

  // State management
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
  });
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Processing form data
  const [processData, setProcessData] = useState({
    status: "APPROVED" as "APPROVED" | "REJECTED",
    adminNotes: "",
    transactionId: "",
  });

  // Fetch topup history
  const fetchTopupHistory = async (showRefreshing = false) => {
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

      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (dateRange.from) params.append("dateFrom", dateRange.from);
      if (dateRange.to) params.append("dateTo", dateRange.to);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/topup-history?${params}`);
      const data = await response.json();

      if (data.success) {
        setTopupRequests(data.data.topupRequests);
        setStatistics(data.data.statistics);
        setPagination(data.data.pagination);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch topup history",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching topup history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch topup history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTopupHistory(true);
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    setProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/topup-history/${selectedRequest.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(processData),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setShowProcessModal(false);
        setSelectedRequest(null);
        setProcessData({
          status: "APPROVED",
          adminNotes: "",
          transactionId: "",
        });
        fetchTopupHistory();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing request:", error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        text: "Pending",
      },
      APPROVED: {
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        text: "Approved",
      },
      REJECTED: {
        className: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        text: "Rejected",
      },
    };

    const variant =
      variants[status as keyof typeof variants] || variants.PENDING;
    const IconComponent = variant.icon;

    return (
      <Badge
        className={`${variant.className} flex items-center gap-1 px-3 py-1`}
      >
        <IconComponent className="w-3 h-3" />
        {variant.text}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: { icon: Timer, color: "text-yellow-600" },
      APPROVED: { icon: CheckCircle, color: "text-green-600" },
      REJECTED: { icon: XCircle, color: "text-red-600" },
    };
    return icons[status as keyof typeof icons] || icons.PENDING;
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
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

  const handleLoadMore = () => {
    setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  const getSuccessRate = () => {
    if (statistics.total === 0) return 0;
    return Math.round((statistics.approved / statistics.total) * 100);
  };

  const getAverageAmount = () => {
    if (statistics.total === 0) return 0;
    return statistics.totalAmount / statistics.total;
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchTopupHistory();
  }, [pagination.page, statusFilter, dateRange]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [statusFilter, dateRange.from, dateRange.to, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Comprehensive Statistics Section */}
      <div className="space-y-4">
        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Total Requests
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {statistics.total}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Total Amount
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {formatCurrency(statistics.totalAmount)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Pending Amount
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-amber-600 truncate">
                    {formatCurrency(statistics.pendingAmount)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Success Rate
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">
                    {getSuccessRate()}%
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Status Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Request Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Timer className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">
                      Pending
                    </p>
                    <p className="text-lg font-bold text-yellow-600 truncate">
                      {statistics.pending}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">
                      Approved
                    </p>
                    <p className="text-lg font-bold text-green-600 truncate">
                      {statistics.approved}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">
                      Rejected
                    </p>
                    <p className="text-lg font-bold text-red-600 truncate">
                      {statistics.rejected}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Statistics */}
            <div className="mt-6 pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">
                  Average Amount
                </p>
                <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {formatCurrency(getAverageAmount())}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">This Month</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">
                  {statistics.total}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">
                  Approved Amount
                </p>
                <p className="text-base sm:text-lg font-bold text-green-600 truncate">
                  {formatCurrency(statistics.approvedAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              Filter & Search
            </CardTitle>
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              disabled={refreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by user name, phone, request ID, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <div>
              <Input
                type="date"
                placeholder="From Date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
            </div>

            <div>
              <Input
                type="date"
                placeholder="To Date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topup History List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">
              Topup History ({topupRequests.length} requests)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 sm:p-4 border rounded-lg">
                  <div className="space-y-3 animate-pulse">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : topupRequests.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Topup History
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ||
                statusFilter !== "ALL" ||
                dateRange.from ||
                dateRange.to
                  ? "No requests found matching your filters."
                  : "No topup requests have been made yet."}
              </p>
              {(searchTerm ||
                statusFilter !== "ALL" ||
                dateRange.from ||
                dateRange.to) && (
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                    setDateRange({ from: "", to: "" });
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {topupRequests.map((request) => {
                const statusIcon = getStatusIcon(request.status);
                const StatusIconComponent = statusIcon.icon;

                return (
                  <div
                    key={request.id}
                    className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3 sm:space-y-4">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              request.status === "PENDING"
                                ? "bg-yellow-100"
                                : request.status === "APPROVED"
                                  ? "bg-green-100"
                                  : "bg-red-100"
                            }`}
                          >
                            <StatusIconComponent
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${statusIcon.color}`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                              {formatCurrency(request.amount)}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              Request ID: {request.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col sm:items-end items-center justify-between sm:justify-start gap-2 sm:gap-1">
                          {getStatusBadge(request.status)}
                          <p className="text-xs text-gray-500">
                            {formatDateShort(request.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* User Information */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            User Details
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Name: </span>
                            <span className="font-medium">
                              {request.user.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Phone: </span>
                            <span className="font-medium">
                              {request.user.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wallet Information */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-base sm:text-lg flex-shrink-0">
                              {request.selectedWallet.walletType === "JAZZCASH"
                                ? "📱"
                                : "💳"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {request.selectedWallet.walletNumber}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {request.selectedWallet.walletHolderName} •{" "}
                                {request.selectedWallet.walletType ===
                                "JAZZCASH"
                                  ? "JazzCash"
                                  : "EasyPaisa"}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                request.selectedWallet.walletNumber,
                              )
                            }
                            className="flex-shrink-0"
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Payment Proof */}
                      {request.paymentProof && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-800">
                                Payment Proof
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(request.paymentProof, "_blank")
                              }
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {request.adminNotes && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Info className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-medium text-red-800">
                                Admin Notes:
                              </p>
                              <p className="text-xs sm:text-sm text-red-700 break-words">
                                {request.adminNotes}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transaction ID */}
                      {request.transactionId && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-green-800">
                                  Transaction ID:
                                </p>
                                <p className="text-xs sm:text-sm font-mono text-green-700 truncate">
                                  {request.transactionId}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(request.transactionId!)
                              }
                              className="flex-shrink-0"
                            >
                              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                          {formatDate(request.createdAt)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          {request.status === "PENDING" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setProcessData({
                                  status: "APPROVED",
                                  adminNotes: "",
                                  transactionId: "",
                                });
                                setShowProcessModal(true);
                              }}
                            >
                              Process
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {pagination.page < pagination.pages && !loading && (
            <div className="text-center pt-6">
              <Button
                onClick={handleLoadMore}
                variant="outline"
                disabled={loading}
                className="w-full lg:w-auto"
              >
                Load More (
                {pagination.total - pagination.page * pagination.limit}{" "}
                remaining)
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          {pagination.total > 0 && (
            <div className="text-center pt-4 text-sm text-gray-500">
              Showing{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} requests
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Topup Request Details
            </DialogTitle>
            <DialogDescription className="text-sm">
              Complete information about the topup request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 sm:space-y-6">
              {/* Status and Amount */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold truncate">
                    {formatCurrency(selectedRequest.amount)}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 truncate">
                    Request ID: {selectedRequest.id}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
                  {getStatusBadge(selectedRequest.status)}
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>
              </div>

              {/* User Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-600">
                        Name
                      </label>
                      <p className="text-sm sm:text-lg font-semibold truncate">
                        {selectedRequest.user.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-600">
                        Phone
                      </label>
                      <p className="text-sm sm:text-lg font-semibold truncate">
                        {selectedRequest.user.phone}
                      </p>
                    </div>
                  </div>
                  {selectedRequest.user.email && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-600">
                        Email
                      </label>
                      <p className="text-sm sm:text-lg font-semibold break-words">
                        {selectedRequest.user.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wallet Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Selected Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-600">
                        Wallet Type
                      </label>
                      <p className="text-sm sm:text-lg font-semibold truncate">
                        {selectedRequest.selectedWallet.walletType ===
                        "JAZZCASH"
                          ? "JazzCash"
                          : "EasyPaisa"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-600">
                        Holder Name
                      </label>
                      <p className="text-sm sm:text-lg font-semibold truncate">
                        {selectedRequest.selectedWallet.walletHolderName}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-600">
                      Wallet Number
                    </label>
                    <div className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-lg gap-2">
                      <p className="text-sm sm:text-lg font-mono truncate flex-1">
                        {selectedRequest.selectedWallet.walletNumber}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(
                            selectedRequest.selectedWallet.walletNumber,
                          )
                        }
                        className="flex-shrink-0"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Proof */}
              {selectedRequest.paymentProof && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      Payment Proof
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(selectedRequest.paymentProof, "_blank")
                        }
                        className="w-full"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Payment Proof
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Request Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base">
                          Request Created
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatDate(selectedRequest.createdAt)}
                        </p>
                      </div>
                    </div>

                    {selectedRequest.updatedAt !==
                      selectedRequest.createdAt && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base">
                            Last Updated
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatDate(selectedRequest.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRequest.processedAt && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base">
                            Processed
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatDate(selectedRequest.processedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              {selectedRequest.adminNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                      <p className="text-red-800 text-sm sm:text-base break-words">
                        {selectedRequest.adminNotes}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Details */}
              {selectedRequest.transactionId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      Transaction Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <label className="text-xs sm:text-sm font-medium text-green-800">
                            Transaction ID
                          </label>
                          <p className="text-sm sm:text-lg font-mono text-green-900 break-all">
                            {selectedRequest.transactionId}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(selectedRequest.transactionId!)
                          }
                          className="flex-shrink-0"
                        >
                          <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Request Modal */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Topup Request</DialogTitle>
            <DialogDescription>
              {selectedRequest &&
                `Process ${selectedRequest.user.name}'s topup request for ${formatCurrency(selectedRequest.amount)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Decision</Label>
              <Select
                value={processData.status}
                onValueChange={(value: "APPROVED" | "REJECTED") =>
                  setProcessData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Approve Request</SelectItem>
                  <SelectItem value="REJECTED">Reject Request</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {processData.status === "APPROVED" && (
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  value={processData.transactionId}
                  onChange={(e) =>
                    setProcessData((prev) => ({
                      ...prev,
                      transactionId: e.target.value,
                    }))
                  }
                  placeholder="Enter transaction ID if available"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="adminNotes">
                Admin Notes{" "}
                {processData.status === "REJECTED"
                  ? "(Required)"
                  : "(Optional)"}
              </Label>
              <Textarea
                id="adminNotes"
                value={processData.adminNotes}
                onChange={(e) =>
                  setProcessData((prev) => ({
                    ...prev,
                    adminNotes: e.target.value,
                  }))
                }
                placeholder={
                  processData.status === "APPROVED"
                    ? "Add any notes about the approval..."
                    : "Provide reason for rejection..."
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProcessModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessRequest}
                disabled={
                  processing ||
                  (processData.status === "REJECTED" &&
                    !processData.adminNotes.trim())
                }
              >
                {processing
                  ? "Processing..."
                  : `${processData.status === "APPROVED" ? "Approve" : "Reject"} Request`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
