"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Shield,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Calendar,
  User,
  CreditCard,
  Ban,
  Undo2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SecurityRefund {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  reason: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";
  securityType:
    | "ACCOUNT_COMPROMISE"
    | "FRAUD_PROTECTION"
    | "DATA_BREACH"
    | "UNAUTHORIZED_ACCESS"
    | "TECHNICAL_ERROR";
  evidence?: string[];
  createdAt: string;
  updatedAt: string;
  processedBy?: string;
  processedAt?: string;
  refundMethod: "WALLET" | "BANK" | "ORIGINAL_METHOD";
  originalTransactionId?: string;
  adminNotes?: string;
  fromLevel: number;
  toLevel: number;
}

interface RefundStats {
  totalRefunds: number;
  pendingRefunds: number;
  approvedRefunds: number;
  rejectedRefunds: number;
  totalAmount: number;
  thisMonthAmount: number;
  averageProcessingTime: string;
}

export function SecurityRefundsClient() {
  const [refunds, setRefunds] = useState<SecurityRefund[]>([]);
  const [stats, setStats] = useState<RefundStats>({
    totalRefunds: 0,
    pendingRefunds: 0,
    approvedRefunds: 0,
    rejectedRefunds: 0,
    totalAmount: 0,
    thisMonthAmount: 0,
    averageProcessingTime: "0h",
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRefund, setSelectedRefund] = useState<SecurityRefund | null>(
    null,
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState<string>("WALLET");
  const { toast } = useToast();

  // Fetch security refunds
  const fetchRefunds = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/security-refunds?${params}`);
      const data = await response.json();

      if (data.success) {
        setRefunds(data.data.securityRefunds || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setStats({
          totalRefunds: data.data.stats?.total || 0,
          pendingRefunds: data.data.stats?.pending || 0,
          approvedRefunds: data.data.stats?.approved || 0,
          rejectedRefunds: data.data.stats?.rejected || 0,
          totalAmount: data.data.stats?.totalAmount || 0,
          thisMonthAmount: data.data.stats?.thisMonthAmount || 0,
          averageProcessingTime: data.data.stats?.averageProcessingTime || "0h",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch security refunds",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch security refunds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle refund processing
  const handleProcessRefund = async (
    refundId: string,
    action: "approve" | "reject",
  ) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/security-refunds/${refundId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          adminNotes,
          refundMethod: action === "approve" ? refundMethod : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Refund ${action === "approve" ? "approved" : "rejected"} successfully`,
        });
        setIsProcessDialogOpen(false);
        setSelectedRefund(null);
        setAdminNotes("");
        fetchRefunds(currentPage);
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} refund`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} refund`,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchRefunds(currentPage);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchRefunds(1);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "PROCESSING":
        return "secondary";
      case "PENDING":
      default:
        return "outline";
    }
  };

  // Get security type label
  const getSecurityTypeLabel = (type: string) => {
    switch (type) {
      case "ACCOUNT_COMPROMISE":
        return "Account Compromise";
      case "FRAUD_PROTECTION":
        return "Fraud Protection";
      case "DATA_BREACH":
        return "Data Breach";
      case "UNAUTHORIZED_ACCESS":
        return "Unauthorized Access";
      case "TECHNICAL_ERROR":
        return "Technical Error";
      default:
        return type;
    }
  };

  // View refund details
  const viewRefundDetails = (refund: SecurityRefund) => {
    setSelectedRefund(refund);
    setIsViewDialogOpen(true);
  };

  // Open process dialog
  const openProcessDialog = (refund: SecurityRefund) => {
    setSelectedRefund(refund);
    setAdminNotes("");
    setRefundMethod("WALLET");
    setIsProcessDialogOpen(true);
  };

  useEffect(() => {
    fetchRefunds(currentPage);
  }, [currentPage]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    colorClass = "text-blue-600",
    bgClass = "bg-blue-50",
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    colorClass?: string;
    bgClass?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {typeof value === "number" &&
              title.toLowerCase().includes("amount")
                ? `${value.toLocaleString()} PKR`
                : value.toLocaleString()}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${bgClass}`}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Refunds</h1>
          <p className="text-muted-foreground">
            Manage security-related refund requests and protect users
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Refunds"
          value={stats.totalRefunds}
          icon={FileText}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          title="Pending Refunds"
          value={stats.pendingRefunds}
          icon={Clock}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
        <StatCard
          title="Total Amount"
          value={stats.totalAmount}
          icon={DollarSign}
          colorClass="text-green-600"
          bgClass="bg-green-50"
        />
        <StatCard
          title="This Month"
          value={stats.thisMonthAmount}
          icon={Calendar}
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Refund Requests
          </CardTitle>
          <CardDescription>
            Review and process security-related refund requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user name, email, or transaction ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Security Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ACCOUNT_COMPROMISE">
                  Account Compromise
                </SelectItem>
                <SelectItem value="FRAUD_PROTECTION">
                  Fraud Protection
                </SelectItem>
                <SelectItem value="DATA_BREACH">Data Breach</SelectItem>
                <SelectItem value="UNAUTHORIZED_ACCESS">
                  Unauthorized Access
                </SelectItem>
                <SelectItem value="TECHNICAL_ERROR">Technical Error</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>

          {/* Refunds Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No refunds found</h3>
              <p className="text-muted-foreground">
                No security refund requests match your current filters.
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Security Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{refund.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {refund.userEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {refund.amount.toLocaleString()} PKR
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getSecurityTypeLabel(refund.securityType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(refund.status)}>
                            {refund.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(refund.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewRefundDetails(refund)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {refund.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openProcessDialog(refund)}
                              >
                                Process
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Refund Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Refund Details</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    User Information
                  </Label>
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">{selectedRefund.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRefund.userEmail}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRefund.userPhone}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Refund Details
                  </Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-2xl font-bold">
                      {selectedRefund.amount.toLocaleString()} PKR
                    </p>
                    <Badge
                      variant={getStatusBadgeVariant(selectedRefund.status)}
                    >
                      {selectedRefund.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Security Type
                </Label>
                <p className="mt-1">
                  {getSecurityTypeLabel(selectedRefund.securityType)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Reason
                </Label>
                <p className="mt-1">{selectedRefund.reason}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <p className="mt-1">{selectedRefund.description}</p>
              </div>

              {selectedRefund.adminNotes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Admin Notes
                  </Label>
                  <p className="mt-1">{selectedRefund.adminNotes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Created:</Label>
                  <p>{format(new Date(selectedRefund.createdAt), "PPp")}</p>
                </div>
                <div>
                  <Label>Updated:</Label>
                  <p>{format(new Date(selectedRefund.updatedAt), "PPp")}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Refund Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Process Security Refund</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">User:</span>
                    <span>{selectedRefund.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount:</span>
                    <span className="font-mono">
                      {selectedRefund.amount.toLocaleString()} PKR
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>
                      {getSecurityTypeLabel(selectedRefund.securityType)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundMethod">Refund Method</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WALLET">User Wallet</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="ORIGINAL_METHOD">
                      Original Method
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    handleProcessRefund(selectedRefund.id, "approve")
                  }
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Refund
                </Button>
                <Button
                  onClick={() =>
                    handleProcessRefund(selectedRefund.id, "reject")
                  }
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
