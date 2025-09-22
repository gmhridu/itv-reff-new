"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  FileText,
  Calendar,
  User,
  CreditCard,
  Info,
  Star,
  Award,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface SecurityRefundRequest {
  id: string;
  userId: string;
  fromLevel: number;
  toLevel: number;
  refundAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestNote?: string | null;
  adminNotes?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SecurityRefundData {
  hasUpgraded: boolean;
  canRequestRefund: boolean;
  currentLevel: number;
  currentLevelName: string;
  previousLevelDeposit: number;
  securityDeposited: number;
  refundRequests: SecurityRefundRequest[];
}

export default function SecurityRefundEnhanced() {
  const [data, setData] = useState<SecurityRefundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  // Fetch security refund data
  const fetchData = async (showLoadingToast = false) => {
    try {
      if (showLoadingToast) {
        setRefreshing(true);
      }

      const response = await fetch("/api/user/security-refund");
      const result = await response.json();

      if (response.ok && result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to load security refund data");
      }
    } catch (err) {
      console.error("Error fetching security refund data:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Submit refund request
  const handleSubmitRequest = async () => {
    try {
      setSubmitting(true);

      const response = await fetch("/api/user/security-refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestNote: requestNote.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Success! 🎉",
          description: "Your security refund request has been submitted successfully.",
          duration: 5000,
        });

        setShowRequestDialog(false);
        setRequestNote("");
        await fetchData();
      } else {
        toast({
          title: "Request Failed",
          description: result.error || "Failed to submit refund request",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error submitting refund request:", err);
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate refund eligibility info
  const getRefundInfo = () => {
    if (!data) return null;

    const totalRefunded = data.refundRequests
      .filter((req) => req.status === "APPROVED")
      .reduce((sum, req) => sum + req.refundAmount, 0);

    const pendingRefunds = data.refundRequests.filter(
      (req) => req.status === "PENDING"
    ).length;

    return {
      totalRefunded,
      pendingRefunds,
      canRequest: data.canRequestRefund && pendingRefunds === 0,
    };
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending Review" },
      APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Approved" },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Rejected" },
    };

    const { color, icon: Icon, label } = config[status as keyof typeof config] || config.PENDING;

    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <CardTitle>Security Refund System</CardTitle>
                  <CardDescription>Loading your refund information...</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Unable to Load Data
                </h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    fetchData();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const refundInfo = getRefundInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Security Refund System</h1>
              <p className="text-emerald-100">
                Manage your level upgrade security deposits
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Status Overview */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Your Security Status</CardTitle>
                  <CardDescription>Current level and deposit information</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Current Level */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Current Level</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{data?.currentLevelName}</p>
                <p className="text-sm text-blue-600">Level {data?.currentLevel}</p>
              </div>

              {/* Security Deposited */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">Security Deposit</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  PKR {data?.securityDeposited?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-emerald-600">Current level</p>
              </div>

              {/* Total Refunded */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">Total Refunded</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  PKR {refundInfo?.totalRefunded?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-purple-600">All time</p>
              </div>

              {/* Pending Requests */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">Pending Requests</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {refundInfo?.pendingRefunds || 0}
                </p>
                <p className="text-sm text-orange-600">In review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Refund Eligibility Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.hasUpgraded ? (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Not Eligible:</strong> You need to upgrade from the Intern level to be eligible for security refunds.
                </AlertDescription>
              </Alert>
            ) : data?.canRequestRefund ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Eligible!</strong> You can request a refund of PKR {data?.previousLevelDeposit?.toLocaleString()} from your previous level deposit.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="w-4 h-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Not Available:</strong> You either have a pending request or have already received a refund for your previous level.
                </AlertDescription>
              </Alert>
            )}

            {/* Request Refund Button */}
            {data?.canRequestRefund && refundInfo?.canRequest && (
              <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                      Request Security Refund
                    </h3>
                    <p className="text-emerald-700 mb-4">
                      You can request a refund of PKR {data?.previousLevelDeposit?.toLocaleString()} from your previous level security deposit.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-emerald-600">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span>Instant processing</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>No fees</span>
                      </div>
                    </div>
                  </div>
                  <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-base">
                        <Shield className="w-5 h-5 mr-2" />
                        Request Refund
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-emerald-600" />
                          Request Security Refund
                        </DialogTitle>
                        <DialogDescription>
                          Submit your request for a security deposit refund.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-700">Refund Amount:</span>
                            <span className="font-bold text-emerald-900">
                              PKR {data?.previousLevelDeposit?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-emerald-700">From Level:</span>
                            <span className="text-emerald-900">Level {(data?.currentLevel || 1) - 1}</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="request-note">Optional Note</Label>
                          <Textarea
                            id="request-note"
                            placeholder="Add a note to your refund request (optional)..."
                            value={requestNote}
                            onChange={(e) => setRequestNote(e.target.value)}
                            rows={3}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleSubmitRequest}
                            disabled={submitting}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            {submitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Submit Request
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowRequestDialog(false);
                              setRequestNote("");
                            }}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Refund Request History
              </CardTitle>
              <Badge variant="secondary">
                {data?.refundRequests?.length || 0} Total Requests
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!data?.refundRequests?.length ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Refund Requests Yet
                </h3>
                <p className="text-gray-600">
                  Your refund request history will appear here once you submit your first request.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data?.refundRequests
                  ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Level {request.fromLevel} → Level {request.toLevel}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(request.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900 mb-1">
                            PKR {request.refundAmount.toLocaleString()}
                          </p>
                          <StatusBadge status={request.status} />
                        </div>
                      </div>

                      {request.requestNote && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-700">
                            <strong>Your Note:</strong> {request.requestNote}
                          </p>
                        </div>
                      )}

                      {request.adminNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">
                            <strong>Admin Note:</strong> {request.adminNotes}
                          </p>
                        </div>
                      )}

                      {request.processedAt && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Processed on {new Date(request.processedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Info className="w-5 h-5" />
              How Security Refunds Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Level Up</h3>
                <p className="text-sm text-blue-700">
                  When you upgrade to a higher level, your previous level's security deposit becomes eligible for refund.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Request</h3>
                <p className="text-sm text-blue-700">
                  Submit a refund request through this system. Add optional notes for clarity.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Receive</h3>
                <p className="text-sm text-blue-700">
                  Once approved, the refund is automatically added to your wallet balance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
