"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Eye,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  status: string;
  metadata: any;
  createdAt: string;
}

interface WalletData {
  balance: number;
  totalEarnings: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  summary: {
    totalCredits: number;
    totalDebits: number;
    creditCount: number;
    debitCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, [filters]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch("/api/wallet/balance");
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value.toString());
      });

      const response = await fetch(`/api/wallet/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const exportTransactions = () => {
    if (!transactions) return;

    const csvContent = [
      ["Date", "Type", "Description", "Amount", "Balance After", "Status"],
      ...transactions.transactions.map((t) => [
        new Date(t.createdAt).toLocaleDateString("en-US"),
        t.type,
        t.description,
        t.amount.toFixed(2),
        t.balanceAfter.toFixed(2),
        t.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                PKR {walletData?.balance.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earnings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                PKR {walletData?.totalEarnings.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Since joining</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  View all your earning and withdrawal activities
                </CardDescription>
              </div>
              <Button variant="outline" onClick={exportTransactions}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="type-filter">Type</Label>
                <select
                  id="type-filter"
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All types</option>
                  <option value="CREDIT">Credits</option>
                  <option value="DEBIT">Debits</option>
                </select>
              </div>
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="limit">Per Page</Label>
                <select
                  id="limit"
                  value={filters.limit.toString()}
                  onChange={(e) => handleFilterChange("limit", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            {transactions && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    PKR {transactions.summary.totalCredits.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Credits</div>
                  <div className="text-xs text-gray-500">
                    {transactions.summary.creditCount} transactions
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    PKR {transactions.summary.totalDebits.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Debits</div>
                  <div className="text-xs text-gray-500">
                    {transactions.summary.debitCount} transactions
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    PKR{" "}
                    {(
                      transactions.summary.totalCredits -
                      transactions.summary.totalDebits
                    ).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Net Flow</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {transactions.pagination.totalCount}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Transactions
                  </div>
                </div>
              </div>
            )}

            {/* Transactions List */}
            <div className="space-y-4">
              {transactions?.transactions.length ? (
                transactions.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "CREDIT"
                            ? "bg-green-100"
                            : "bg-red-100"
                        }`}
                      >
                        {transaction.type === "CREDIT" ? (
                          <ArrowUpRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.createdAt).toLocaleDateString(
                              "en-US"
                            )}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === "CREDIT"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "CREDIT" ? "+" : "-"}PKR{" "}
                        {transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Balance: PKR {transaction.balanceAfter.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No transactions found
                </div>
              )}
            </div>

            {/* Pagination */}
            {transactions && transactions.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {(transactions.pagination.page - 1) *
                    transactions.pagination.limit +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    transactions.pagination.page *
                      transactions.pagination.limit,
                    transactions.pagination.totalCount
                  )}{" "}
                  of {transactions.pagination.totalCount} transactions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(transactions.pagination.page - 1)
                    }
                    disabled={!transactions.pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(transactions.pagination.page + 1)
                    }
                    disabled={!transactions.pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
