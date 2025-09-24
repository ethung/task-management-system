import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/projects",
  "/tasks",
  "/profile",
  "/settings",
  "/api/projects",
  "/api/tasks",
  "/api/user",
];

// Define authentication routes that should redirect if already logged in
const authRoutes = ["/auth/login", "/auth/register"];

// Simple JWT verification for middleware
function verifyToken(token: string): boolean {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET not available in middleware");
      return false;
    }

    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
      issuer: "plannerproject",
      audience: "plannerproject-users",
    });

    return !!(
      payload &&
      typeof payload === "object" &&
      "type" in payload &&
      payload.type === "access"
    );
  } catch (error) {
    // Token verification failed
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  // Skip middleware entirely for homepage and public routes
  if (
    pathname === "/" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  let isAuthenticated = false;
  if (accessToken) {
    isAuthenticated = verifyToken(accessToken);
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Store the intended destination for redirect after login
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // For API routes that need authentication
  if (
    pathname.startsWith("/api/") &&
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
