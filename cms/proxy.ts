import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { canAccess, isPublicApi, isPublicPage } from "@/lib/permissions";

/**
 * The CMS's front door.
 *
 * Runs before any page renders or any API route executes, and decides one of
 * three things: let it through, send a guest to sign in, or tell a signed-in
 * user this is not for their role.
 *
 * It is the first lock, not the only one — pages and handlers check again (see
 * lib/session.ts). This is where a guest is turned away cheaply and before any
 * database is touched; those are where a mistake in the rules here cannot
 * quietly expose anything.
 *
 * Proxy was called Middleware before Next 16. It runs on the Node.js runtime by
 * default, which `jose` is happy on.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isPublicApi(pathname)) return NextResponse.next();

  const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (isPublicPage(pathname)) {
    // Someone already signed in has no business on the login form; showing it
    // to them reads as though their session was lost.
    return user
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (!user) {
    if (isApi) {
      return NextResponse.json(
        { success: false, message: "Sign in required" },
        { status: 401 }
      );
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  if (!canAccess(user.role, pathname)) {
    if (isApi) {
      return NextResponse.json(
        { success: false, message: "Admins only" },
        { status: 403 }
      );
    }
    const home = new URL("/", request.url);
    home.searchParams.set("denied", pathname);
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next's own build output. Without the exclusion a guest's
  // redirect to /login would also swallow the CSS and JS the login page needs.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
