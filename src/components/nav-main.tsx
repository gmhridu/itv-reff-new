"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  // isActive is now computed dynamically, so it's optional and mainly for override purposes
  isActive?: boolean;
}

export interface NavMainProps {
  items: NavMainItem[];
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarMenu className="p-2">
      {items.map((item) => {
        // Dynamic active state calculation
        const isActive = item.isActive ?? pathname === item.url;

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className={cn(
                "w-full justify-start gap-2",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <Link href={item.url}>
                {item.icon && (
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
