"use client"

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Search, Filter, MoreHorizontal, Shield, ShieldOff, Eye, Download } from 'lucide-react'
import { UserStatus } from '@/types/admin-enums'

interface User {
  id: string
  name: string
  email: string
  status: UserStatus
  registrationDate: string
  lastLogin: string
  totalEarnings: number
  videosWatched: number
  referrals: number
}

interface UserManagementProps {
  users: User[]
  totalUsers: number
  activeUsers: number
  blockedUsers: number
  onUserBlock: (userId: string, reason?: string) => Promise<void>
  onUserUnblock: (userId: string) => Promise<void>
  onUserEdit: (userId: string, data: Partial<User>) => Promise<void>
  onExportUsers?: () => void
}

export default function UserManagement({
  users,
  totalUsers,
  activeUsers,
  blockedUsers,
  onUserBlock,
  onUserUnblock,
  onUserEdit,
  onExportUsers
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalPages = Math.ceil(filteredUsers.length / pageSize)

  const handleBlockUser = async (user: User) => {
    setSelectedUser(user)
    setIsBlockDialogOpen(true)
  }

  const confirmBlockUser = async () => {
    if (selectedUser) {
      await onUserBlock(selectedUser.id, blockReason)
      setIsBlockDialogOpen(false)
      setBlockReason('')
      setSelectedUser(null)
    }
  }

  const handleUnblockUser = async (userId: string) => {
    await onUserUnblock(userId)
  }

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setIsDetailsDialogOpen(true)
  }

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return <Badge variant="default">Active</Badge>
      case UserStatus.BLOCKED:
        return <Badge variant="destructive">Blocked</Badge>
      case UserStatus.SUSPENDED:
        return <Badge variant="secondary">Suspended</Badge>
      case UserStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and monitor activity</p>
        </div>
        {onExportUsers && (
          <Button variant="outline" onClick={onExportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{activeUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{blockedUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Blocked Users</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Search and filter users by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as UserStatus | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={UserStatus.BLOCKED}>Blocked</SelectItem>
                <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                <SelectItem value={UserStatus.PENDING}>Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Videos</TableHead>
                <TableHead>Referrals</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{formatDate(user.registrationDate)}</TableCell>
                  <TableCell>{formatDate(user.lastLogin)}</TableCell>
                  <TableCell>{formatCurrency(user.totalEarnings)}</TableCell>
                  <TableCell>{user.videosWatched}</TableCell>
                  <TableCell>{user.referrals}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {user.status === UserStatus.ACTIVE ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBlockUser(user)}
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblockUser(user.id)}
                        >
                          <ShieldOff className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block User Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Are you sure you want to block {selectedUser?.name}? This action will prevent them from accessing the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for blocking (optional)</label>
              <Textarea
                placeholder="Enter reason for blocking this user..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBlockUser}>
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-sm font-mono">{selectedUser.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                  <p className="text-sm">{formatDate(selectedUser.registrationDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                  <p className="text-sm">{formatDate(selectedUser.lastLogin)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Earnings</label>
                  <p className="text-sm font-medium">{formatCurrency(selectedUser.totalEarnings)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Videos Watched</label>
                  <p className="text-sm">{selectedUser.videosWatched}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Referrals</label>
                  <p className="text-sm">{selectedUser.referrals}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}