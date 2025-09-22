"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  FileText,
  Info,
  ArrowRight,
  User,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Alert,
  AlertDescription,
} from "./ui/alert";

interface SecurityRefundRequest {
  id: string;
  fromLevel: number;
  toLevel: number;
  refundAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestNote?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
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

export default function SecurityRefund() {
  const { toast } = useToast();

  // State management
  const [data, setData] = useState<SecurityRefundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SecurityRefundRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch security refund data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/security-refund");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch security refund data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching security refund data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch security refund data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit refund request
  const handleRequestRefund = async () => {
    try {
      setRequesting(true);
      const response = await fetch("/api/user/security-refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        });
        setShowConfirmDialog(false);
        fetchData(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit refund request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting refund request:", error);
      toast({
        title: "Error",
        description: "Failed to submit refund request",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading security refund data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load security refund data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Security Refund
          </h1>
          <p className="text-gray-600 mt-1">
            Refund your previous level security deposit after upgrading
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Current Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Current Level</p>
              <p className="text-lg font-bold text-blue-900">
                {data.currentLevelName}
              </p>
              <p className="text-xs text-blue-700">Level {data.currentLevel}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Security Deposited</p>
              <p className="text-lg font-bold text-green-900">
                {formatCurrency(data.securityDeposited)}
              </p>
              <p className="text-xs text-green-700">Current level deposit</p>
            </div>

            {data.hasUpgraded && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 mb-1">Available Refund</p>
                <p className="text-lg font-bold text-orange-900">
                  {formatCurrency(data.previousLevelDeposit)}
                </p>
                <p className="text-xs text-orange-700">From Level {data.currentLevel - 1}</p>
              </div>
            )}

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">Total Requests</p>
              <p className="text-lg font-bold text-purple-900">
                {data.refundRequests.length}
              </p>
              <p className="text-xs text-purple-700">
                {data.refundRequests.filter(r => r.status === 'APPROVED').length} approved
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refund Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Refund Your Previous Level Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.hasUpgraded ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You are not eligible to refund your security. You must upgrade to a higher level first to be eligible for security deposit refund.
              </AlertDescription>
            </Alert>
          ) : !data.canRequestRefund ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have already requested or received a refund for your previous level security deposit.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Refund Available!
                    </h3>
                    <p className="text-green-800 mb-3">
                      You have upgraded from Level {data.currentLevel - 1} to Level {data.currentLevel}.
                      You can now request a refund of your previous level security deposit.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-green-700">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Refund Amount:</span>
                        <span className="text-lg font-bold text-green-900">
                          {formatCurrency(data.previousLevelDeposit)}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                      <span>Will be added to your wallet</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Request Security Refund
              </Button>

              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  How it works:
                </h4>
                <ol className="list-decimal list-inside space-y-1 ml-6">
                  <li>Submit your refund request</li>
                  <li>Admin will review and approve your request</li>
                  <li>Refund amount will be added to your wallet</li>
                  <li>You can then withdraw or use it for tasks</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund History */}
      {data.refundRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Refund History ({data.refundRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.refundRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold">
                        {formatCurrency(request.refundAmount)}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsModal(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" />
                      <span>
                        Level {request.fromLevel} → Level {request.toLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>Requested: {formatDate(request.createdAt)}</span>
                    </div>
                    {request.processedAt && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        <span>Processed: {formatDate(request.processedAt)}</span>
                      </div>
                    )}
                  </div>

                  {request.adminNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border-l-2 border-l-gray-300">
                      <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</p>
                      <p className="text-sm text-gray-600">{request.adminNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Confirm Security Refund Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to request a refund of your Level {data.currentLevel - 1} security deposit?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-green-700">Refund Amount</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(data.previousLevelDeposit)}
                </p>
                <p className="text-xs text-green-600">
                  From Level {data.currentLevel - 1} security deposit
                </p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your request will be sent to admin for approval. Once approved,
                the refund amount will be added to your wallet balance.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={requesting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestRefund}
                disabled={requesting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {requesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Refund Request Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the refund request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Status and Amount */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-xl font-bold">
                    {formatCurrency(selectedRequest.refundAmount)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Request ID: {selectedRequest.id.slice(-8)}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedRequest.status)}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>
              </div>

              {/* Level Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Level Upgrade Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">From</p>
                      <p className="text-lg font-bold text-blue-900">
                        Level {selectedRequest.fromLevel}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">To</p>
                      <p className="text-lg font-bold text-green-900">
                        Level {selectedRequest.toLevel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Request Submitted</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(selectedRequest.createdAt)}
                        </p>
                      </div>
                    </div>

                    {selectedRequest.processedAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Request Processed</p>
                          <p className="text-sm text-gray-600">
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
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-orange-800">{selectedRequest.adminNotes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Request Notes */}
              {selectedRequest.requestNote && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Request Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{selectedRequest.requestNote}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
