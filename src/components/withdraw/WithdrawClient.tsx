"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Shield,
  Settings,
  Plus,
  Info,
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
import { useWithdrawalInfo } from "@/hooks/useWithdrawalConfig";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const WithdrawClient = () => {
  const { bankCards, loading: isLoadingCards, refetch } = useBankCards();
  const { toast } = useToast();
  const router = useRouter();
  const { config: withdrawalConfig, calculateDisplayFees } =
    useWithdrawalInfo();

  // State for user data
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State management
  const [selectedWallet, setSelectedWallet] = useState("Commission Wallet");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [showNoBankCardsModal, setShowNoBankCardsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<any>(null);
  const [walletBalances, setWalletBalances] = useState({
    mainWallet: 0,
    commissionWallet: 0,
    totalEarnings: 0,
    securityDeposited: 0,
    securityRefund: 0,
    totalAvailableForWithdrawal: 0,
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usdtToPkrRate, setUsdtToPkrRate] = useState<number>(295);
  const [showUsdtForm, setShowUsdtForm] = useState(false);
  const [usdtAddress, setUsdtAddress] = useState("");
  const [usdtHolderName, setUsdtHolderName] = useState("");
  const [isAddingUsdtWallet, setIsAddingUsdtWallet] = useState(false);

  // Initialize notifications hook with current user
  const { refetch: refetchNotifications } = useNotifications({
    userId: currentUser?.id || "",
  });

  // Use predefined amounts from configuration
  const predefinedAmounts = withdrawalConfig?.predefinedAmounts || [
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
    fetchUsdtRate();
  }, []);

  // Set default selection when bank cards are loaded
  useEffect(() => {
    if (bankCards.length > 0 && !selectedMethod) {
      const firstCard = bankCards[0];
      const displayName = `${firstCard.bankName === "JAZZCASH" ? "JazzCash" : "EasyPaisa"} ${firstCard.accountNumber}`;
      setSelectedMethod(displayName);
    }
  }, [bankCards, selectedMethod]);

  // Auto-populate USDT holder name with user's real name
  useEffect(() => {
    if (currentUser && currentUser.realName && !usdtHolderName) {
      setUsdtHolderName(currentUser.realName);
    }
  }, [currentUser, usdtHolderName]);

  // Fetch USDT rate
  const fetchUsdtRate = async () => {
    try {
      const response = await fetch("/api/user/topup");
      const data = await response.json();
      if (data.success && data.data.usdtToPkrRate) {
        setUsdtToPkrRate(data.data.usdtToPkrRate);
      }
    } catch (error) {
      console.error("Error fetching USDT rate:", error);
    }
  };

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
        const errorData = await response.json();
        if (errorData.code === "DB_CONNECTION_ERROR") {
          toast({
            title: "Connection Issue",
            description:
              "Database temporarily unavailable. Please try again in a few moments.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load wallet balances",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
      toast({
        title: "Connection Error",
        description: "Please check your internet connection and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const handleAmountSelect = (value: number) => {
    // Use the correct Total Available for Withdrawal balance
    const totalAvailable = walletBalances.totalAvailableForWithdrawal || 0;

    if (totalAvailable < value) {
      toast({
        title: "Insufficient Balance",
        description: `Your total available balance for withdrawal (PKR ${totalAvailable.toFixed(2)}) is insufficient for this withdrawal amount.`,
        variant: "destructive",
      });
      return;
    }

    setAmount(value.toString());
  };

  const handleWalletSelect = (wallet: string) => {
    setSelectedWallet("Commission Wallet");
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

    if (!amount) {
      toast({
        title: "Error",
        description: "Please enter withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    const minWithdrawal = withdrawalConfig?.minimumWithdrawal || 500;

    if (withdrawalAmount < minWithdrawal) {
      toast({
        title: "Minimum Withdrawal",
        description: `Minimum withdrawal amount is PKR ${minWithdrawal}.`,
        variant: "destructive",
      });
      return;
    }

    // Check balance using withdrawal configuration (using correct Total Available for Withdrawal)
    const currentBalance = walletBalances.totalAvailableForWithdrawal || 0;

    const isUsdtWithdrawal = isUsdtMethod();
    const calculation = calculateDisplayFees?.(
      withdrawalAmount,
      isUsdtWithdrawal,
    );
    const totalRequired = calculation?.totalDeduction || withdrawalAmount;

    if (currentBalance < totalRequired) {
      const feePercentage = withdrawalConfig?.withdrawalFeePercentage || 10;
      const feeDescription = isUsdtWithdrawal
        ? "no fees"
        : `${feePercentage}% handling fee`;
      toast({
        title: "Insufficient Balance",
        description: `Insufficient balance including ${feeDescription}. Required: PKR ${totalRequired.toFixed(2)}, Available: PKR ${currentBalance.toFixed(2)}`,
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
          walletType: "Commission Wallet",
          amount: withdrawalAmount,
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

  const getBankIcon = (bankName: string) => {
    switch (bankName) {
      case "JAZZCASH":
        return "📱";
      case "EASYPAISA":
        return "💳";
      case "USDT_TRC20":
        return "₮";
      default:
        return "💳";
    }
  };

  const formatBankName = (bankName: string) => {
    switch (bankName) {
      case "JAZZCASH":
        return "JazzCash";
      case "EASYPAISA":
        return "EasyPaisa";
      case "USDT_TRC20":
        return "USDT (TRC20) (Zero Handling Fee)";
      default:
        return bankName;
    }
  };

  // Check if selected method is USDT
  const isUsdtMethod = () => {
    if (!selectedMethod || bankCards.length === 0) return false;
    const selectedCard = bankCards.find((card) => {
      const displayName =
        formatBankName(card.bankName) +
        " " +
        (card.bankName === "USDT_TRC20"
          ? `${card.accountNumber.slice(0, 6)}...${card.accountNumber.slice(-6)}`
          : card.accountNumber);
      return displayName === selectedMethod;
    });
    return selectedCard?.bankName === "USDT_TRC20";
  };

  // Calculate USDT equivalent
  const calculateUsdtAmount = (pkrAmount: number) => {
    return pkrAmount / usdtToPkrRate;
  };

  const handleAddUsdtWallet = async () => {
    if (!usdtAddress || !usdtHolderName) {
      toast({
        title: "Error",
        description: "Please fill in all USDT wallet details",
        variant: "destructive",
      });
      return;
    }

    // No validation - USDT TRC20 is kept unrestricted as per requirements

    setIsAddingUsdtWallet(true);

    try {
      const response = await fetch("/api/bank-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardHolderName: usdtHolderName,
          bankName: "USDT_TRC20",
          accountNumber: usdtAddress,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "USDT wallet added successfully!",
        });

        // Reset form and close modal
        setUsdtAddress("");
        setUsdtHolderName("");
        setShowUsdtForm(false);

        // Refresh bank cards
        refetch();

        // Auto-select the new USDT wallet
        setTimeout(() => {
          const displayName = `USDT (TRC20) ${usdtAddress.slice(0, 6)}...${usdtAddress.slice(-6)}`;
          setSelectedMethod(displayName);
        }, 500);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add USDT wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding USDT wallet:", error);
      toast({
        title: "Error",
        description: "Failed to add USDT wallet",
        variant: "destructive",
      });
    } finally {
      setIsAddingUsdtWallet(false);
    }
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
            {/* Fund Password Warning - Removed as per requirements */}

            {/* Total Available Balance for Withdrawal */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-800">
                  Total Available Balance for Withdrawal
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {isLoadingBalances
                    ? "Loading..."
                    : `PKR ${(walletBalances.totalAvailableForWithdrawal || 0).toFixed(2)}`}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Earnings :</span>
                  <span>
                    PKR {(walletBalances.totalEarnings || 0).toFixed(2)}
                  </span>
                </div>

              </div>
            </div>

            {/* Withdrawal Method Selection */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Withdrawal method</span>
                <span className="text-sm text-gray-500">
                  {bankCards.length === 0
                    ? "No methods added"
                    : `${bankCards.length} method(s)`}
                </span>
              </div>

              {/* USDT Quick Access Section */}
              {!bankCards.some((card) => card.bankName === "USDT_TRC20") && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">₮</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          USDT (TRC20){" "}
                          <span className="text-green-600">
                            (Zero Handling Fee)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowUsdtForm(true)}
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add USDT
                    </Button>
                  </div>
                </div>
              )}

              <Drawer>
                <DrawerTrigger
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleWithdrawalMethodClick}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      {isLoadingCards ? (
                        <div className="text-gray-500">Loading methods...</div>
                      ) : selectedMethod ? (
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {bankCards.find((card) => {
                              const displayName =
                                formatBankName(card.bankName) +
                                " " +
                                (card.bankName === "USDT_TRC20"
                                  ? `${card.accountNumber.slice(0, 6)}...${card.accountNumber.slice(-6)}`
                                  : card.accountNumber);
                              return displayName === selectedMethod;
                            })?.bankName &&
                              getBankIcon(
                                bankCards.find((card) => {
                                  const displayName =
                                    formatBankName(card.bankName) +
                                    " " +
                                    (card.bankName === "USDT_TRC20"
                                      ? `${card.accountNumber.slice(0, 6)}...${card.accountNumber.slice(-6)}`
                                      : card.accountNumber);
                                  return displayName === selectedMethod;
                                })?.bankName || "",
                              )}
                          </span>
                          <div>
                            <div className="font-medium">{selectedMethod}</div>
                            {selectedMethod.includes("USDT") && (
                              <div className="text-xs text-orange-600">
                                Fast processing • Low fees
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          Select withdrawal method
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </DrawerTrigger>

                {bankCards.length > 0 && (
                  <DrawerContent className="max-h-[60vh]">
                    <DrawerHeader>
                      <DrawerTitle>Select Withdrawal Method</DrawerTitle>
                    </DrawerHeader>

                    <div className="px-4 pb-6 space-y-3">
                      {/* Group USDT methods first */}
                      {bankCards
                        .filter((card) => card.bankName === "USDT_TRC20")
                        .map((card) => {
                          const displayName =
                            formatBankName(card.bankName) +
                            " " +
                            `${card.accountNumber.slice(0, 6)}...${card.accountNumber.slice(-6)}`;
                          return (
                            <DrawerClose key={card.id} asChild>
                              <button
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                  selectedMethod === displayName
                                    ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-300 shadow-md"
                                    : "hover:bg-gray-50 border-gray-200 hover:border-orange-200"
                                }`}
                                onClick={() => handleMethodSelect(displayName)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-lg">
                                      ₮
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="font-semibold">
                                        USDT (TRC20) (Zero Handling Fee)
                                      </div>
                                      <Badge className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                                        Fast
                                      </Badge>
                                    </div>
                                    <div className="text-sm text-gray-600 font-mono">
                                      {card.accountNumber.slice(0, 8)}...
                                      {card.accountNumber.slice(-8)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {card.cardHolderName} • No fees
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </DrawerClose>
                          );
                        })}

                      {/* Traditional payment methods */}
                      {bankCards
                        .filter((card) => card.bankName !== "USDT_TRC20")
                        .map((card) => {
                          const displayName =
                            formatBankName(card.bankName) +
                            " " +
                            card.accountNumber;
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
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {formatBankName(card.bankName)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {card.accountNumber}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {card.cardHolderName} • 0-72 hours • 10%
                                      fee
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </DrawerClose>
                          );
                        })}

                      {/* Add More Payment Methods */}
                      <div className="pt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setShowUsdtForm(true);
                          }}
                          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-gray-600 hover:text-orange-600"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            <span>Add USDT Wallet</span>
                          </div>
                        </button>

                        <DrawerClose asChild>
                          <button
                            onClick={() => router.push("/user/bank-card")}
                            className="w-full mt-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Plus className="w-4 h-4" />
                              <span>Add Other Payment Method</span>
                            </div>
                          </button>
                        </DrawerClose>
                      </div>
                    </div>
                  </DrawerContent>
                )}
              </Drawer>
            </div>

            {/* Amount Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-semibold">PKR</span>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Please select the withdrawal amount
                  </div>
                  {isUsdtMethod() && amount && (
                    <div className="text-xs text-orange-600 mt-1">
                      ≈ {calculateUsdtAmount(parseFloat(amount)).toFixed(4)}{" "}
                      USDT
                    </div>
                  )}
                </div>
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

              {/* USDT Conversion Info */}
              {isUsdtMethod() && amount && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">₮</span>
                    <span className="font-medium text-gray-900">
                      USDT Conversion
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PKR Amount:</span>
                      <span className="font-medium">
                        PKR {parseFloat(amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">USDT Equivalent:</span>
                      <span className="font-medium text-orange-600">
                        {calculateUsdtAmount(parseFloat(amount)).toFixed(4)}{" "}
                        USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network Fee:</span>
                      <span className="text-green-600">FREE (No fees)</span>
                    </div>
                    <hr className="border-orange-200" />
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900">You'll receive:</span>
                      <span className="text-green-600">
                        {calculateUsdtAmount(parseFloat(amount)).toFixed(4)}{" "}
                        USDT
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Rate: 1 USDT = PKR {usdtToPkrRate} • Processing: 0-30
                      minutes
                    </div>
                  </div>
                </div>
              )}

              {/* Traditional Payment Info */}
              {!isUsdtMethod() && amount && selectedMethod && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      Traditional Withdrawal
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Withdrawal Amount:</span>
                      <span className="font-medium">
                        PKR {parseFloat(amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Handling Fee (10%):</span>
                      <span className="text-red-600">
                        -PKR {(parseFloat(amount) * 0.1).toLocaleString()}
                      </span>
                    </div>
                    <hr className="border-blue-200" />
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900">Total Deduction:</span>
                      <span className="text-blue-600">
                        PKR {(parseFloat(amount) * 1.1).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Processing: 0-72 hours • Fee included in deduction
                    </div>
                  </div>
                </div>
              )}

              {/* Predefined Amount Grid */}
              <div className="grid grid-cols-4 gap-3">
                {predefinedAmounts.map((value) => {
                  const currentBalance =
                    walletBalances.totalAvailableForWithdrawal || 0;
                  const isUsdtWithdrawal = isUsdtMethod();
                  const feePercentage = isUsdtWithdrawal ? 0 : 0.1;
                  const totalRequired = isUsdtWithdrawal
                    ? value
                    : value * (1 + feePercentage);
                  const isInsufficient = currentBalance < totalRequired;

                  return (
                    <button
                      key={value}
                      onClick={() => handleAmountSelect(value)}
                      disabled={isInsufficient}
                      className={`p-3 rounded-lg border transition-colors text-sm ${
                        amount === value.toString()
                          ? isUsdtWithdrawal
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500"
                            : "bg-blue-500 text-white border-blue-500"
                          : isInsufficient
                            ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                      }`}
                      title={isInsufficient ? "Insufficient balance" : ""}
                    >
                      <div className="font-medium">
                        {value.toLocaleString()}
                      </div>
                      {isUsdtWithdrawal && !isInsufficient && (
                        <div className="text-xs mt-1 opacity-80">
                          ≈{calculateUsdtAmount(value).toFixed(2)} USDT
                        </div>
                      )}
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

            {/* Fund Password - Removed as per requirements */}

            {/* Submit Button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              onClick={handleSubmit}
              disabled={!amount || isLoadingCards || isSubmitting}
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
            {amount && !isUsdtMethod() && (
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
            <div className="space-y-2 text-sm text-gray-600 mb-16">
              <p>
                1. Withdraw your earnings anytime from Monday to Saturday.
                Withdrawals are not available on Sundays and Public Holidays.
              </p>
              <p>
                2. Maximum time for withdrawal to arrive in your account is 72
                hours.
              </p>
              <p>
                3. A 10% handling fee will be deducted for Jazz cash and Easy
                Paisa..
              </p>
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

        {/* USDT Wallet Addition Form */}
        <Dialog open={showUsdtForm} onOpenChange={setShowUsdtForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="text-2xl">₮</div>
                Add USDT Wallet
              </DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usdtHolderName">Wallet Label</Label>
                <Input
                  id="usdtHolderName"
                  placeholder="e.g., My USDT Wallet"
                  value={usdtHolderName}
                  onChange={(e) => setUsdtHolderName(e.target.value)}
                  disabled={isAddingUsdtWallet}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usdtAddress">USDT TRC20 Address</Label>
                <Input
                  id="usdtAddress"
                  placeholder="Enter any USDT address"
                  value={usdtAddress}
                  onChange={(e) => setUsdtAddress(e.target.value)}
                  disabled={isAddingUsdtWallet}
                  className="font-mono text-sm"
                />
              </div>

              {/*<div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <div className="font-medium">Fast Processing</div>
                    <div className="text-xs text-orange-700 mt-1">
                      USDT withdrawals are processed within 0-30 minutes with
                      no fees
                    </div>
                  </div>
                </div>
              </div>*/}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUsdtForm(false)}
                  disabled={isAddingUsdtWallet}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUsdtWallet}
                  disabled={isAddingUsdtWallet}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isAddingUsdtWallet ? "Adding..." : "Add Wallet"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
