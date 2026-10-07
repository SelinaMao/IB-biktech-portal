import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/config/session.config";

/**
 * Route guard (Next 16 `proxy` convention, formerly `middleware`) — presence
 * check only. The httpOnly access-token cookie can't be validated here
 * (that's the BFF's job on every API call); this exists so unauthenticated
 * users never see portal chrome and authenticated users skip the login
 * screen.
 */
export function proxy(request: NextRequest) {
  // Local UI development only — NEXT_PUBLIC_DEV_BYPASS_AUTH skips the guard.
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  // An oversized token is stored in chunks, so the first chunk counts as a session.
  const hasSession =
    request.cookies.has(ACCESS_TOKEN_COOKIE) ||
    request.cookies.has(`${ACCESS_TOKEN_COOKIE}.0`);
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";
  const isOtp = pathname === "/otp"
  const isSuccess = pathname === "/success"
  const isSetupPassword = pathname === "/setupPassword"
  const isForgotPassword = pathname === "/forgotPassword"
  const isPublicPage = isLoginPage || isSignupPage || isOtp || isSuccess || isSetupPassword || isForgotPassword ;

  if (!hasSession && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search =
      pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (hasSession && (isPublicPage || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the BFF (/api), Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
