import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CreditCard, Smartphone, Plus, Wallet } from "lucide-react";

const BankCard = () => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Jazzcash Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                Jazzcash
              </CardTitle>
              <div className="w-12 h-8 bg-white/20 rounded backdrop-blur-sm"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm opacity-80">Phone Number</p>
                <p className="text-lg font-mono font-semibold">0345-4001749</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Cardholder</p>
                <p className="text-lg font-semibold">S**r</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="text-sm">E-Wallet</span>
              </div>
              <div className="text-xs opacity-70">Active</div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          <span>Add Wallet Number</span>
        </Button>

        <Button
          variant="outline"
          className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
          size="lg"
        >
          <CreditCard className="h-5 w-5" />
          <span>Add Bank Card</span>
        </Button>
      </div>

      {/* Additional Info Card */}
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Secure payment methods powered by Jazzcash</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankCard;
