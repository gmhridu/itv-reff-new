"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface BankCard {
  id: string;
  cardHolderName: string;
  bankName: string;
  accountNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseBankCardsReturn {
  bankCards: BankCard[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addBankCard: (data: {
    cardHolderName: string;
    bankName: string;
    accountNumber: string;
  }) => Promise<boolean>;
  removeBankCard: (cardId: string) => Promise<boolean>;
}

export function useBankCards(): UseBankCardsReturn {
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBankCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/bank-cards", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setBankCards(result.data || []);
      } else {
        const errorMessage = result.error || "Failed to fetch bank cards";
        setError(errorMessage);

        if (response.status !== 401) {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      const errorMessage = "Network error occurred while fetching bank cards";
      setError(errorMessage);
      console.error("Error fetching bank cards:", err);

      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addBankCard = useCallback(
    async (data: {
      cardHolderName: string;
      bankName: string;
      accountNumber: string;
    }) => {
      try {
        const response = await fetch("/api/bank-cards", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast({
            title: "Success!",
            description: "Bank card added successfully.",
            variant: "default",
          });

          // Set session storage flag for withdrawal page notification
          sessionStorage.setItem("bankCardAdded", "true");

          // Refresh the list
          await fetchBankCards();
          return true;
        } else {
          throw new Error(result.error || "Failed to add bank card");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add bank card";

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });

        return false;
      }
    },
    [fetchBankCards, toast],
  );

  const removeBankCard = useCallback(
    async (cardId: string) => {
      try {
        const response = await fetch(`/api/bank-cards?cardId=${cardId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast({
            title: "Success!",
            description: "Bank card removed successfully.",
            variant: "default",
          });

          // Refresh the list
          await fetchBankCards();
          return true;
        } else {
          throw new Error(result.error || "Failed to remove bank card");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to remove bank card";

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });

        return false;
      }
    },
    [fetchBankCards, toast],
  );

  const refetch = useCallback(async () => {
    await fetchBankCards();
  }, [fetchBankCards]);

  useEffect(() => {
    fetchBankCards();
  }, [fetchBankCards]);

  return {
    bankCards,
    loading,
    error,
    refetch,
    addBankCard,
    removeBankCard,
  };
}
