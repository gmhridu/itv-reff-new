"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export interface SidebarBrandProps {
  name: string;
  logo: LucideIcon;
  plan?: string;
}

export function SidebarBrand({ name, logo: Logo, plan }: SidebarBrandProps) {
  const { state } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Logo className="size-4" />
          </div>
          {state === "expanded" && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              {plan && (
                <span className="truncate text-xs text-sidebar-muted-foreground">
                  {plan}
                </span>
              )}
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
