import { headers } from "next/headers";
import { db } from "@/db/client";
import { tenants } from "@/db/schema/tenants";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function getTenantSlug(): Promise<string | null> {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  // Strip port
  const hostname = host.split(":")[0] ?? "";
  // For dev: read x-tenant-slug header injected by middleware
  const devSlug = hdrs.get("x-tenant-slug");
  if (devSlug) return devSlug;
  // subdomain: slug.ecom.co.za or slug.localhost
  const parts = hostname.split(".");
  if (parts.length >= 2 && parts[0] !== "www") return parts[0] ?? null;
  return null;
}

export async function requireTenantSlug(): Promise<string> {
  const slug = await getTenantSlug();
  if (!slug) throw new Error("Tenant not resolved");
  return slug;
}

/**
 * Resolves the current user's tenantId from their session.
 * Use in admin routes where the slug may not be in the URL.
 */
export async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("No tenantId in session");
  }
  return session.user.tenantId;
}

/**
 * Resolves a tenantId from a slug. Throws if not found.
 */
export async function getTenantIdFromSlug(slug: string): Promise<string> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  if (!tenant) throw new Error(`Tenant not found: ${slug}`);
  return tenant.id;
}
