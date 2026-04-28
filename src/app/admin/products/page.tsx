import { desc, eq, sql } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { products, variants, categories } from "@/db/schema/products";
import { formatZAR } from "@/lib/money";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "v-pill-green",
    draft: "",
    archived: "",
  };
  return (
    <span
      className={`v-pill ${map[status] ?? ""}`}
      style={{ fontSize: 10.5, textTransform: "capitalize" }}
    >
      {status}
    </span>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const tenantId = await requireTenantId();
  const { q } = await searchParams;

  const rows = await withTenant(tenantId, async (tx) => {
    const productRows = await tx
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        status: products.status,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(eq(products.tenantId, tenantId))
      .orderBy(desc(products.createdAt))
      .limit(200);

    const variantStats = await tx
      .select({
        productId: variants.productId,
        count: sql<number>`count(*)::int`,
        totalStock: sql<number>`sum(${variants.stockQty})::int`,
        minPrice: sql<string>`min(${variants.price})`,
        maxPrice: sql<string>`max(${variants.price})`,
      })
      .from(variants)
      .where(eq(variants.tenantId, tenantId))
      .groupBy(variants.productId);

    const varMap = new Map(variantStats.map((v) => [v.productId, v]));

    const categoryRows = await tx
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.tenantId, tenantId));
    const catMap = new Map(categoryRows.map((c) => [c.id, c.name]));

    return productRows
      .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
      .map((p) => ({
        ...p,
        variantCount: varMap.get(p.id)?.count ?? 0,
        totalStock: varMap.get(p.id)?.totalStock ?? 0,
        minPrice: varMap.get(p.id)?.minPrice ?? null,
        maxPrice: varMap.get(p.id)?.maxPrice ?? null,
        categoryName: p.categoryId ? (catMap.get(p.categoryId) ?? "—") : "—",
      }));
  });

  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 1,
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Products</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            {rows.length} product{rows.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <form method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products…"
            className="v-input"
            style={{ width: 200 }}
          />
        </form>
        <Link
          href="/admin/products/new"
          className="v-btn v-btn-primary"
          style={{ textDecoration: "none" }}
        >
          + New product
        </Link>
      </div>

      <div style={{ padding: 24 }}>
        <div className="v-card" style={{ overflow: "hidden", padding: 0 }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  color: "var(--ink-3)",
                  fontSize: 11,
                  textAlign: "left",
                }}
              >
                {["Product", "Category", "Variants", "Price", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 16px",
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--ink-4)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="v-tr"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "10px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "var(--radius)",
                          overflow: "hidden",
                          background: "var(--surface-3)",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            width={40}
                            height={40}
                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                          />
                        ) : (
                          <span style={{ fontSize: 18, color: "var(--ink-4)" }}>
                            📦
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/admin/products/${p.id}`}
                        style={{
                          fontWeight: 500,
                          color: "var(--ink)",
                          textDecoration: "none",
                        }}
                      >
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "var(--ink-3)",
                      fontSize: 12,
                    }}
                  >
                    {p.categoryName}
                  </td>
                  <td style={{ padding: "10px 16px", color: "var(--ink-3)" }}>
                    {p.totalStock}
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    {p.minPrice
                      ? p.minPrice === p.maxPrice
                        ? formatZAR(Number(p.minPrice))
                        : `${formatZAR(Number(p.minPrice))} – ${formatZAR(Number(p.maxPrice))}`
                      : "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: "var(--ink-4)",
                      fontSize: 12,
                    }}
                  >
                    {q
                      ? `No products matching "${q}".`
                      : "No products yet. Add your first product."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
