"use client";

import { useState, useEffect, useRef } from "react";
import {
  formatPKR,
  sanitizeAmountInput,
  isValidCurrencyAmount,
  formatAmountForInput,
} from "@/lib/currency";
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
  Loader2,
  X,
  ImageIcon,
  Zap,
  Gift,
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
  walletType: "JAZZCASH" | "EASYPAISA" | "USDT_TRC20";
  walletNumber?: string;
  walletHolderName: string;
  usdtWalletAddress?: string;
  qrCodeUrl?: string;
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
    walletType: "JAZZCASH" | "EASYPAISA" | "USDT_TRC20";
    walletNumber?: string;
    walletHolderName: string;
    usdtWalletAddress?: string;
    qrCodeUrl?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [usdtToPkrRate, setUsdtToPkrRate] = useState<number>(295);
  const [bonusPercentage] = useState<number>(3);

  // Form states
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("new-request");

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

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
        console.log("TopupClient: Received wallet data:", {
          totalWallets: data.data.wallets.length,
          walletTypes: data.data.wallets.map((w) => w.walletType),
          usdtWallets: data.data.wallets.filter(
            (w) => w.walletType === "USDT_TRC20",
          ),
          walletsWithUsdtAddress: data.data.wallets.filter(
            (w) => w.usdtWalletAddress,
          ),
          rawWallets: data.data.wallets,
        });
        setWallets(data.data.wallets);
        setRequests(data.data.requests);
        setPagination(data.data.pagination);
        setUsdtToPkrRate(data.data.usdtToPkrRate || 295);
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

  // Validate file
  const validateFile = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Handle file processing
  const processFile = (file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  // Upload image to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Upload failed");
    }

    return data.data.url;
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(selectedFile);
      setPaymentProof(imageUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setSelectedFile(null);
    setUploadPreview("");
    setPaymentProof("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

    // Validate amount using utility function
    const validation = isValidCurrencyAmount(amount, {
      minAmount: 100,
      maxAmount: 1000000,
      allowZero: false,
    });

    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.error || "Invalid amount",
        variant: "destructive",
      });
      return;
    }

    const amountNumber = parseInt(amount, 10);

    setSubmitting(true);

    let finalPaymentProof = paymentProof;

    // Upload image if selected but not uploaded yet
    if (selectedFile && !paymentProof) {
      setUploading(true);
      try {
        const imageUrl = await uploadToCloudinary(selectedFile);
        finalPaymentProof = imageUrl;
        setPaymentProof(imageUrl);
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        setSubmitting(false);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    try {
      const response = await fetch("/api/user/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountNumber,
          selectedWalletId: selectedWallet,
          transactionId: transactionId.trim() || null,
          paymentProof: finalPaymentProof || null,
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
        setTransactionId("");
        setPaymentProof("");
        removeImage();
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

  // Check if selected wallet is USDT
  const isUsdtWallet = () => {
    const wallet = getSelectedWalletDetails();
    return wallet?.walletType === "USDT_TRC20";
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
            Add funds to your wallet using JazzCash, EasyPaisa, or USDT (TRC20)
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
                className="flex items-center gap-2 cursor-pointer"
                disabled={hasPendingRequest}
              >
                <Plus className="w-4 h-4" />
                New Request
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 cursor-pointer"
              >
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
                    className="cursor-pointer"
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
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Choose your payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.map((wallet) => (
                          <SelectItem
                            key={wallet.id}
                            value={wallet.id}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              {wallet.walletType === "USDT_TRC20" ? (
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium">
                                    USDT (TRC20)
                                  </span>
                                  <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full">
                                    +3% Bonus
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  <span className="font-medium">
                                    {wallet.walletType === "JAZZCASH"
                                      ? "JazzCash"
                                      : "EasyPaisa"}
                                  </span>
                                  <span className="text-gray-500">
                                    - {wallet.walletNumber}
                                  </span>
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Wallet Details */}
                  {showWalletDetails && selectedWallet && (
                    <div className="space-y-4">
                      {isUsdtWallet() ? (
                        <div className="space-y-4">
                          {/* USDT Wallet Card */}
                          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-5 h-5 text-orange-500" />
                                  <h4 className="font-semibold text-orange-900">
                                    USDT (TRC20) - Fast & Secure Recharge
                                  </h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="space-y-2">
                                    <span className="font-medium text-sm">
                                      Wallet Address:
                                    </span>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-mono text-xs bg-white p-2 rounded border break-all sm:break-normal sm:text-sm">
                                          {getSelectedWalletDetails()?.usdtWalletAddress}
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 cursor-pointer flex-shrink-0 sm:w-auto w-full"
                                        onClick={() =>
                                          handleCopy(
                                            getSelectedWalletDetails()
                                              ?.usdtWalletAddress || "",
                                          )
                                        }
                                      >
                                        <Copy className="w-3 h-3 sm:mr-1" />
                                        <span className="sm:inline hidden">Copy</span>
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Name:</span>
                                    <span>
                                      {
                                        getSelectedWalletDetails()
                                          ?.walletHolderName
                                      }
                                    </span>
                                  </div>
                                  {getSelectedWalletDetails()?.qrCodeUrl && (
                                    <div className="mt-3">
                                      <span className="font-medium text-sm">
                                        QR Code:
                                      </span>
                                      <div className="mt-2 flex justify-center sm:justify-start">
                                        <img
                                          src={
                                            getSelectedWalletDetails()
                                              ?.qrCodeUrl
                                          }
                                          alt="USDT Wallet QR Code"
                                          className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-orange-300 rounded-lg"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* USDT Rate Info */}
                          <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Info className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="font-semibold text-blue-900">
                                    Today's USDT to PKR Rate: {usdtToPkrRate}{" "}
                                    PKR per 1 USDT
                                  </p>
                                  <p className="text-sm text-blue-700">
                                    Your USDT will be converted to PKR using
                                    this rate
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Bonus Info */}
                          <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Gift className="w-5 h-5 text-green-600" />
                                <div>
                                  <p className="font-semibold text-green-900">
                                    Recharge via USDT & Get +{bonusPercentage}%
                                    Extra Commission Bonus
                                  </p>
                                  <p className="text-sm text-green-700">
                                    Bonus will be added to your Commission
                                    Wallet
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        // Traditional Wallet Card (JazzCash/EasyPaisa)
                        <Card className="border-blue-200 bg-blue-50">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-blue-900">
                                Send Money To:
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Type:</span>
                                  <span>
                                    {getSelectedWalletDetails()?.walletType ===
                                    "JAZZCASH"
                                      ? "JazzCash"
                                      : "EasyPaisa"}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <span className="font-medium text-sm">
                                    Number:
                                  </span>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-mono text-sm bg-white p-2 rounded border break-all sm:break-normal">
                                        {getSelectedWalletDetails()?.walletNumber}
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-3 cursor-pointer flex-shrink-0 sm:w-auto w-full"
                                      onClick={() =>
                                        handleCopy(
                                          getSelectedWalletDetails()
                                            ?.walletNumber || "",
                                        )
                                      }
                                    >
                                      <Copy className="w-3 h-3 sm:mr-1" />
                                      <span className="sm:inline hidden">Copy</span>
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Name:</span>
                                  <span>
                                    {
                                      getSelectedWalletDetails()
                                        ?.walletHolderName
                                    }
                                  </span>
                                </div>
                                {getSelectedWalletDetails()?.qrCodeUrl && (
                                  <div className="mt-3">
                                    <span className="font-medium text-sm">
                                      QR Code:
                                    </span>
                                    <div className="mt-2 flex justify-center sm:justify-start">
                                      <img
                                        src={
                                          getSelectedWalletDetails()?.qrCodeUrl
                                        }
                                        alt="Payment QR Code"
                                        className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-blue-300 rounded-lg"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PKR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                        Rs
                      </span>
                      <Input
                        id="amount"
                        type="text"
                        placeholder="Enter amount (minimum 100 PKR)"
                        value={amount}
                        onChange={(e) => {
                          // Sanitize input to only allow numbers
                          const value = sanitizeAmountInput(e.target.value);
                          setAmount(value);
                        }}
                        className="pl-10 cursor-pointer"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum top-up amount is 100 PKR
                    </p>
                  </div>

                  {/* Transaction ID Input */}
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">
                      {isUsdtWallet() ? "Transaction Hash" : "Transaction ID"}{" "}
                      (Optional)
                    </Label>
                    <Input
                      id="transactionId"
                      type="text"
                      placeholder={
                        isUsdtWallet()
                          ? "Enter USDT transaction hash from blockchain"
                          : "Enter your transaction ID from the payment app"
                      }
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">
                      {isUsdtWallet()
                        ? "Enter the blockchain transaction hash for your USDT transfer"
                        : "Enter the transaction reference number from your JazzCash/EasyPaisa app"}
                    </p>
                  </div>

                  {/* Payment Proof Upload */}
                  <div className="space-y-2">
                    <Label>
                      {isUsdtWallet()
                        ? "Transaction Proof"
                        : "Payment Screenshot"}
                    </Label>

                    {!uploadPreview ? (
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                          dragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="text-center space-y-4">
                          <div className="flex justify-center">
                            <Camera
                              className={`w-12 h-12 ${
                                dragActive ? "text-blue-500" : "text-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {dragActive
                                ? "Drop image here"
                                : isUsdtWallet()
                                  ? "Upload Transaction Proof"
                                  : "Upload Payment Screenshot"}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {dragActive
                                ? `Release to upload your ${isUsdtWallet() ? "transaction proof" : "payment screenshot"}`
                                : `Drag and drop or click to select your ${isUsdtWallet() ? "transaction proof" : "payment screenshot"}`}
                            </p>
                          </div>
                          {!dragActive && (
                            <div className="flex justify-center">
                              <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                disabled={uploading}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Select Image
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-gray-500">
                            PNG, JPG, JPEG up to 5MB
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative border rounded-lg overflow-hidden">
                          <img
                            src={uploadPreview}
                            alt="Payment proof preview"
                            className="w-full h-48 object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={removeImage}
                            className="absolute top-2 right-2 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {paymentProof ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Image ready for submission</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Info className="w-4 h-4" />
                            <span>
                              Image will be uploaded when you submit the form
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">
                          {isUsdtWallet()
                            ? "USDT Payment Instructions:"
                            : "Payment Instructions:"}
                        </p>
                        {isUsdtWallet() ? (
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Copy the USDT wallet address above</li>
                            <li>Send USDT (TRC20) to the wallet address</li>
                            <li>
                              Take a screenshot of the transaction confirmation
                            </li>
                            <li>Upload the transaction proof above</li>
                            <li>Submit your request for admin approval</li>
                            <li>
                              Get +3% bonus added to your Commission Wallet!
                            </li>
                          </ol>
                        ) : (
                          <ol className="list-decimal list-inside space-y-1">
                            <li>
                              Send the exact amount to the selected wallet
                            </li>
                            <li>
                              Take a screenshot of the payment confirmation
                            </li>
                            <li>Upload the screenshot above</li>
                            <li>Submit your request for admin approval</li>
                          </ol>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full cursor-pointer mb-12"
                    disabled={submitting || !selectedWallet || !amount}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploading
                          ? "Uploading Image..."
                          : "Submitting Request..."}
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Submit Top-up Request
                      </>
                    )}
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
                    className="cursor-pointer"
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
                      className="cursor-pointer"
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
                                  {formatPKR(request.amount)}
                                </span>
                                {getStatusBadge(request.status)}
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  {request.selectedWallet.walletType ===
                                  "USDT_TRC20" ? (
                                    <Zap className="w-3 h-3 text-orange-500" />
                                  ) : (
                                    <CreditCard className="w-3 h-3" />
                                  )}
                                  <span>
                                    {request.selectedWallet.walletType ===
                                    "USDT_TRC20" ? (
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                        <span>USDT (TRC20)</span>
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all sm:break-normal">
                                          {request.selectedWallet.usdtWalletAddress?.substring(
                                            0,
                                            20,
                                          )}
                                          ...
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                        <span>
                                          {request.selectedWallet.walletType ===
                                          "JAZZCASH"
                                            ? "JazzCash"
                                            : "EasyPaisa"}
                                        </span>
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all sm:break-normal">
                                          {request.selectedWallet.walletNumber}
                                        </span>
                                      </div>
                                    )}
                                  </span>
                                  {request.selectedWallet.walletType ===
                                    "USDT_TRC20" && (
                                    <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full">
                                      +3% Bonus
                                    </span>
                                  )}
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
                                <div className="space-y-2">
                                  <span className="font-medium text-sm text-gray-600">
                                    Transaction ID:
                                  </span>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-mono text-xs bg-gray-100 p-2 rounded border break-all sm:break-normal sm:text-sm">
                                        {request.transactionId}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-3 cursor-pointer flex-shrink-0 sm:w-auto w-full"
                                      onClick={() =>
                                        handleCopy(request.transactionId || "")
                                      }
                                    >
                                      <Copy className="w-3 h-3 sm:mr-1" />
                                      <span className="sm:inline hidden">Copy</span>
                                    </Button>
                                  </div>
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
                                  className="cursor-pointer"
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
                          className="cursor-pointer"
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
                          className="cursor-pointer"
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
                {selectedRequest.paymentProof.startsWith("http") ? (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedRequest.paymentProof}
                      alt="Payment proof"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRequest.paymentProof}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowProofModal(false)}
                variant="outline"
                className="cursor-pointer"
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
