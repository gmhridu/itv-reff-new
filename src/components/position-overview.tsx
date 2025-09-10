"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Star,
  Zap,
  Check,
  Clock,
  Gift,
  ArrowRight,
  Shield,
  Target,
} from "lucide-react";

interface Position {
  id: string;
  name: string;
  level: number;
  deposit: number;
  tasksPerDay: number;
  unitPrice: number;
  dailyIncome: number;
  monthlyIncome: number;
  annualIncome: number;
  isActive: boolean;
}

interface CurrentPosition {
  currentPosition: Position | null;
  positionStartDate: string | null;
  positionEndDate: string | null;
  depositPaid: number;
  isIntern: boolean;
  isExpired: boolean;
  daysRemaining: number;
  tasksCompletedToday: number;
  canCompleteTask: boolean;
  tasksRemaining: number;
}

export default function PostionOverview() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [currentPosition, setCurrentPosition] =
    useState<CurrentPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchPositions();
    fetchCurrentPosition();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch("/api/positions");
      if (response.ok) {
        const data = await response.json();
        setPositions(data.positions);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const fetchCurrentPosition = async () => {
    try {
      const response = await fetch("/api/positions/current");
      if (response.ok) {
        const data = await response.json();
        setCurrentPosition(data);
      }
    } catch (error) {
      console.error("Error fetching current position:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (positionId: string, deposit: number) => {
    try {
      setUpgrading(positionId);

      const response = await fetch("/api/positions/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetPositionId: positionId,
          depositAmount: deposit,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Position upgrade successful! ${data.message}`);
        fetchCurrentPosition(); // Refresh current position
      } else {
        alert(data.error || "Position upgrade failed");
      }
    } catch (error) {
      console.error("Position upgrade error:", error);
      alert("Position upgrade failed");
    } finally {
      setUpgrading(null);
    }
  };

  const getPositionIcon = (level: number) => {
    if (level === 0) return <Star className="h-6 w-6" />;
    if (level <= 3) return <Target className="h-6 w-6" />;
    if (level <= 6) return <Shield className="h-6 w-6" />;
    if (level <= 8) return <Crown className="h-6 w-6" />;
    return <Zap className="h-6 w-6" />;
  };

  const getPositionColor = (level: number) => {
    if (level === 0) return "bg-gray-100 text-gray-800 border-gray-300";
    if (level <= 3) return "bg-blue-100 text-blue-800 border-blue-300";
    if (level <= 6) return "bg-green-100 text-green-800 border-green-300";
    if (level <= 8) return "bg-purple-100 text-purple-800 border-purple-300";
    return "bg-orange-100 text-orange-800 border-orange-300";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Positions Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Position Level System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your position level to start earning. Higher levels require
            deposits but offer better rewards and income potential.
          </p>
        </div>
        {/* Current Position Section */}
        {currentPosition?.currentPosition && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Check className="h-5 w-5" />
                Current Position: {currentPosition.currentPosition.name}
              </CardTitle>
              <CardDescription className="text-green-700">
                {currentPosition.isExpired
                  ? "Position active"
                  : "Position active"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-green-600 mb-1">Daily Tasks</p>
                  <p className="font-semibold text-green-800">
                    {currentPosition.tasksCompletedToday}/
                    {currentPosition.currentPosition.tasksPerDay}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600 mb-1">Unit Price</p>
                  <p className="font-semibold text-green-800">
                    {formatCurrency(currentPosition.currentPosition.unitPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600 mb-1">Daily Income</p>
                  <p className="font-semibold text-green-800">
                    {formatCurrency(
                      currentPosition.currentPosition.dailyIncome
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600 mb-1">Deposit Paid</p>
                  <p className="font-semibold text-green-800">
                    {formatCurrency(currentPosition.depositPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Positions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {positions.map((position) => {
            const isCurrentPosition =
              currentPosition?.currentPosition?.id === position.id;
            const canUpgrade = !isCurrentPosition && position.level > 0;
            const isIntern = position.level === 0;

            return (
              <Card
                key={position.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  isCurrentPosition ? "ring-2 ring-green-500" : ""
                } ${isIntern ? "border-gray-300" : "border-blue-300"}`}
              >
                {isCurrentPosition && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-semibold">
                    Current
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getPositionColor(
                      position.level
                    )}`}
                  >
                    {getPositionIcon(position.level)}
                  </div>
                  <CardTitle className="text-2xl">{position.name}</CardTitle>
                  <CardDescription>
                    {isIntern
                      ? "Entry Level - No Deposit Required"
                      : `Level ${position.level} Position`}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      {formatCurrency(position.deposit)}
                    </span>
                    <span className="text-gray-500 block text-sm">
                      {isIntern ? "Free Entry" : "Security Deposit"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        {position.tasksPerDay} tasks daily
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Gift className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {formatCurrency(position.unitPrice)} per task
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Daily Income:
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(position.dailyIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Monthly Income:
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(position.monthlyIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Annual Income:
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(position.annualIncome)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={
                      !canUpgrade ||
                      upgrading === position.id ||
                      isCurrentPosition
                    }
                    onClick={() => handleUpgrade(position.id, position.deposit)}
                    variant={isCurrentPosition ? "secondary" : "default"}
                  >
                    {upgrading === position.id ? (
                      "Processing..."
                    ) : isCurrentPosition ? (
                      "Current Position"
                    ) : isIntern ? (
                      "Start as Intern"
                    ) : (
                      <>
                        Upgrade to {position.name}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
