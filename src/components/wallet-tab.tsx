import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowUpRight, Wallet, Download, Filter, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";

interface Transaction {
    id: string;
    type: "CREDIT" | "DEBIT";
    amount: number;
    description: string;
    createdAt: string;
}

interface User {
    walletBalance: number;
    totalEarnings: number;
}

interface WalletTabProps {
    user: User;
    recentTransactions: Transaction[];
}

export default function WalletTab({ user, recentTransactions }: WalletTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        type: 'all',
        startDate: '',
        endDate: '',
    });

    const {
        data: transactionsData,
        isLoading,
        error,
        refetch
    } = useTransactions({
        page: currentPage,
        limit: 10,
        type: filters.type === 'all' ? undefined : filters.type,
        startDate: filters.startDate,
        endDate: filters.endDate,
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    const exportTransactions = () => {
        if (!transactionsData) return;

        const csvContent = [
            ['Date', 'Type', 'Description', 'Amount'],
            ...transactionsData.transactions.map(t => [
                format(parseISO(t.createdAt), "dd.MM.yyyy"),
                t.type,
                t.description,
                t.amount.toFixed(2),
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const transactions = transactionsData?.transactions || recentTransactions;
    const pagination = transactionsData?.pagination;

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Wallet Overview
                    </CardTitle>
                    <CardDescription>
                        Manage your earnings and view transaction history
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-space-between gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Current Balance
                            </h3>
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                PKR {user.walletBalance.toFixed(2)}
                            </div>
                            <p className="text-gray-600">Available for withdrawal</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Total Earnings
                            </h3>
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                PKR {user.totalEarnings.toFixed(2)}
                            </div>
                            <p className="text-gray-600">Since joining</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filter Transactions
                            </CardTitle>
                            <CardDescription>
                                Filter transactions by type and date range
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportTransactions}
                            disabled={!transactions?.length}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="type-filter">Transaction Type</Label>
                            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All types</SelectItem>
                                    <SelectItem value="CREDIT">Credits</SelectItem>
                                    <SelectItem value="DEBIT">Debits</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !filters.startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.startDate ? format(parseISO(filters.startDate), "dd.MM.yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filters.startDate ? new Date(filters.startDate) : undefined}
                                        onSelect={(date) => handleFilterChange('startDate', date ? format(date, "yyyy-MM-dd") : '')}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !filters.endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.endDate ? format(parseISO(filters.endDate), "dd.MM.yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={filters.endDate ? new Date(filters.endDate) : undefined}
                                        onSelect={(date) => handleFilterChange('endDate', date ? format(date, "yyyy-MM-dd") : '')}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFilters({ type: 'all', startDate: '', endDate: '' });
                                    setCurrentPage(1);
                                }}
                                className="w-full"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                Your earning and withdrawal activities
                            </CardDescription>
                        </div>
                        {pagination && (
                            <div className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading transactions...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-600 mb-4">Failed to load transaction history</p>
                            <Button onClick={() => refetch()} variant="outline">
                                Try Again
                            </Button>
                        </div>
                    ) : transactions?.length > 0 ? (
                        <>
                            <div className="space-y-4">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === "CREDIT"
                                                    ? "bg-green-100"
                                                    : "bg-red-100"
                                                    }`}
                                            >
                                                {transaction.type === "CREDIT" ? (
                                                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <ArrowUpRight className="h-5 w-5 text-red-600 rotate-180" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {transaction.description}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {format(parseISO(transaction.createdAt), "dd.MM.yyyy")}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`text-right ${transaction.type === "CREDIT"
                                                ? "text-green-600"
                                                : "text-red-600"
                                                }`}
                                        >
                                            <p className="font-semibold">
                                                {transaction.type === "CREDIT" ? "+" : "-"}PKR{" "}
                                                {transaction.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-600">
                                        Showing {((pagination.page - 1) * 10) + 1} to{' '}
                                        {Math.min(pagination.page * 10, pagination.totalCount)} of{' '}
                                        {pagination.totalCount} transactions
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                            disabled={!pagination.hasPrev}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            disabled={!pagination.hasNext}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <ArrowUpRight className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                            <p>
                                {filters.type !== 'all' || filters.startDate || filters.endDate
                                    ? 'No transactions match your current filters.'
                                    : 'Your transactions will appear here once you start earning.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}