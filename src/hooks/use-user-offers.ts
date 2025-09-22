import { useState, useEffect } from "react";

interface UserOffer {
  id: string;
  userId: string;
  announcementId?: string;
  offerType: string;
  offerValue: string;
  offerCode?: string;
  description?: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  expiresAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  announcement?: {
    id: string;
    title: string;
    message: string;
    imageUrl?: string;
  };
}

interface OfferStats {
  active: number;
  redeemed: number;
  expired: number;
}

interface UseUserOffersResult {
  offers: UserOffer[];
  stats: OfferStats;
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  refreshOffers: () => Promise<void>;
  redeemOffer: (offerId: string, redemptionDetails?: string) => Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }>;
  loadMore: () => Promise<void>;
}

export function useUserOffers(
  includeRedeemed: boolean = false,
  limit: number = 10
): UseUserOffersResult {
  const [offers, setOffers] = useState<UserOffer[]>([]);
  const [stats, setStats] = useState<OfferStats>({
    active: 0,
    redeemed: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Fetch offers from API
  const fetchOffers = async (reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        includeRedeemed: includeRedeemed.toString(),
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });

      const response = await fetch(`/api/user/offers?${params}`);
      const data = await response.json();

      if (data.success) {
        const newOffers = data.data.offers;

        if (reset) {
          setOffers(newOffers);
          setOffset(limit);
        } else {
          setOffers(prev => [...prev, ...newOffers]);
          setOffset(prev => prev + limit);
        }

        setStats(data.data.stats);
        setTotalCount(data.data.totalCount);
        setHasMore(data.data.pagination.hasMore);
      } else {
        setError(data.error || "Failed to fetch offers");
      }
    } catch (err) {
      setError("Failed to fetch offers");
      console.error("Error fetching user offers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh offers (reset and fetch from beginning)
  const refreshOffers = async () => {
    await fetchOffers(true);
  };

  // Load more offers
  const loadMore = async () => {
    if (!hasMore || loading) return;
    await fetchOffers(false);
  };

  // Redeem an offer
  const redeemOffer = async (
    offerId: string,
    redemptionDetails?: string
  ): Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }> => {
    try {
      const response = await fetch(`/api/user/offers/${offerId}/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redemptionDetails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state - mark offer as redeemed
        setOffers(prev =>
          prev.map(offer =>
            offer.id === offerId
              ? {
                  ...offer,
                  isRedeemed: true,
                  redeemedAt: new Date().toISOString(),
                }
              : offer
          )
        );

        // Update stats
        setStats(prev => ({
          ...prev,
          active: Math.max(0, prev.active - 1),
          redeemed: prev.redeemed + 1,
        }));

        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || "Failed to redeem offer" };
      }
    } catch (err) {
      console.error("Error redeeming offer:", err);
      return { success: false, error: "Failed to redeem offer" };
    }
  };

  // Initialize by fetching offers
  useEffect(() => {
    refreshOffers();
  }, [includeRedeemed, limit]);

  return {
    offers,
    stats,
    loading,
    error,
    totalCount,
    hasMore,
    refreshOffers,
    redeemOffer,
    loadMore,
  };
}

// Hook for getting a specific offer
export function useUserOffer(offerId: string) {
  const [offer, setOffer] = useState<UserOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!offerId) return;

    const fetchOffer = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/user/offers/${offerId}`);
        const data = await response.json();

        if (data.success) {
          setOffer(data.data);
        } else {
          setError(data.error || "Failed to fetch offer");
        }
      } catch (err) {
        setError("Failed to fetch offer");
        console.error("Error fetching offer:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId]);

  return { offer, loading, error };
}
