"use client";

import { useState, useEffect } from "react";
import { handleAuthError } from "@/lib/auth-error-handler";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode: string;
  status: string;
  walletBalance: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
      } else {
        setUser(null);
        // Handle 401 errors properly
        if (response.status === 401) {
          handleAuthError(new Response(null, { status: 401 }), { redirectPath: "/" });
        } else {
          setError(data.error || "Failed to fetch user data");
        }
      }
    } catch (err) {
      console.error("Auth fetch error:", err);
      setUser(null);
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError("Network error occurred");
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refetch = async () => {
    await fetchUser();
  };

  return {
    user,
    loading,
    error,
    refetch,
  };
}