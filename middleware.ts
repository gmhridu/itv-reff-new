import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AdminMiddleware } from "./src/lib/admin-middleware";
import { SecureTokenManager } from "./src/lib/token-manager";

async function handleTokenRefresh(
  req: NextRequest,
): Promise<NextResponse | null> {
  const refreshToken = req.cookies.get("refresh-token")?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(new URL("/api/auth/refresh", req.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh-token=${refreshToken}`,
      },
      credentials: "include",
    });

    if (response.ok) {
      const res = NextResponse.next({
        request: {
          headers: new Headers(req.headers),
        },
      });

      // Forward the Set-Cookie header from the API response
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        // Manually parse and set cookies because of Next.js limitations
        const cookies = setCookie.split(", ");
        for (const cookie of cookies) {
          res.headers.append("Set-Cookie", cookie);
        }
      }

      return res;
    }

    // If refresh fails, clear all auth cookies and return redirect response
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete("access_token");
    res.cookies.delete("refresh-token");
    return res;
  } catch (error) {
    console.error("Token refresh error:", error);
    // On any error during refresh, clear auth cookies and redirect to login
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete("access_token");
    res.cookies.delete("refresh-token");
    return res;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const pathname = req.nextUrl.pathname;

  const isAuthPage =
    pathname === "/" ||
    pathname === "/register" ||
    pathname === "/forgot-password";
  const isBannedPage = pathname === "/banned";
  const isAdminLoginPage = pathname === "/4brothers/admin/login";
  const isAdminRoute = pathname.startsWith("/4brothers/admin") && !isAdminLoginPage;
  const protectedPaths = [
    "/dashboard",
    "/settings",
    "/profile",
    "/plans",
    "/positions",
    "/referral",
    "/referrals",
    "/videos",
    "/wallet",
    "/withdraw",
  ];
  const isApiRoute = pathname.startsWith("/api/");
  const isAdminApiRoute =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/auth/getAdmin") ||
    pathname === "/api/auth/admin-test";

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );
  const isProtectedApiRoute =
    isApiRoute && !pathname.startsWith("/api/auth/") && !isAdminApiRoute;

  // Handle admin routes first - they should bypass regular user authentication
  if (isAdminRoute) {
    try {
      const admin = await AdminMiddleware.authenticateAdmin(req);
      if (!admin) {
        const response = NextResponse.redirect(
          new URL("/4brothers/admin/login", req.url),
        );
        response.cookies.set("admin_redirect_after_login", pathname, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
        return response;
      }
      return NextResponse.next();
    } catch (error) {
      console.error("Admin route protection error:", error);
      const response = NextResponse.redirect(new URL("/4brothers/admin/login", req.url));
      response.cookies.set("admin_redirect_after_login", pathname, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      return response;
    }
  }

  // Handle admin login page
  if (isAdminLoginPage && token) {
    try {
      const admin = await AdminMiddleware.authenticateAdmin(req);
      if (admin) {
        const redirectPath = req.cookies.get(
          "admin_redirect_after_login",
        )?.value;
        const targetUrl = redirectPath || "/4brothers/admin/analytics";
        const response = NextResponse.redirect(new URL(targetUrl, req.url));
        response.cookies.delete("admin_redirect_after_login");
        return response;
      }
    } catch (error) {
      console.error("Admin login page check error:", error);
    }
  }

  // Regular user authentication logic (only for non-admin routes)
  let userPayload: any = null;
  if (token) {
    userPayload = SecureTokenManager.verifyAccessToken(token);
  }

  // If token exists but is invalid/expired, try to refresh it for any page
  if (token && !userPayload) {
    const refreshResponse = await handleTokenRefresh(req);
    if (refreshResponse) {
      // If refresh is successful, continue with the refreshed request
      if (refreshResponse.status === 307) { // Redirect response
        return refreshResponse;
      }
      // If refresh is successful, the response has the new cookies.
      // We need to verify the new token and check if user is banned
      const newToken = refreshResponse.cookies.get("access_token")?.value;
      if (newToken) {
        const newPayload = SecureTokenManager.verifyAccessToken(newToken);
        if (newPayload) {
          const isBanned = await SecureTokenManager.isUserBanned(newPayload.userId);
          if (isBanned) {
            const response = NextResponse.redirect(new URL("/banned", req.url));
            response.cookies.delete("access_token");
            response.cookies.delete("refresh-token");
            return response;
          }
        }
      }
      // We rewrite this response to the original URL to continue the user's request.
      return NextResponse.rewrite(req.url);
    }

    // If refresh fails, redirect to login for any page
    const loginUrl = new URL("/", req.url);
    if (isProtectedRoute) {
      loginUrl.searchParams.set("redirect_after_login", pathname);
    }
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("access_token");
    res.cookies.delete("refresh-token");
    return res;
  }

  if (userPayload) {
    // Check if user is banned
    const isBanned = await SecureTokenManager.isUserBanned(userPayload.userId);
    if (isBanned) {
      // Clear all auth cookies for banned users
      const response = NextResponse.redirect(new URL("/banned", req.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh-token");
      return response;
    }

    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Enhanced check for banned users trying to access auth pages
  // This handles cases where banned users try to access login/register pages
  if (isAuthPage && token) {
    try {
      // Try to verify the token to check if user is banned
      const payload = SecureTokenManager.verifyAccessToken(token);
      if (payload) {
        const isBanned = await SecureTokenManager.isUserBanned(payload.userId);
        if (isBanned) {
          const response = NextResponse.redirect(new URL("/banned", req.url));
          response.cookies.delete("access_token");
          response.cookies.delete("refresh-token");
          return response;
        }
      }
    } catch (error) {
      console.error("Error checking banned status for auth page:", error);
    }
  }

  // Additional security: Check for banned users via refresh token on login page
  // This catches edge cases where access token might be expired but refresh token exists
  if (isAuthPage && !token) {
    const refreshToken = req.cookies.get("refresh-token")?.value;
    if (refreshToken) {
      try {
        const refreshPayload = SecureTokenManager.verifyRefreshToken(refreshToken);
        if (refreshPayload) {
          const isBanned = await SecureTokenManager.isUserBanned(refreshPayload.userId);
          if (isBanned) {
            const response = NextResponse.redirect(new URL("/banned", req.url));
            response.cookies.delete("access_token");
            response.cookies.delete("refresh-token");
            return response;
          }
        }
      } catch (error) {
        console.error("Error checking banned status via refresh token:", error);
      }
    }
  }

  if (isProtectedRoute || isProtectedApiRoute) {
    // If no token or refresh failed, redirect to login
    const loginUrl = new URL("/", req.url);
    if (isProtectedRoute) {
      loginUrl.searchParams.set("redirect_after_login", pathname);
    }
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("access_token");
    res.cookies.delete("refresh-token");

    if (isProtectedApiRoute) {
      // For API routes, we still want to return a 401 for client-side handling
      // but ensure the client redirects to login
      return NextResponse.json(
        { error: "Authentication required", redirect: "/" },
        { status: 401 },
      );
    }

    return res;
  }

  // Security check for banned page - ensure only banned users can access it
  if (isBannedPage && token) {
    try {
      const payload = SecureTokenManager.verifyAccessToken(token);
      if (payload) {
        const isBanned = await SecureTokenManager.isUserBanned(payload.userId);
        if (!isBanned) {
          // Non-banned user trying to access banned page, redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    } catch (error) {
      console.error("Error checking banned page access:", error);
    }
  }

  if (isAdminLoginPage && token) {
    try {
      const admin = await AdminMiddleware.authenticateAdmin(req);
      if (admin) {
        const redirectPath = req.cookies.get(
          "admin_redirect_after_login",
        )?.value;
        const targetUrl = redirectPath || "/4brothers/admin/analytics";
        const response = NextResponse.redirect(new URL(targetUrl, req.url));
        response.cookies.delete("admin_redirect_after_login");
        return response;
      }
    } catch (error) {
      console.error("Admin login page check error:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/register",
    "/forgot-password",
    "/banned",
    "/dashboard/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/plans/:path*",
    "/positions/:path*",
    "/referral/:path*",
    "/referrals/:path*",
    "/videos/:path*",
    "/wallet/:path*",
    "/withdraw/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
