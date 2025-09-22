"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-picker";
import {
  Filter,
  X,
  Search,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  search: string;
  status: string;
  walletType: string;
  amountRange: {
    min: string;
    max: string;
  };
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

export interface ModernFiltersProps {
  filters: FilterState;
  onFiltersChangeAction: (filters: FilterState) => void;
  onResetAction: () => void;
  onApplyAction: () => void;
  loading?: boolean;
  resultsCount?: number;
}

export function ModernFilters({
  filters,
  onFiltersChangeAction,
  onResetAction,
  onApplyAction,
  loading = false,
  resultsCount = 0,
}: ModernFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = [
    filters.search,
    filters.status !== "ALL" ? filters.status : null,
    filters.walletType !== "ALL" ? filters.walletType : null,
    filters.amountRange.min || filters.amountRange.max,
    filters.dateRange.from || filters.dateRange.to,
  ].filter(Boolean).length;

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChangeAction({ ...filters, ...updates });
  };

  const clearFilter = (filterKey: keyof FilterState) => {
    switch (filterKey) {
      case "search":
        updateFilters({ search: "" });
        break;
      case "status":
        updateFilters({ status: "ALL" });
        break;
      case "walletType":
        updateFilters({ walletType: "ALL" });
        break;
      case "amountRange":
        updateFilters({ amountRange: { min: "", max: "" } });
        break;
      case "dateRange":
        updateFilters({ dateRange: { from: undefined, to: undefined } });
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by ID, phone, email, or amount..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10 pr-10 h-11 bg-white shadow-sm border-gray-200 focus:ring-2 focus:ring-blue-500/20"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearFilter("search")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-11 bg-white shadow-sm border-gray-200 hover:bg-gray-50 relative",
                  activeFiltersCount > 0 && "border-blue-500 bg-blue-50",
                )}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 h-5"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-96 p-0 shadow-xl border-0"
              align="end"
              side="bottom"
            >
              <Card className="border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-blue-600" />
                      Advanced Filters
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Request Status
                    </Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        updateFilters({ status: value })
                      }
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            Pending
                          </div>
                        </SelectItem>
                        <SelectItem value="APPROVED">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            Approved
                          </div>
                        </SelectItem>
                        <SelectItem value="REJECTED">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Rejected
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Wallet Type Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-3 h-3 text-purple-500" />
                      Wallet Type
                    </Label>
                    <Select
                      value={filters.walletType}
                      onValueChange={(value) =>
                        updateFilters({ walletType: value })
                      }
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select wallet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Wallets</SelectItem>
                        <SelectItem value="JAZZCASH">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded text-xs flex items-center justify-center text-white font-bold">
                              JC
                            </div>
                            JazzCash
                          </div>
                        </SelectItem>
                        <SelectItem value="EASYPAISA">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded text-xs flex items-center justify-center text-white font-bold">
                              EP
                            </div>
                            EasyPaisa
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-emerald-500" />
                      Amount Range (PKR)
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Minimum</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={filters.amountRange.min}
                          onChange={(e) =>
                            updateFilters({
                              amountRange: {
                                ...filters.amountRange,
                                min: e.target.value,
                              },
                            })
                          }
                          className="bg-white text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Maximum</Label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={filters.amountRange.max}
                          onChange={(e) =>
                            updateFilters({
                              amountRange: {
                                ...filters.amountRange,
                                max: e.target.value,
                              },
                            })
                          }
                          className="bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      Date Range
                    </Label>
                    <DateRangePicker
                      from={filters.dateRange.from}
                      to={filters.dateRange.to}
                      onDateRangeChange={(from, to) =>
                        updateFilters({ dateRange: { from, to } })
                      }
                      placeholder="Select date range"
                      className="w-full"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      onClick={onResetAction}
                      className="flex-1 h-10"
                      disabled={loading}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={() => {
                        onApplyAction();
                        setIsOpen(false);
                      }}
                      className="flex-1 h-10"
                      disabled={loading}
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Apply Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>

          {/* Quick Apply Button */}
          <Button
            onClick={onApplyAction}
            disabled={loading}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg border">
          <span className="text-sm font-medium text-gray-700">
            Active filters ({resultsCount} results):
          </span>

          {filters.status !== "ALL" && (
            <Badge
              variant="secondary"
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Status: {filters.status}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("status")}
                className="ml-2 h-4 w-4 p-0 hover:bg-gray-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {filters.walletType !== "ALL" && (
            <Badge
              variant="secondary"
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Wallet: {filters.walletType}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("walletType")}
                className="ml-2 h-4 w-4 p-0 hover:bg-gray-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {(filters.amountRange.min || filters.amountRange.max) && (
            <Badge
              variant="secondary"
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Amount: {filters.amountRange.min || "0"} -{" "}
              {filters.amountRange.max || "∞"} PKR
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("amountRange")}
                className="ml-2 h-4 w-4 p-0 hover:bg-gray-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge
              variant="secondary"
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Date Range: {filters.dateRange.from?.toLocaleDateString()} -{" "}
              {filters.dateRange.to?.toLocaleDateString()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("dateRange")}
                className="ml-2 h-4 w-4 p-0 hover:bg-gray-200 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetAction}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
