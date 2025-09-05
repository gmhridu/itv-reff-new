"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  registrationDate: string;
  lastLogin: string;
  status: "active" | "blocked" | "pending";
  engagement: number;
}

interface UserTableProps {
  users: User[];
  onStatusToggle: (userId: string, newStatus: "active" | "blocked") => void;
  onUserAction: (userId: string, action: "view" | "edit" | "delete") => void;
}

export default function UserTable({ users, onStatusToggle, onUserAction }: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const handleStatusToggle = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    onStatusToggle(userId, newStatus);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Registration Date</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Engagement</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center space-x-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>{new Date(user.registrationDate).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge
                variant={
                  user.status === "active" ? "secondary" : "destructive"
                }
              >
                {user.status}
              </Badge>
            </TableCell>
            <TableCell>{user.engagement}%</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={user.status === "active"}
                  onCheckedChange={() => handleStatusToggle(user.id, user.status)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-8 h-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onUserAction(user.id, "view")}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUserAction(user.id, "edit")}>
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onUserAction(user.id, "delete")}
                    >
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}