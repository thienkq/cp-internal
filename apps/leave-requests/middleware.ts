import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/error", "/auth/signin", "/auth/callback"];

  // NextAuth API routes - these must be public
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session token in cookies
  // With JWT strategy, NextAuth stores the JWT in __Secure-next-auth.session-token (secure)
  // or next-auth.session-token (non-secure) cookie
  const token = request.cookies.get("__Secure-next-auth.session-token")?.value ||
                request.cookies.get("next-auth.session-token")?.value;

  console.log("=== Middleware Check ===")
  console.log("Pathname:", pathname)
  console.log("All cookies:", Array.from(request.cookies.getAll()).map(c => `${c.name}=${c.value.substring(0, 20)}...`))
  console.log("Secure token:", request.cookies.get("__Secure-next-auth.session-token")?.value ? "EXISTS" : "MISSING")
  console.log("Non-secure token:", request.cookies.get("next-auth.session-token")?.value ? "EXISTS" : "MISSING")
  console.log("Token found:", !!token)

  if (!token) {
    // Redirect to login if not authenticated
    console.log("No token found, redirecting to login")
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  console.log("Token found, allowing request")

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
