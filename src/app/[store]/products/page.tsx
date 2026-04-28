import { and, eq, exists, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tenants } from "@/db/schema/tenants";
import { products, variants, categories } from "@/db/schema/products";
import { notFound } from "next/navigation";
import { formatZAR } from "@/lib/money";
import Link from "next/link";
import Image from "next/image";

export default async function ProductCataloguePage({
  params,
  searchParams,
}: {
  params: Promise<{ store: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { store: slug } = await params;
  const { category: categorySlug, q } = await searchParams;

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) notFound();

  const categoryRows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.tenantId, tenant.id))
    .orderBy(categories.displayOrder);

  let activeCategoryId: string | undefined;
  if (categorySlug) {
    const found = categoryRows.find((c) => c.slug === categorySlug);
    activeCategoryId = found?.id;
  }

  const baseConditions = [
    eq(products.tenantId, tenant.id),
    eq(products.status, "active"),
    exists(
      db.select({ one: sql`1` }).from(variants).where(
        and(eq(variants.productId, products.id), sql`${variants.stockQty} > 0`)
      )
    ),
    ...(activeCategoryId ? [eq(products.categoryId, activeCategoryId)] : []),
  ];

  let productRows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(and(...baseConditions))
    .orderBy(products.name)
    .limit(100);

  if (q) {
    productRows = productRows.filter((p) =>
      p.name.toLowerCase().includes(q.toLowerCase()),
    );
  }

  const priceMap = new Map<string, string>();
  for (const p of productRows) {
    const [v] = await db
      .select({ price: variants.price })
      .from(variants)
      .where(eq(variants.productId, p.id))
      .orderBy(variants.price)
      .limit(1);
    if (v) priceMap.set(p.id, v.price);
  }

  const activeCategory = categorySlug
    ? categoryRows.find((c) => c.slug === categorySlug)
    : null;

  const sidebarLinkBase: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    color: "#5A554B",
    textDecoration: "none",
    padding: "6px 0 6px 12px",
    paddingLeft: 12,
    borderLeft: "2px solid transparent",
  };

  const sidebarLinkActive: React.CSSProperties = {
    ...sidebarLinkBase,
    color: "#1A1A1A",
    fontWeight: 600,
    borderLeft: "2px solid #E85D04",
    paddingLeft: 10,
  };

  return (
    <main style={{ background: "#FAFAF8" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 32,
          padding: "32px 32px",
          alignItems: "start",
        }}
      >
        {/* Sidebar */}
        <aside>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1A1A1A",
              marginBottom: 12,
            }}
          >
            Categories
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Link
              href={`/${slug}/products`}
              style={!categorySlug ? sidebarLinkActive : sidebarLinkBase}
            >
              All products
            </Link>
            {categoryRows.map((c) => (
              <Link
                key={c.id}
                href={`/${slug}/products?category=${c.slug}`}
                style={
                  c.slug === categorySlug
                    ? sidebarLinkActive
                    : sidebarLinkBase
                }
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div>
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <h1
                style={{
                  fontFamily: "var(--font-display, var(--font-sans))",
                  fontSize: 22,
                  fontWeight: 800,
                  margin: 0,
                  color: "#1A1A1A",
                }}
              >
                {activeCategory ? activeCategory.name : "All products"}
              </h1>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "#7A7468",
                }}
              >
                · {productRows.length} results
              </span>
            </div>
            <form method="GET" style={{ display: "flex" }}>
              {categorySlug && (
                <input type="hidden" name="category" value={categorySlug} />
              )}
              <input
                name="q"
                defaultValue={q}
                placeholder="Search…"
                style={{
                  height: 36,
                  padding: "0 12px",
                  border: "1px solid #E8E8E4",
                  borderRadius: 6,
                  background: "#FFFFFF",
                  fontSize: 13,
                  color: "#1A1A1A",
                  outline: "none",
                  width: 200,
                }}
              />
            </form>
          </div>

          {productRows.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 24px",
                background: "#F5F4F0",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#5A554B",
                  marginBottom: 12,
                }}
              >
                No products found
              </div>
              <Link
                href={`/${slug}/products`}
                style={{
                  fontSize: 13,
                  color: "#E85D04",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Reset filters
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 14,
              }}
            >
              {productRows.map((p) => {
                const price = priceMap.has(p.id)
                  ? Number(priceMap.get(p.id))
                  : null;
                return (
                  <div
                    key={p.id}
                    className="vv-card-hover"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #ECEAE3",
                      borderRadius: 10,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        aspectRatio: "1/1",
                        background: "#F5F4F0",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          width={300}
                          height={300}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#C8C5BE",
                            fontSize: 40,
                          }}
                        >
                          □
                        </div>
                      )}
                      {/* Add + pill */}
                      <Link
                        href={`/${slug}/products/${p.slug}`}
                        style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          height: 30,
                          padding: "0 12px",
                          borderRadius: 999,
                          background: "#FAFAF8",
                          border: "1px solid #E8E8E4",
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#1A1A1A",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          boxShadow: "0 2px 6px rgba(20,15,5,.06)",
                          textDecoration: "none",
                        }}
                      >
                        Add{" "}
                        <span
                          style={{
                            color: "#E85D04",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                          }}
                        >
                          +
                        </span>
                      </Link>
                    </div>

                    <Link
                      href={`/${slug}/products/${p.slug}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          padding: "12px 14px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13.5,
                            lineHeight: 1.35,
                            fontWeight: 500,
                            color: "#1A1A1A",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: 36,
                          }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#1A1A1A",
                            }}
                          >
                            {price !== null ? formatZAR(price) : "—"}
                          </span>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              color: "#5A8E4A",
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#5A8E4A",
                                display: "inline-block",
                              }}
                            />
                            In stock
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
