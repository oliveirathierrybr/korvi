import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/session";

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

const GUEST_ONLY_ROUTES = ["/login", "/cadastro"];
const PUBLIC_ROUTES = ["/esqueci-senha", "/redefinir-senha"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const authenticated = await hasValidSession(request);

  if (isGuestOnly) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isPublic) {
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
