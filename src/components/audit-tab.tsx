'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/use-transactions';
import { TransactionItem } from './transaction-item';
import { EmptyAuditState, TransactionItemSkeleton } from './empty-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from 'lucide-react';

export function AuditTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
  });
  const pageSize = 10;

  const {
    data: transactionsData,
    isLoading,
    error,
    refetch
  } = useTransactions({
    page: currentPage,
    limit: pageSize,
    ...filters,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const exportTransactions = () => {
    if (!transactionsData) return;

    const csvContent = [
      ['Date', 'Type', 'Description', 'Amount', 'Balance After', 'Status'],
      ...transactionsData.transactions.map(t => [
        new Date(t.createdAt).toLocaleDateString('en-US'),
        t.type,
        t.description,
        t.amount.toFixed(2),
        t.balanceAfter.toFixed(2),
        t.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load transaction history</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Summary skeleton */}
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transactions skeleton */}
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <TransactionItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const { transactions, summary, pagination } = transactionsData || {
    transactions: [],
    summary: { totalCredits: 0, totalDebits: 0, creditCount: 0, debitCount: 0 },
    pagination: { page: 1, totalPages: 1, hasNext: false, hasPrev: false }
  };

  if (transactions.length === 0 && currentPage === 1 && !filters.type && !filters.startDate && !filters.endDate) {
    return <EmptyAuditState onRefresh={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Transaction Summary
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={exportTransactions}
            disabled={transactions.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-2xl font-bold">PKR{summary.totalCredits.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <ArrowDownLeft className="h-4 w-4" />
                <span className="text-2xl font-bold">PKR{summary.totalDebits.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">Total Debits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.creditCount}
              </div>
              <div className="text-sm text-gray-600">Credit Count</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {summary.debitCount}
              </div>
              <div className="text-sm text-gray-600">Debit Count</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="type-filter">Transaction Type</Label>
              <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="TASK_INCOME">Task Rewards</SelectItem>
                  <SelectItem value="REFERRAL_REWARD_A">Level A Referrals</SelectItem>
                  <SelectItem value="REFERRAL_REWARD_B">Level B Referrals</SelectItem>
                  <SelectItem value="REFERRAL_REWARD_C">Level C Referrals</SelectItem>
                  <SelectItem value="MANAGEMENT_BONUS_DIRECT">Direct Management</SelectItem>
                  <SelectItem value="MANAGEMENT_BONUS_INDIRECT">Indirect Management</SelectItem>
                  <SelectItem value="DEBIT">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ type: '', startDate: '', endDate: '' });
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

      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No transactions found with current filters</p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
