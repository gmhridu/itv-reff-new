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
  const isAdminLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminLoginPage;
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
          new URL("/admin/login", req.url),
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
      const response = NextResponse.redirect(new URL("/admin/login", req.url));
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
        const targetUrl = redirectPath || "/admin/analytics";
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
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
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

  if (isAdminLoginPage && token) {
    try {
      const admin = await AdminMiddleware.authenticateAdmin(req);
      if (admin) {
        const redirectPath = req.cookies.get(
          "admin_redirect_after_login",
        )?.value;
        const targetUrl = redirectPath || "/admin/analytics";
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
