import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";

const protectedPrefixes = ["/tasks", "/notes"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? "/tasks" : "/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/tasks/:path*", "/notes/:path*"],
};
