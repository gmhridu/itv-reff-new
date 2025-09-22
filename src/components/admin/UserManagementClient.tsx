"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  UserMinus,
  GraduationCap,
  Briefcase,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { UserStatus } from "@/types/admin";
import { useUserManagement } from "@/hooks/use-user-management";
import { toast } from "sonner";

const statusColors = {
  [UserStatus.ACTIVE]: "secondary",
  [UserStatus.SUSPENDED]: "destructive",
  [UserStatus.BANNED]: "destructive",
} as const;

const statusIcons = {
  [UserStatus.ACTIVE]: UserCheck,
  [UserStatus.SUSPENDED]: UserMinus,
  [UserStatus.BANNED]: UserX,
};

export function UserManagementClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<
    "all" | "intern" | "paid"
  >("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewDetailsUserId, setViewDetailsUserId] = useState<string | null>(
    null,
  );
  const [viewAnalyticsUserId, setViewAnalyticsUserId] = useState<string | null>(
    null,
  );
  const [manageBalanceUserId, setManageBalanceUserId] = useState<string | null>(
    null,
  );
  const [newBalance, setNewBalance] = useState<string>("");
  const [balanceReason, setBalanceReason] = useState<string>("");

  // Build filters object
  const filters = useMemo(() => {
    const filterObj: any = {};

    if (searchTerm) {
      filterObj.searchTerm = searchTerm;
    }

    if (statusFilter !== "all") {
      filterObj.status = statusFilter;
    }

    if (positionFilter !== "all") {
      filterObj.positionLevel = positionFilter;
    }

    if (userTypeFilter === "intern") {
      filterObj.isIntern = true;
    } else if (userTypeFilter === "paid") {
      filterObj.isIntern = false;
    }

    return filterObj;
  }, [searchTerm, statusFilter, positionFilter, userTypeFilter]);

  const {
    data,
    statistics,
    loading,
    error,
    refetch,
    updateUserStatus,
    deleteUser,
    goToPage,
    setPageSize,
    setFilters,
  } = useUserManagement({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    filters,
  });

  // Update filters when they change
  useMemo(() => {
    setFilters(filters);
  }, [filters, setFilters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLastLogin = (date: Date | null) => {
    if (!date) return "Never";

    const now = new Date();
    const loginDate = new Date(date);
    const diffInHours = Math.floor(
      (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 24) {
      return diffInHours < 1 ? "Just now" : `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
    }
  };

  const handleStatusToggle = async (
    userId: string,
    currentStatus: UserStatus,
  ) => {
    const newStatus =
      currentStatus === UserStatus.ACTIVE
        ? UserStatus.SUSPENDED
        : UserStatus.ACTIVE;

    setActionLoading(userId);
    try {
      const success = await updateUserStatus(userId, newStatus);
      if (success) {
        toast.success(`User ${newStatus.toLowerCase()} successfully`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const success = await deleteUser(userId);
      if (success) {
        toast.success("User account has been banned");
        setSelectedUserId(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Data refreshed successfully");
  };

  const handleViewDetails = (userId: string) => {
    setViewDetailsUserId(userId);
  };

  const handleViewAnalytics = (userId: string) => {
    setViewAnalyticsUserId(userId);
  };

  const handleManageBalance = (userId: string) => {
    const user = data?.users.find((u) => u.id === userId);
    if (user) {
      setNewBalance(user.walletBalance.toString());
      setManageBalanceUserId(userId);
    }
  };

  const handleUpdateBalance = async () => {
    if (!manageBalanceUserId || !newBalance || !balanceReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    const balance = parseFloat(newBalance);
    if (isNaN(balance) || balance < 0) {
      toast.error("Please enter a valid balance amount");
      return;
    }

    setActionLoading(manageBalanceUserId);
    try {
      const response = await fetch(
        `/api/admin/users/${manageBalanceUserId}/balance`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newBalance: balance,
            reason: balanceReason,
          }),
        },
      );

      if (response.ok) {
        toast.success("Balance updated successfully");
        setManageBalanceUserId(null);
        setNewBalance("");
        setBalanceReason("");
        await refetch();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update balance");
      }
    } catch (error) {
      toast.error("Failed to update balance");
    } finally {
      setActionLoading(null);
    }
  };

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="text-lg font-semibold">Error loading user data</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !statistics ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {statistics?.totalUsers || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {statistics?.activeUsers || 0} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !statistics ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {statistics?.activeUsers || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {statistics?.suspendedUsers || 0} suspended,{" "}
              {statistics?.bannedUsers || 0} banned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Types</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !statistics ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {statistics?.internsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Interns • {statistics?.paidPositionsCount || 0} paid positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading && !statistics ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(statistics?.totalEarnings || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(statistics?.averageBalance || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, email, phone, or referral code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value: any) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
            <SelectItem value={UserStatus.BANNED}>Banned</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={userTypeFilter}
          onValueChange={(value: any) => setUserTypeFilter(value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="User Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="intern">Interns</SelectItem>
            <SelectItem value="paid">Paid Positions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="text-sm text-muted-foreground">
              {data && `${data.totalCount} total users`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !data ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-10" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data && data.users.length > 0 ? (
                  data.users.map((user) => {
                    const StatusIcon = statusIcons[user.status];
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                              {user.name
                                ? user.name.charAt(0).toUpperCase()
                                : "U"}
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.name || "Unnamed User"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              {user.phone && (
                                <p className="text-xs text-muted-foreground">
                                  {user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.registrationDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatLastLogin(user.lastLogin)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusColors[user.status]}
                            className="gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {user.isIntern ? (
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">
                              {user.positionLevel || "Intern"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatCurrency(user.walletBalance)}</div>
                            <div className="text-xs text-muted-foreground">
                              Total: {formatCurrency(user.totalEarnings)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">
                              {user.engagement}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.totalVideosTasks} tasks
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={user.status === UserStatus.ACTIVE}
                              onCheckedChange={() =>
                                handleStatusToggle(user.id, user.status)
                              }
                              disabled={actionLoading === user.id}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  disabled={actionLoading === user.id}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => handleViewDetails(user.id)}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => handleViewAnalytics(user.id)}
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  View Analytics
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => handleManageBalance(user.id)}
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Manage Balance
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={() => setSelectedUserId(user.id)}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No users found</p>
                        <p className="text-sm">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          userTypeFilter !== "all"
                            ? "Try adjusting your filters"
                            : "No users have been registered yet"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {(data.currentPage - 1) * 10 + 1} to{" "}
                {Math.min(data.currentPage * 10, data.totalCount)} of{" "}
                {data.totalCount} users
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(data.currentPage - 1)}
                  disabled={!data.hasPreviousPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, data.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === data.currentPage ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          disabled={loading}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    },
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(data.currentPage + 1)}
                  disabled={!data.hasNextPage || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!selectedUserId}
        onOpenChange={() => setSelectedUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action will ban the user account and prevent them from
              accessing the platform. This action can be reversed by changing
              the user status back to active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUserId && handleDeleteUser(selectedUserId)}
              disabled={!!actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Banning..." : "Ban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Dialog */}
      <AlertDialog
        open={!!viewDetailsUserId}
        onOpenChange={() => setViewDetailsUserId(null)}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>User Details</AlertDialogTitle>
          </AlertDialogHeader>
          {viewDetailsUserId && (
            <div className="grid gap-4">
              {(() => {
                const user = data?.users.find(
                  (u) => u.id === viewDetailsUserId,
                );
                if (!user) return <p>User not found</p>;

                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name:</label>
                      <p className="text-sm text-muted-foreground">
                        {user.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email:</label>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone:</label>
                      <p className="text-sm text-muted-foreground">
                        {user.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status:</label>
                      <p className="text-sm text-muted-foreground">
                        {user.status}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Registration Date:
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(user.registrationDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Login:</label>
                      <p className="text-sm text-muted-foreground">
                        {formatLastLogin(user.lastLogin)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Wallet Balance:
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(user.walletBalance)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Total Earnings:
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(user.totalEarnings)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Position:</label>
                      <p className="text-sm text-muted-foreground">
                        {user.positionLevel || "Intern"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Referral Code:
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {user.referralCode}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Total Tasks:
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {user.totalVideosTasks}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Referrals:</label>
                      <p className="text-sm text-muted-foreground">
                        {user.totalReferrals}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Balance Dialog */}
      <AlertDialog
        open={!!manageBalanceUserId}
        onOpenChange={() => setManageBalanceUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manage User Balance</AlertDialogTitle>
            <AlertDialogDescription>
              Update the wallet balance for this user. This action will be
              logged for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium">New Balance Amount</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter new balance"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason for Change</label>
              <Input
                placeholder="Enter reason for balance adjustment"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setManageBalanceUserId(null);
                setNewBalance("");
                setBalanceReason("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateBalance}
              disabled={!!actionLoading}
            >
              {actionLoading ? "Updating..." : "Update Balance"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Analytics Dialog (placeholder) */}
      <AlertDialog
        open={!!viewAnalyticsUserId}
        onOpenChange={() => setViewAnalyticsUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User Analytics</AlertDialogTitle>
            <AlertDialogDescription>
              Detailed analytics and insights for this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 text-center">
            <p className="text-muted-foreground">
              User analytics dashboard coming soon...
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
