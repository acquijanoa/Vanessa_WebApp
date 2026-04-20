import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_SESSION_COOKIE, getAdminJwtSecretBytes } from "@/lib/admin-session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const secret = getAdminJwtSecretBytes();
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (pathname === "/admin/login") {
    if (token && secret) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL("/admin", req.url));
      } catch {
        /* show login */
      }
    }
    return NextResponse.next();
  }

  if (!secret) {
    return NextResponse.redirect(new URL("/admin/login?error=config", req.url));
  }

  if (!token) {
    const login = new URL("/admin/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const login = new URL("/admin/login", req.url);
    login.searchParams.set("next", pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete(ADMIN_SESSION_COOKIE);
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
