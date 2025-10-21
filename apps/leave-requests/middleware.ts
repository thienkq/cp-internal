import { updateSession } from "@workspace/supabase";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  
  // Note: User sync to database is handled in server components/actions
  // Middleware runs in Edge Runtime which doesn't support database operations
  
  return response;
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
