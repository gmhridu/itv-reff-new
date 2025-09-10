"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  CreditCard,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Eye,
  DollarSign,
  Info,
  Camera,
  FileImage,
  History,
  Plus,
  ArrowLeft,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface AdminWallet {
  id: string;
  walletType: "JAZZCASH" | "EASYPAISA";
  walletNumber: string;
  walletHolderName: string;
}

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
  selectedWallet: {
    walletType: "JAZZCASH" | "EASYPAISA";
    walletNumber: string;
    walletHolderName: string;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function TopupClient() {
  const { toast } = useToast();

  // State management
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("new-request");

  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(
    null,
  );

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/user/topup?page=${pagination.page}&limit=${pagination.limit}`,
      );
      const data = await response.json();

      if (data.success) {
        setWallets(data.data.wallets);
        setRequests(data.data.requests);
        setPagination(data.data.pagination);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWallet || !amount) {
      toast({
        title: "Error",
        description: "Please select a wallet and enter amount",
        variant: "destructive",
      });
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber < 100) {
      toast({
        title: "Error",
        description: "Amount must be at least 100 PKR",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/user/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNumber,
          selectedWalletId: selectedWallet,
          paymentProof: paymentProof || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });

        // Reset form
        setSelectedWallet("");
        setAmount("");
        setPaymentProof("");
        setShowRequestModal(false);
        setActiveTab("history");

        // Refresh data
        fetchData();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create topup request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating topup request:", error);
      toast({
        title: "Error",
        description: "Failed to create topup request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected wallet details
  const getSelectedWalletDetails = () => {
    return wallets.find((wallet) => wallet.id === selectedWallet);
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if user has pending request
  const hasPendingRequest = requests.some(
    (request) => request.status === "PENDING",
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Account Top-up
          </h1>
          <p className="text-gray-600 mt-1">
            Add funds to your wallet using JazzCash or EasyPaisa
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Wallet className="w-4 h-4" />
          <span>Secure Payment</span>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top-up Your Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="new-request"
                className="flex items-center gap-2"
                disabled={hasPendingRequest}
              >
                <Plus className="w-4 h-4" />
                New Request
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-request" className="mt-0">
              {hasPendingRequest ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Pending Request
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You already have a pending top-up request. Please wait for
                    it to be processed before creating a new one.
                  </p>
                  <Button
                    onClick={() => setActiveTab("history")}
                    variant="outline"
                  >
                    View Request Status
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Wallet Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="wallet">Select Payment Method</Label>
                    <Select
                      value={selectedWallet}
                      onValueChange={(value) => {
                        setSelectedWallet(value);
                        setShowWalletDetails(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose JazzCash or EasyPaisa wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              <span className="font-medium">
                                {wallet.walletType}
                              </span>
                              <span className="text-gray-500">
                                - {wallet.walletNumber}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Wallet Details */}
                  {showWalletDetails && selectedWallet && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-blue-900">
                              Send Money To:
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Type:</span>
                                <span>
                                  {getSelectedWalletDetails()?.walletType}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Number:</span>
                                <span className="font-mono">
                                  {getSelectedWalletDetails()?.walletNumber}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    handleCopy(
                                      getSelectedWalletDetails()
                                        ?.walletNumber || "",
                                    )
                                  }
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Name:</span>
                                <span>
                                  {getSelectedWalletDetails()?.walletHolderName}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PKR)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount (minimum 100 PKR)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10"
                        min="100"
                        step="1"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum top-up amount is 100 PKR
                    </p>
                  </div>

                  {/* Payment Proof */}
                  <div className="space-y-2">
                    <Label htmlFor="proof">Payment Screenshot (Optional)</Label>
                    <Textarea
                      id="proof"
                      placeholder="Paste image URL or description of payment proof..."
                      value={paymentProof}
                      onChange={(e) => setPaymentProof(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">
                          Payment Instructions:
                        </p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Send the exact amount to the selected wallet</li>
                          <li>Take a screenshot of the transaction</li>
                          <li>Upload or describe the payment proof above</li>
                          <li>Submit your request for admin approval</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting || !selectedWallet || !amount}
                  >
                    {submitting && (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Submit Top-up Request
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Your Top-up Requests
                  </h3>
                  <Button
                    onClick={fetchData}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>

                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Requests Yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You haven't made any top-up requests yet.
                    </p>
                    <Button
                      onClick={() => setActiveTab("new-request")}
                      disabled={hasPendingRequest}
                    >
                      Create Your First Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((request) => (
                      <Card
                        key={request.id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">
                                  {request.amount} PKR
                                </span>
                                {getStatusBadge(request.status)}
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-3 h-3" />
                                  <span>
                                    {request.selectedWallet.walletType} -{" "}
                                    {request.selectedWallet.walletNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Created: {formatDate(request.createdAt)}
                                  </span>
                                </div>
                                {request.processedAt && (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>
                                      Processed:{" "}
                                      {formatDate(request.processedAt)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {request.adminNotes && (
                                <div className="mt-2 p-2 bg-gray-50 rounded border-l-2 border-l-gray-300">
                                  <p className="text-sm font-medium text-gray-700">
                                    Admin Notes:
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {request.adminNotes}
                                  </p>
                                </div>
                              )}

                              {request.transactionId && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="font-medium">
                                    Transaction ID:
                                  </span>
                                  <span className="font-mono">
                                    {request.transactionId}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() =>
                                      handleCopy(request.transactionId || "")
                                    }
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1">
                              {request.paymentProof && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowProofModal(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPagination((prev) => ({
                              ...prev,
                              page: prev.page - 1,
                            }))
                          }
                          disabled={pagination.page <= 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
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
                          disabled={pagination.page >= pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Proof Modal */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              Payment proof for request #{selectedRequest?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest?.paymentProof && (
              <div className="space-y-2">
                <Label>Payment Proof:</Label>
                <div className="p-3 bg-gray-50 border rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedRequest.paymentProof}
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowProofModal(false)}
                variant="outline"
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
