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
  TrendingDown,
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

interface WithdrawalRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDetails: {
    bankName: string;
    accountNumber: string;
    cardHolderName: string;
    walletType: string;
    handlingFee: number;
    isUsdtWithdrawal?: boolean;
    usdtRate?: number;
    usdtAmount?: number;
    usdtNetworkFee?: number;
    usdtAmountAfterFee?: number;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string;
  processedAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  pendingAmount: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const WithdrawalHistory = () => {
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
    totalAmount: 0,
    pendingAmount: 0,
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
  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch withdrawal history
  const fetchWithdrawalHistory = async (showRefreshing = false) => {
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

      const response = await fetch(`/api/user/withdrawal-history?${params}`);
      const data = await response.json();

      if (data.success) {
        setWithdrawalRequests(data.data.withdrawalRequests);
        setStatistics(data.data.statistics);
        setPagination(data.data.pagination);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch withdrawal history",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching withdrawal history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchWithdrawalHistory(true);
  };

  const getBankDisplayName = (bankName: string) => {
    switch (bankName) {
      case "JAZZCASH":
        return "JazzCash";
      case "EASYPAISA":
        return "EasyPaisa";
      case "USDT_TRC20":
        return "USDT (TRC20)";
      default:
        return bankName;
    }
  };

  const getBankIcon = (bankName: string) => {
    switch (bankName) {
      case "JAZZCASH":
        return "📱";
      case "EASYPAISA":
        return "💳";
      case "USDT_TRC20":
        return "₮";
      default:
        return "💳";
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

  // Filter requests based on search term
  const filteredRequests = withdrawalRequests.filter(
    (request) =>
      searchTerm === "" ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.paymentDetails.accountNumber.includes(searchTerm) ||
      request.amount.toString().includes(searchTerm) ||
      (request.transactionId &&
        request.transactionId.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchWithdrawalHistory();
  }, [pagination.page, statusFilter, dateRange]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [statusFilter, dateRange.from, dateRange.to]);

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
                  Processing Time
                </p>
                <p className="text-base sm:text-lg font-bold text-gray-900">
                  0-72h
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
              placeholder="Search by ID, amount, account number, or transaction ID..."
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

      {/* Withdrawal History List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">
              Withdrawal History ({filteredRequests.length} requests)
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
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Withdrawal History
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ||
                statusFilter !== "ALL" ||
                dateRange.from ||
                dateRange.to
                  ? "No requests found matching your filters."
                  : "You haven't made any withdrawal requests yet."}
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
              {filteredRequests.map((request) => {
                const statusIcon = getStatusIcon(request.status);
                const StatusIconComponent = statusIcon.icon;

                return (
                  <div
                    key={request.id}
                    className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailsModal(true);
                    }}
                  >
                    <div className="space-y-3 sm:space-y-4">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              request.status === "PENDING"
                                ? request.paymentDetails.isUsdtWithdrawal
                                  ? "bg-orange-100"
                                  : "bg-yellow-100"
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

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-sm flex-shrink-0">
                            {getBankIcon(request.paymentMethod)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-600">Payment Method</p>
                            <div className="flex items-center gap-1">
                              <p className="font-medium truncate">
                                {getBankDisplayName(request.paymentMethod)}
                              </p>
                              {request.paymentDetails.isUsdtWithdrawal && (
                                <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-1 py-0.5 rounded">
                                  Crypto
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-600">From Wallet</p>
                            <p className="font-medium truncate">
                              {request.paymentDetails.walletType}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-600">
                              {request.paymentDetails.isUsdtWithdrawal
                                ? "Network Fee"
                                : "Handling Fee"}
                            </p>
                            <p className="font-medium text-red-600 truncate">
                              {request.paymentDetails.isUsdtWithdrawal
                                ? `${(request.paymentDetails.usdtNetworkFee || 0).toFixed(4)} USDT`
                                : formatCurrency(
                                    request.paymentDetails.handlingFee,
                                  )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-600">
                              {request.processedAt ? "Processed" : "Requested"}
                            </p>
                            <p className="font-medium truncate">
                              {formatDate(
                                request.processedAt || request.createdAt,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Account Information */}
                      <div
                        className={`rounded-lg p-3 ${
                          request.paymentDetails.isUsdtWithdrawal
                            ? "bg-orange-50"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-base sm:text-lg flex-shrink-0">
                              {getBankIcon(request.paymentMethod)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base break-all">
                                {request.paymentDetails.isUsdtWithdrawal
                                  ? `${request.paymentDetails.accountNumber.slice(0, 8)}...${request.paymentDetails.accountNumber.slice(-8)}`
                                  : request.paymentDetails.accountNumber}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {request.paymentDetails.cardHolderName}
                              </p>
                              {request.paymentDetails.isUsdtWithdrawal && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Rate: 1 USDT = PKR{" "}
                                  {request.paymentDetails.usdtRate || 295}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                request.paymentDetails.accountNumber,
                              );
                            }}
                            className="flex-shrink-0"
                          >
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Admin Notes or Transaction ID */}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(request.transactionId!);
                              }}
                              className="flex-shrink-0"
                            >
                              <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Total Breakdown */}
                      <div className="border-t pt-3">
                        {request.paymentDetails.isUsdtWithdrawal ? (
                          <div className="space-y-1 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                PKR Deducted:
                              </span>
                              <span className="font-semibold truncate ml-2">
                                {formatCurrency(request.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-orange-600">
                                USDT Sent:
                              </span>
                              <span className="font-semibold text-orange-600 truncate ml-2">
                                {(
                                  request.paymentDetails.usdtAmountAfterFee || 0
                                ).toFixed(4)}{" "}
                                USDT
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-600">
                              Total Deducted:
                            </span>
                            <span className="font-semibold truncate ml-2">
                              {formatCurrency(
                                request.amount +
                                  request.paymentDetails.handlingFee,
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* View Details Button */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                          Click to view full details
                        </div>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
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

      {/* Detailed Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Withdrawal Request Details
            </DialogTitle>
            <DialogDescription className="text-sm">
              Complete information about your withdrawal request
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

              {/* Amount Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Amount Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedRequest.paymentDetails.isUsdtWithdrawal ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-600">
                          PKR Amount:
                        </span>
                        <span className="font-medium text-sm sm:text-base truncate ml-2">
                          {formatCurrency(selectedRequest.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-600">
                          USDT Equivalent:
                        </span>
                        <span className="font-medium text-orange-600 text-sm sm:text-base truncate ml-2">
                          {(
                            selectedRequest.paymentDetails.usdtAmount || 0
                          ).toFixed(4)}{" "}
                          USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-600">
                          Conversion Rate:
                        </span>
                        <span className="font-medium text-sm sm:text-base truncate ml-2">
                          1 USDT = PKR{" "}
                          {selectedRequest.paymentDetails.usdtRate || 295}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-600">
                          Network Fee (5%):
                        </span>
                        <span className="font-medium text-red-600 text-sm sm:text-base truncate ml-2">
                          {(
                            selectedRequest.paymentDetails.usdtNetworkFee || 0
                          ).toFixed(4)}{" "}
                          USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t font-bold">
                        <span className="text-sm sm:text-base text-gray-900">
                          USDT Received:
                        </span>
                        <span className="text-base sm:text-lg text-orange-600 truncate ml-2">
                          {(
                            selectedRequest.paymentDetails.usdtAmountAfterFee ||
                            0
                          ).toFixed(4)}{" "}
                          USDT
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-600">
                          Withdrawal Amount:
                        </span>
                        <span className="font-medium text-sm sm:text-base truncate ml-2">
                          {formatCurrency(selectedRequest.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-600">
                          Handling Fee (10%):
                        </span>
                        <span className="font-medium text-red-600 text-sm sm:text-base truncate ml-2">
                          {formatCurrency(
                            selectedRequest.paymentDetails.handlingFee,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t font-bold">
                        <span className="text-sm sm:text-base text-gray-900">
                          Total Deducted:
                        </span>
                        <span className="text-base sm:text-lg truncate ml-2">
                          {formatCurrency(
                            selectedRequest.amount +
                              selectedRequest.paymentDetails.handlingFee,
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-600">
                        Payment Method
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm sm:text-lg font-semibold truncate">
                          {getBankDisplayName(selectedRequest.paymentMethod)}
                        </p>
                        {selectedRequest.paymentDetails.isUsdtWithdrawal && (
                          <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full">
                            Crypto
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-600">
                        From Wallet
                      </label>
                      <p className="text-sm sm:text-lg font-semibold truncate">
                        {selectedRequest.paymentDetails.walletType}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-600">
                      {selectedRequest.paymentDetails.isUsdtWithdrawal
                        ? "Wallet Label"
                        : "Account Holder Name"}
                    </label>
                    <p className="text-sm sm:text-lg font-semibold break-words">
                      {selectedRequest.paymentDetails.cardHolderName}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-600">
                      {selectedRequest.paymentDetails.isUsdtWithdrawal
                        ? "USDT Address"
                        : "Account Number"}
                    </label>
                    <div
                      className={`flex items-center justify-between p-2 sm:p-3 rounded-lg gap-2 ${
                        selectedRequest.paymentDetails.isUsdtWithdrawal
                          ? "bg-orange-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <p className="text-sm sm:text-lg font-mono break-all flex-1">
                        {selectedRequest.paymentDetails.accountNumber}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(
                            selectedRequest.paymentDetails.accountNumber,
                          )
                        }
                        className="flex-shrink-0"
                      >
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                    {selectedRequest.paymentDetails.isUsdtWithdrawal && (
                      <p className="text-xs text-orange-600 mt-1">
                        Rate: 1 USDT = PKR{" "}
                        {selectedRequest.paymentDetails.usdtRate || 295}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

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
    </div>
  );
};
