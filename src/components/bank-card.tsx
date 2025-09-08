"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  CreditCard,
  Smartphone,
  Plus,
  Wallet,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "./ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { useBankCards } from "@/hooks/useBankCards";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

// Schema for bank card form
const bankCardSchema = z.object({
  cardHolderName: z
    .string()
    .min(2, "Card holder name must be at least 2 characters"),
  bankName: z.enum(["JAZZCASH", "EASYPAISA"]),
  accountNumber: z
    .string()
    .min(10, "Account number must be at least 10 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
});

type BankCardFormData = z.infer<typeof bankCardSchema>;

interface BankCardProps {
  userId: string;
  userRealName?: string;
}

const BankCard: React.FC<BankCardProps> = ({ userId, userRealName }) => {
  const {
    bankCards,
    loading: isLoading,
    addBankCard,
    removeBankCard,
  } = useBankCards();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<BankCardFormData>({
    resolver: zodResolver(bankCardSchema),
    defaultValues: {
      cardHolderName: userRealName || "",
      bankName: "JAZZCASH",
      accountNumber: "",
    },
  });

  // Update form when userRealName changes
  useEffect(() => {
    if (userRealName) {
      form.setValue("cardHolderName", userRealName);
    }
  }, [userRealName, form]);

  const handleSubmit = async (data: BankCardFormData) => {
    try {
      setIsSubmitting(true);

      const success = await addBankCard(data);

      if (success) {
        // Reset form and close drawer
        form.reset({
          cardHolderName: userRealName || "",
          bankName: "JAZZCASH",
          accountNumber: "",
        });
        setIsDrawerOpen(false);
      }
    } catch (error) {
      console.error("Error adding bank card:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to remove this bank card?")) {
      return;
    }

    await removeBankCard(cardId);
  };

  const getBankIcon = (bankName: string) => {
    switch (bankName) {
      case "JAZZCASH":
        return <Smartphone className="h-6 w-6" />;
      case "EASYPAISA":
        return <Wallet className="h-6 w-6" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const getBankGradient = (bankName: string) => {
    switch (bankName) {
      case "JAZZCASH":
        return "from-purple-600 to-blue-600";
      case "EASYPAISA":
        return "from-green-600 to-emerald-600";
      default:
        return "from-gray-600 to-slate-600";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading bank cards...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Display existing bank cards */}
      {bankCards.map((card) => (
        <Card
          key={card.id}
          className={`relative overflow-hidden bg-gradient-to-br ${getBankGradient(card.bankName)} text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {getBankIcon(card.bankName)}
                  {card.bankName === "JAZZCASH" ? "JazzCash" : "EasyPaisa"}
                </CardTitle>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm opacity-80">Bank Account</p>
                  <p className="text-lg font-mono font-semibold">
                    {card.accountNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Cardholder</p>
                  <p className="text-lg font-semibold">{card.cardHolderName}</p>
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
      ))}

      {/* Add Wallet Number Button */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            <span>Add Wallet Number</span>
          </Button>
        </DrawerTrigger>

        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Bind Bank Card</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {/* Card Holder Name */}
                <FormField
                  control={form.control}
                  name="cardHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Card Holder Name
                          </span>
                          <Input
                            {...field}
                            placeholder="Enter card holder name"
                            disabled={isSubmitting}
                            className="max-w-[200px] text-right"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Account Number */}
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Please enter the Bank account"
                          disabled={isSubmitting}
                          type="tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bank Name Selection */}
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("JAZZCASH")}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            field.value === "JAZZCASH"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          disabled={isSubmitting}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Smartphone className="h-6 w-6 text-purple-600" />
                            <span className="text-sm font-medium">
                              JazzCash
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("EASYPAISA")}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            field.value === "EASYPAISA"
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          disabled={isSubmitting}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Wallet className="h-6 w-6 text-green-600" />
                            <span className="text-sm font-medium">
                              EasyPaisa
                            </span>
                          </div>
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Information Text */}
                <div className="bg-green-100 p-4 rounded-lg">
                  <p className="text-sm text-green-800 text-center">
                    The account opening phone of your bound bank card must be
                    the same as your contact mobile phone, otherwise you will
                    not be able to withdraw money.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add it now"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Additional Info Card */}
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Secure payment methods powered by JazzCash & EasyPaisa</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankCard;
