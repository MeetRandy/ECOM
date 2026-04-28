import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tenants } from "@/db/schema/tenants";
import { storeSettings } from "@/db/schema/store";
import { categories } from "@/db/schema/products";
import { notFound } from "next/navigation";
import { StorefrontHeader } from "./StorefrontHeader";
import { StorefrontSubNav } from "./StorefrontSubNav";
import { StorefrontFooter } from "./StorefrontFooter";
import { getTheme } from "@/lib/themes";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) notFound();

  const [settings] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.tenantId, tenant.id))
    .limit(1);

  const categoryRows = await db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.tenantId, tenant.id))
    .orderBy(categories.displayOrder);

  const storeName = settings?.storeName ?? tenant.name;
  const theme = getTheme(settings?.theme);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        ...theme.vars,
      } as React.CSSProperties}
    >
      <StorefrontHeader
        tenantSlug={slug}
        storeName={storeName}
        categories={categoryRows}
      />
      <StorefrontSubNav tenantSlug={slug} categories={categoryRows} />
      <div style={{ flex: 1 }}>{children}</div>
      <StorefrontFooter
        storeName={storeName}
        address={settings?.address ?? ""}
        city={settings?.city ?? "Midrand"}
        province={settings?.province ?? "Gauteng"}
        postalCode={settings?.postalCode ?? ""}
        storePhone={settings?.storePhone ?? null}
        storeEmail={settings?.storeEmail ?? null}
      />
    </div>
  );
}
