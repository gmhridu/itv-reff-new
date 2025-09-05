
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

export function AdminHeader() {
  return (
    <header className="flex items-center justify-between h-16 px-4 bg-white border-b dark:bg-gray-800">
      <div className="flex items-center">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <AdminSidebar />
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
