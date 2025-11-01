import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AdminMiddleware } from "./src/lib/admin-middleware";
import { SecureTokenManager } from "./src/lib/token-manager";

// 🔁 Handle token refresh
async function handleTokenRefresh(req: NextRequest): Promise<NextResponse | null> {
  const refreshToken = req.cookies.get("refresh-token")?.value;
  if (!refreshToken) return null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const { accessToken, newRefreshToken } = await response.json();

    // ✅ Create a new response and set cookies manually
    const res = NextResponse.next();
    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    if (newRefreshToken) {
      res.cookies.set("refresh-token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    }

    return res;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
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

  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));
  const isProtectedApiRoute =
    isApiRoute && !pathname.startsWith("/api/auth/") && !isAdminApiRoute;

  // 🧭 Admin routes
  if (isAdminRoute) {
    try {
      const admin = await AdminMiddleware.authenticateAdmin(req);
      if (!admin) {
        const response = NextResponse.redirect(new URL("/4brothers/admin/login", req.url));
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

  // 🧩 Admin login page
  if (isAdminLoginPage && token) {
    try {
      const admin = await AdminMiddleware.authenticateAdmin(req);
      if (admin) {
        const redirectPath = req.cookies.get("admin_redirect_after_login")?.value;
        const targetUrl = redirectPath || "/4brothers/admin/analytics";
        const response = NextResponse.redirect(new URL(targetUrl, req.url));
        response.cookies.delete("admin_redirect_after_login");
        return response;
      }
    } catch (error) {
      console.error("Admin login page check error:", error);
    }
  }

  // 🧍 Regular user authentication
  let userPayload: any = undefined;
  if (token) {
    try {
      userPayload = SecureTokenManager.verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") userPayload = null; // signal expired
      else userPayload = undefined; // invalid
    }
  }

  // 🔄 Try refresh if token expired
  if (token && userPayload === null) {
    const refreshResponse = await handleTokenRefresh(req);

    if (!refreshResponse) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.delete("access_token");
      res.cookies.delete("refresh-token");
      return res;
    }

    // ✅ Successfully refreshed, allow next middleware / route
    return refreshResponse;
  }

  // 🚪 Token invalid — redirect to login
  if (token && userPayload === undefined) {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete("access_token");
    res.cookies.delete("refresh-token");
    return res;
  }

  // ✅ Valid token → check banned status
  if (userPayload) {
    const isBanned = await SecureTokenManager.isUserBanned(userPayload.userId);
    if (isBanned) {
      const res = NextResponse.redirect(new URL("/banned", req.url));
      res.cookies.delete("access_token");
      res.cookies.delete("refresh-token");
      return res;
    }

    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // 🧭 Handle unauthenticated users trying to access protected routes
  if (isProtectedRoute || isProtectedApiRoute) {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete("access_token");
    res.cookies.delete("refresh-token");

    if (isProtectedApiRoute) {
      return NextResponse.json(
        { error: "Authentication required", redirect: "/" },
        { status: 401 }
      );
    }
    return res;
  }

  // 🛡️ Handle banned page (only banned users allowed)
  if (isBannedPage && token) {
    try {
      const payload = SecureTokenManager.verifyAccessToken(token);
      if (payload) {
        const isBanned = await SecureTokenManager.isUserBanned(payload.userId);
        if (!isBanned) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    } catch (error) {
      console.error("Error checking banned page access:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/register",
    "/forgot-password",
    "/",
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
    "/4brothers/admin/:path*",
    "/api/:path*",
  ],
};
