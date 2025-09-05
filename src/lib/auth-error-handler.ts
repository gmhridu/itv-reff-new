/**
 * Global authentication error handler
 * Provides consistent 401 error handling across the application
 */

export interface AuthErrorHandlerOptions {
  clearStorage?: boolean;
  redirectPath?: string;
}

/**
 * Handles 401 authentication errors consistently across the application
 * @param error - The error object or response
 * @param options - Configuration options for error handling
 */
export function handleAuthError(
  error: any, 
  options: AuthErrorHandlerOptions = {}
): void {
  const { clearStorage = true, redirectPath = '/' } = options;

  // Check if this is a 401 error
  const is401Error = 
    error?.status === 401 || 
    error?.response?.status === 401 ||
    (error instanceof Response && error.status === 401);

  if (!is401Error) {
    return;
  }

  // Only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  if (clearStorage) {
    // Clear authentication cookies
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear localStorage auth data
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('refresh_token');
    } catch (e) {
      // Ignore localStorage errors
    }

    // Clear sessionStorage auth data
    try {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
    } catch (e) {
      // Ignore sessionStorage errors
    }
  }

  // Instant redirect
  window.location.href = redirectPath;
}

/**
 * Enhanced fetch wrapper that automatically handles 401 errors
 * @param input - Request input
 * @param init - Request init options
 * @param authOptions - Authentication error handling options
 * @returns Promise<Response>
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  authOptions?: AuthErrorHandlerOptions
): Promise<Response> {
  try {
    const response = await fetch(input, init);
    
    // Handle 401 responses
    if (response.status === 401) {
      handleAuthError(response, authOptions);
      throw new Error('Authentication required');
    }
    
    return response;
  } catch (error) {
    // Handle network errors that might indicate auth issues
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // Don't auto-redirect on network errors, but let the caller handle it
      throw error;
    }
    
    // Handle other auth errors
    handleAuthError(error, authOptions);
    throw error;
  }
}

/**
 * Utility to check if an error is an authentication error
 * @param error - The error to check
 * @returns boolean indicating if this is a 401 error
 */
export function isAuthError(error: any): boolean {
  return (
    error?.status === 401 || 
    error?.response?.status === 401 ||
    (error instanceof Response && error.status === 401)
  );
}

/**
 * React hook-friendly error handler for authentication errors
 * Use this in useEffect or error boundaries
 * @param error - The error to handle
 * @param options - Configuration options
 */
export function useAuthErrorHandler(
  error: any, 
  options?: AuthErrorHandlerOptions
): void {
  if (error && isAuthError(error)) {
    handleAuthError(error, options);
  }
}
