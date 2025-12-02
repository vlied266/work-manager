import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/studio",
  "/dashboard",
  "/manager",
  "/inbox",
  "/history",
  "/settings",
  "/run",
  "/onboarding",
  "/processes",
  "/flags",
  "/profile",
  "/notifications",
  "/admin",
];

const isProtected = (pathname: string) =>
  PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("workos_token");
  if (!token) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/studio/:path*",
    "/dashboard/:path*",
    "/manager/:path*",
    "/inbox/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/run/:path*",
    "/onboarding/:path*",
    "/processes/:path*",
    "/flags/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/admin/:path*",
  ],
};

