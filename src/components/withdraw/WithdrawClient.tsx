"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Shield,
  Settings,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "../ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useBankCards } from "@/hooks/useBankCards";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { WithdrawalHistory } from "./WithdrawalHistory";
import { useNotifications } from "@/hooks/use-notifications";

export const WithdrawClient = () => {
  const { bankCards, loading: isLoadingCards, refetch } = useBankCards();
  const { toast } = useToast();
  const router = useRouter();

  // State for user data
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State management
  const [selectedWallet, setSelectedWallet] = useState("Main Wallet");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [fundPassword, setFundPassword] = useState("");
  const [showNoBankCardsModal, setShowNoBankCardsModal] = useState(false);
  const [showFundPasswordWarning, setShowFundPasswordWarning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<any>(null);
  const [walletBalances, setWalletBalances] = useState({
    mainWallet: 0,
    commissionWallet: 0,
    totalEarnings: 0,
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize notifications hook with current user
  const { refetch: refetchNotifications } = useNotifications({
    userId: currentUser?.id || "",
  });

  const predefinedAmounts = [
    500, 3000, 10000, 30000, 70000, 100000, 250000, 500000,
  ];

  const walletOptions = [
    { value: "Main Wallet", label: "Main Wallet" },
    { value: "Commission Wallet", label: "Commission Wallet" },
  ];

  // Fetch current user and wallet balances on component mount
  useEffect(() => {
    fetchCurrentUser();
    fetchWalletBalances();
    checkFundPasswordStatus();
  }, []);

  // Set default selection when bank cards are loaded
  useEffect(() => {
    if (bankCards.length > 0 && !selectedMethod) {
      const firstCard = bankCards[0];
      const displayName = `${firstCard.bankName === "JAZZCASH" ? "JazzCash" : "EasyPaisa"} ${firstCard.accountNumber}`;
      setSelectedMethod(displayName);
    }
  }, [bankCards, selectedMethod]);

  // Refresh bank cards when window gains focus (user returns from bank-card page)
  useEffect(() => {
    const handleFocus = () => {
      refetch();

      // Check if user just added a bank card
      const bankCardAdded = sessionStorage.getItem("bankCardAdded");
      if (bankCardAdded === "true") {
        sessionStorage.removeItem("bankCardAdded");
        toast({
          title: "Payment Method Added!",
          description:
            "Your bank card has been added successfully. You can now proceed with withdrawal.",
          variant: "default",
        });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch, toast]);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.data);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  // Check for success message on component mount
  useEffect(() => {
    const bankCardAdded = sessionStorage.getItem("bankCardAdded");
    if (bankCardAdded === "true") {
      sessionStorage.removeItem("bankCardAdded");
      setTimeout(() => {
        toast({
          title: "Payment Method Added!",
          description:
            "Your bank card has been added successfully. You can now proceed with withdrawal.",
          variant: "default",
        });
      }, 500);
    }
  }, [toast]);

  const fetchWalletBalances = async () => {
    try {
      const response = await fetch("/api/user/wallet-balances", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalances(data.walletBalances);
      } else {
        toast({
          title: "Error",
          description: "Failed to load wallet balances",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet balances",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const checkFundPasswordStatus = async () => {
    try {
      const response = await fetch("/api/user/fund-password/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.hasFundPassword) {
          setShowFundPasswordWarning(true);
        }
      }
    } catch (error) {
      console.error("Error checking fund password status:", error);
    }
  };

  const handleAmountSelect = (value: number) => {
    // Check if user has sufficient balance
    const currentBalance =
      selectedWallet === "Main Wallet"
        ? walletBalances.mainWallet
        : walletBalances.commissionWallet;

    if (currentBalance < value) {
      toast({
        title: "Insufficient Balance",
        description: `Your ${selectedWallet} balance (PKR ${currentBalance.toFixed(2)}) is insufficient for this withdrawal amount.`,
        variant: "destructive",
      });
      return;
    }

    setAmount(value.toString());
  };

  const handleWalletSelect = (wallet: string) => {
    setSelectedWallet(wallet);
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
  };

  const handleWithdrawalMethodClick = () => {
    // Check if user has any bank cards
    if (bankCards.length === 0 && !isLoadingCards) {
      setShowNoBankCardsModal(true);
      return;
    }
  };

  const handleRedirectToBankCard = () => {
    setShowNoBankCardsModal(false);
    router.push("/user/bank-card");
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast({
        title: "Error",
        description: "Please select a withdrawal method.",
        variant: "destructive",
      });
      return;
    }

    if (bankCards.length === 0) {
      setShowNoBankCardsModal(true);
      return;
    }

    if (!amount || !fundPassword) {
      toast({
        title: "Error",
        description: "Please enter withdrawal amount and fund password.",
        variant: "destructive",
      });
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (withdrawalAmount < 500) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is PKR 500.",
        variant: "destructive",
      });
      return;
    }

    // Check balance including 10% handling fee
    const currentBalance =
      selectedWallet === "Main Wallet"
        ? walletBalances.mainWallet
        : walletBalances.commissionWallet;

    const handlingFee = withdrawalAmount * 0.1;
    const totalRequired = withdrawalAmount + handlingFee;

    if (currentBalance < totalRequired) {
      toast({
        title: "Insufficient Balance",
        description: `Insufficient balance including 10% handling fee. Required: PKR ${totalRequired.toFixed(2)}, Available: PKR ${currentBalance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Find the selected bank card
      const selectedCard = bankCards.find((card) => {
        const displayName = `${card.bankName === "JAZZCASH" ? "JazzCash" : "EasyPaisa"} ${card.accountNumber}`;
        return displayName === selectedMethod;
      });

      if (!selectedCard) {
        throw new Error("Selected payment method not found");
      }

      const response = await fetch("/api/user/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletType: selectedWallet,
          amount: withdrawalAmount,
          fundPassword: fundPassword,
          paymentMethodId: selectedCard.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if we should show success modal
        if (data.showSuccessModal && data.modalData) {
          setSuccessModalData(data.modalData);
          setShowSuccessModal(true);
        } else {
          toast({
            title: "Withdrawal Submitted",
            description: `Your withdrawal request of PKR ${withdrawalAmount} has been submitted successfully. Processing time: ${data.data.estimatedProcessingTime}`,
            variant: "default",
          });
        }

        // Reset form
        setAmount("");
        setFundPassword("");

        // Refresh wallet balances
        fetchWalletBalances();

        // Refresh notifications to show the new withdrawal notification
        try {
          setTimeout(() => {
            refetchNotifications();
          }, 1000); // Small delay to ensure notification is created
        } catch (error) {
          console.log("Failed to refresh notifications:", error);
        }
      } else {
        toast({
          title: "Withdrawal Failed",
          description: data.error || "Failed to submit withdrawal request.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Withdrawal submission error:", error);
      toast({
        title: "Error",
        description:
          "An error occurred while submitting your withdrawal request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBankName = (bankName: string) => {
    return bankName === "JAZZCASH" ? "JazzCash" : "EasyPaisa";
  };

  const getBankIcon = (bankName: string) => {
    return bankName === "JAZZCASH" ? "📱" : "💳";
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-4 space-y-6 mx-auto">
        {/* Header */}
        <h1 className="text-xl font-semibold text-center">Withdrawal</h1>

        {/* Tabs */}
        <Tabs defaultValue="withdraw" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="withdraw">New Withdrawal</TabsTrigger>
            <TabsTrigger value="history">Withdrawal History</TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw" className="space-y-6 mt-6">
            {/* Fund Password Warning */}
            {showFundPasswordWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-amber-800 mb-1">
                      Fund Password Required
                    </h3>
                    <p className="text-sm text-amber-700 mb-3">
                      You need to set a fund password before making withdrawals.
                      This is required for security purposes.
                    </p>
                    <button
                      onClick={() => {
                        setShowFundPasswordWarning(false);
                        router.push("/user/info");
                      }}
                      className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded-md hover:bg-amber-700 transition-colors flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      Set Fund Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet Balances */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Main Wallet:</span>
                <span className="font-semibold">
                  {isLoadingBalances
                    ? "Loading..."
                    : `PKR ${walletBalances.mainWallet.toFixed(2)}`}
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Commission Wallet:</span>
                <span className="font-semibold">
                  {isLoadingBalances
                    ? "Loading..."
                    : `PKR ${walletBalances.commissionWallet.toFixed(2)}`}
                </span>
              </div>
              <hr className="border-gray-200" />
            </div>

            {/* Wallet Type Selection */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Wallet Type</span>

                <Drawer>
                  <DrawerTrigger className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                    <span>{selectedWallet}</span>
                    <ArrowRight className="w-4 h-4" />
                  </DrawerTrigger>

                  <DrawerContent className="max-h-[50vh]">
                    <DrawerHeader>
                      <DrawerTitle>Select Wallet Type</DrawerTitle>
                    </DrawerHeader>

                    <div className="px-4 pb-6 space-y-3">
                      {walletOptions.map((option) => (
                        <DrawerClose key={option.value} asChild>
                          <button
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedWallet === option.value
                                ? "bg-blue-50 border-blue-200"
                                : "hover:bg-gray-50 border-gray-200"
                            }`}
                            onClick={() => handleWalletSelect(option.value)}
                          >
                            {option.label}
                          </button>
                        </DrawerClose>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>

              {/* Withdrawal Method Selection */}
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Withdrawal method</span>

                <Drawer>
                  <DrawerTrigger
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                    onClick={handleWithdrawalMethodClick}
                  >
                    <span className="text-right">
                      {isLoadingCards
                        ? "Loading..."
                        : selectedMethod || "Select method"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </DrawerTrigger>

                  {bankCards.length > 0 && (
                    <DrawerContent className="max-h-[50vh]">
                      <DrawerHeader>
                        <DrawerTitle>Select Withdrawal Method</DrawerTitle>
                      </DrawerHeader>

                      <div className="px-4 pb-6 space-y-3">
                        {bankCards.map((card) => {
                          const displayName = `${formatBankName(card.bankName)} ${card.accountNumber}`;
                          return (
                            <DrawerClose key={card.id} asChild>
                              <button
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                  selectedMethod === displayName
                                    ? "bg-blue-50 border-blue-200"
                                    : "hover:bg-gray-50 border-gray-200"
                                }`}
                                onClick={() => handleMethodSelect(displayName)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">
                                    {getBankIcon(card.bankName)}
                                  </span>
                                  <div>
                                    <div className="font-medium">
                                      {formatBankName(card.bankName)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {card.accountNumber}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {card.cardHolderName}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </DrawerClose>
                          );
                        })}
                      </div>
                    </DrawerContent>
                  )}
                </Drawer>
              </div>
            </div>

            {/* Amount Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-semibold">PKR</span>
                <span className="text-sm text-gray-500">
                  Please select the withdrawal amount
                </span>
              </div>

              {/* Custom Amount Input - Disabled to force predefined amounts */}
              <Input
                type="number"
                placeholder="Please select from amounts below"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg bg-gray-100"
                disabled
                readOnly
              />

              {/* Predefined Amount Grid */}
              <div className="grid grid-cols-4 gap-3">
                {predefinedAmounts.map((value) => {
                  const currentBalance =
                    selectedWallet === "Main Wallet"
                      ? walletBalances.mainWallet
                      : walletBalances.commissionWallet;
                  const isInsufficient = currentBalance < value;

                  return (
                    <button
                      key={value}
                      onClick={() => handleAmountSelect(value)}
                      disabled={isInsufficient || showFundPasswordWarning}
                      className={`p-3 rounded-lg border transition-colors text-sm ${
                        amount === value.toString()
                          ? "bg-blue-500 text-white border-blue-500"
                          : isInsufficient
                            ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                      }`}
                      title={isInsufficient ? "Insufficient balance" : ""}
                    >
                      {value.toLocaleString()}
                      {isInsufficient && (
                        <div className="text-xs text-red-400 mt-1">
                          Insufficient
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fund Password */}
            <div className="space-y-2">
              <label className="text-gray-700">Fund password</label>
              <Input
                type="password"
                placeholder="Please input fund password"
                value={fundPassword}
                onChange={(e) => setFundPassword(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              onClick={handleSubmit}
              disabled={
                !amount ||
                !fundPassword ||
                isLoadingCards ||
                showFundPasswordWarning ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Submit"
              )}
            </Button>

            {/* Balance warning for current selection */}
            {amount && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span>Withdrawal Amount:</span>
                  <span className="font-medium">
                    PKR {parseFloat(amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span>Handling Fee (10%):</span>
                  <span className="font-medium">
                    PKR {(parseFloat(amount) * 0.1).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-1">
                  <span className="font-medium">Total Deduction:</span>
                  <span className="font-semibold">
                    PKR {(parseFloat(amount) * 1.1).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Withdrawal Information */}
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                1. Withdrawal time is from 9:00 to 17:00 from Monday to Friday.
              </p>
              <p className="text-red-500">
                (After submitting the withdrawal application, it will arrive in
                your account within 0 to72 hours.)
              </p>
              <p>
                2. Withdrawals are not available on weekends and public
                holidays.
              </p>
              <p>3. A 10% handling fee will be deducted for each withdrawal.</p>
              <p>
                4. If you encounter any other problems, please contact online
                customer service.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <WithdrawalHistory />
          </TabsContent>
        </Tabs>

        {/* No Bank Cards Modal */}
        <Dialog
          open={showNoBankCardsModal}
          onOpenChange={setShowNoBankCardsModal}
        >
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg">
                    No Payment Method
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-left">
                You haven't added any bank cards yet. Please add a payment
                method to continue with withdrawal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Supported Payment Methods
                  </span>
                </div>
                <div className="space-y-1 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <span>📱</span>
                    <span>JazzCash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💳</span>
                    <span>EasyPaisa</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNoBankCardsModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRedirectToBankCard}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 text-green-600">✓</div>
                </div>
                <div>
                  <DialogTitle className="text-lg text-green-800">
                    {successModalData?.title || "Success!"}
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-left">
                {successModalData?.message ||
                  "Your withdrawal application has been submitted successfully."}
              </DialogDescription>
            </DialogHeader>

            {successModalData && (
              <div className="space-y-4 pt-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">
                        PKR {successModalData.amount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">
                        {successModalData.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Time:</span>
                      <span className="font-medium text-green-600">
                        {successModalData.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> You will receive a confirmation once
                    your withdrawal has been processed by our admin team.
                  </p>
                </div>

                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Got It!
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
