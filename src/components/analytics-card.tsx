"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function AnalyticsCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-emerald-600",
  badge,
  children,
  className = "",
  headerAction,
}: AnalyticsCardProps) {
  return (
    <Card className={`border border-gray-200 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2 bg-gray-50 rounded-lg`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {title}
                {badge && (
                  <Badge variant={badge.variant || "secondary"} className="text-xs">
                    {badge.text}
                  </Badge>
                )}
              </CardTitle>
              {description && (
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

export default AnalyticsCard;
