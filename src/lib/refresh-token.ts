/**
 * Client-side token refresh utility
 * Handles automatic token refresh when access token expires
 */

interface TokenRefreshResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Attempts to refresh the access token using the refresh token
 * @returns Promise<TokenRefreshResponse>
 */
export async function refreshToken(): Promise<TokenRefreshResponse> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Tokens refreshed successfully'
      };
    } else {
      // Clear auth cookies on failure
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      return {
        success: false,
        error: data.error || 'Failed to refresh tokens'
      };
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear auth cookies on error
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    return {
      success: false,
      error: 'Network error during token refresh'
    };
  }
}

/**
 * Checks if the access token is expired
 * @returns boolean indicating if token is expired
 */
export function isTokenExpired(): boolean {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token="))
    ?.split("=")[1];

  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}

export default {
  refreshToken,
  isTokenExpired
};