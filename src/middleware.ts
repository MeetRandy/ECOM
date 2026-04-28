import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * Resolve tenant slug from host header and inject it for server components.
 * Protect admin and account routes behind authentication.
 */
export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const pathname = req.nextUrl.pathname;

  // Resolve tenant slug
  let slug: string | null = null;

  // Check x-tenant-slug already set (e.g. from a reverse proxy)
  slug = req.headers.get("x-tenant-slug");

  if (!slug) {
    // subdomain: slug.ecom.co.za → slug
    const parts = hostname.split(".");
    if (
      parts.length >= 3 ||
      (parts.length >= 2 && parts[0] !== "www" && parts[0] !== "localhost")
    ) {
      slug = parts[0] ?? null;
    }
  }

  if (!slug) {
    // Dev: fall back to query param or env
    slug =
      req.nextUrl.searchParams.get("tenant") ??
      req.cookies.get("tenant_slug")?.value ??
      process.env.DEV_TENANT_SLUG ??
      null;
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const session = await auth();
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect account routes
  if (pathname.startsWith("/account")) {
    const session = await auth();
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  if (slug) {
    res.headers.set("x-tenant-slug", slug);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
