import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tenants } from "@/db/schema/tenants";
import { storeSettings } from "@/db/schema/store";
import { products, variants, categories } from "@/db/schema/products";
import { notFound } from "next/navigation";
import { formatZAR } from "@/lib/money";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) notFound();

  const [settings] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.tenantId, tenant.id))
    .limit(1);

  // Featured products (with min price)
  const featuredRows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(
      and(
        eq(products.tenantId, tenant.id),
        eq(products.status, "active"),
        eq(products.featured, true),
      ),
    )
    .limit(8);

  const priceMap = new Map<string, string>();
  for (const p of featuredRows) {
    const [v] = await db
      .select({ price: variants.price })
      .from(variants)
      .where(eq(variants.productId, p.id))
      .orderBy(variants.price)
      .limit(1);
    if (v) priceMap.set(p.id, v.price);
  }

  // Categories with product counts
  const categoryRows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.tenantId, tenant.id))
    .orderBy(categories.displayOrder)
    .limit(6);

  const catCounts = new Map<string, number>();
  for (const c of categoryRows) {
    const [res] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          eq(products.categoryId, c.id),
          eq(products.status, "active"),
        ),
      );
    catCounts.set(c.id, res?.count ?? 0);
  }

  // Total active product count
  const [totalRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(
      and(eq(products.tenantId, tenant.id), eq(products.status, "active")),
    );
  const totalProductCount = totalRes?.count ?? 0;

  // Top deal — first featured product or highest-priced
  const topDeal = featuredRows[0] ?? null;
  const topDealPrice = topDeal ? Number(priceMap.get(topDeal.id) ?? 0) : 0;
  const topDealOldPrice =
    topDealPrice > 0 ? topDealPrice * 1.25 : 0;

  const storeName = settings?.storeName ?? slug;

  // Letter marks for categories
  const letterMark = (name: string) =>
    name.charAt(0).toUpperCase();

  return (
    <main style={{ background: "#FAFAF8" }}>
      {/* Hero section */}
      <section
        style={{
          padding: "24px 32px",
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 20,
        }}
      >
        {/* Left hero panel */}
        <div
          style={{
            borderRadius: 12,
            padding: "56px 56px 48px",
            background:
              "linear-gradient(110deg,#FFE4CC 0%, #FAFAF8 60%, #FFD9B8 100%)",
            border: "1px solid #F2E5D2",
            minHeight: 380,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Open pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#FFFFFF",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              alignSelf: "flex-start",
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
            Open now · 09–18
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display, var(--font-sans))",
              fontWeight: 800,
              fontSize: 60,
              lineHeight: 1,
              letterSpacing: "-0.025em",
              margin: "18px 0 0",
              maxWidth: 560,
              color: "#1A1A1A",
            }}
          >
            Find your next favourite thing.
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "#3A352D",
              margin: "18px 0 0",
              maxWidth: 480,
              lineHeight: 1.55,
            }}
          >
            Tested, priced, and on the floor in Vorna Valley. Browse the full
            catalogue or pop in — we take cash and card.
          </p>

          {/* CTA row */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 28,
              alignItems: "center",
            }}
          >
            <Link
              href={`/${slug}/products`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 48,
                padding: "0 22px",
                background: "#E85D04",
                color: "#FFFFFF",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Browse catalogue
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              style={{
                height: 48,
                padding: "0 22px",
                background: "transparent",
                border: "1px solid #1A1A1A",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#1A1A1A",
                cursor: "pointer",
              }}
            >
              Get a valuation
            </button>
          </div>
        </div>

        {/* Right column */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* Top deal card */}
          <div
            style={{
              borderRadius: 12,
              padding: 24,
              background: "#1A1A1A",
              color: "#FAFAF8",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Decorative circle */}
            <div
              style={{
                position: "absolute",
                right: -30,
                top: -20,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "rgba(232,93,4,0.18)",
                filter: "blur(8px)",
                pointerEvents: "none",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#E85D04",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Top deal
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display, var(--font-sans))",
                  fontWeight: 700,
                  fontSize: 22,
                  maxWidth: 240,
                  lineHeight: 1.25,
                  color: "#FAFAF8",
                }}
              >
                {topDeal ? topDeal.name : storeName + " Deals"}
              </div>
            </div>
            <div>
              {topDealOldPrice > 0 && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "rgba(250,250,248,0.5)",
                    textDecoration: "line-through",
                    marginBottom: 4,
                  }}
                >
                  {formatZAR(topDealOldPrice)}
                </div>
              )}
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#E85D04",
                }}
              >
                {topDealPrice > 0 ? formatZAR(topDealPrice) : "—"}
              </div>
            </div>
          </div>

          {/* How it works card */}
          <div
            style={{
              borderRadius: 12,
              padding: 24,
              background: "#FFFFFF",
              border: "1px solid #E8E8E4",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#FFE4CC",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#E85D04",
                  flexShrink: 0,
                }}
              >
                <Sparkles size={18} strokeWidth={2} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display, var(--font-sans))",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#1A1A1A",
                }}
              >
                How it works
              </span>
            </div>

            {/* Steps */}
            <ol
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {[
                "We test every item before listing",
                "Price it fairly, list it online & in store",
                "Reserve online, pick up in Midrand",
              ].map((text, i) => (
                <li
                  key={i}
                  style={{ fontSize: 13, color: "#3A352D", display: "flex", gap: 6 }}
                >
                  <span
                    style={{ color: "#E85D04", fontWeight: 700, flexShrink: 0 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {" "}{text}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      {categoryRows.length > 0 && (
        <section style={{ padding: "8px 32px 28px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 12,
            }}
          >
            {categoryRows.map((c, idx) => {
              const active = idx === 0;
              return (
                <Link
                  key={c.id}
                  href={`/${slug}/products?category=${c.slug}`}
                  style={{
                    background: "#FFFFFF",
                    border: active ? "1px solid #E85D04" : "1px solid #E8E8E4",
                    borderRadius: 10,
                    padding: "16px 14px",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  {/* Letter-mark chip */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: active ? "#E85D04" : "#F5F4F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display, var(--font-sans))",
                      fontWeight: 700,
                      fontSize: 14,
                      color: active ? "#FFFFFF" : "#5A554B",
                    }}
                  >
                    {letterMark(c.name)}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1A1A1A",
                      lineHeight: 1.3,
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "#7A7468",
                    }}
                  >
                    {catCounts.get(c.id) ?? 0} items
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Grid header */}
      <div
        style={{
          padding: "12px 32px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "baseline", gap: 14 }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display, var(--font-sans))",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              margin: 0,
              color: "#1A1A1A",
            }}
          >
            Just arrived
          </h2>
          <span style={{ fontSize: 13, color: "#7A7468" }}>
            Freshest stock from the floor
          </span>
        </div>
        <Link
          href={`/${slug}/products`}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#1A1A1A",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderBottom: "1px solid #1A1A1A",
            paddingBottom: 2,
          }}
        >
          View all {totalProductCount} products →
        </Link>
      </div>

      {/* Product grid */}
      {featuredRows.length > 0 ? (
        <div
          style={{
            padding: "18px 32px 56px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
          {featuredRows.map((p) => {
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
                {/* Image area */}
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
                        fontSize: 48,
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

                {/* Card body */}
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
      ) : (
        <div style={{ padding: "40px 32px 56px" }}>
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              background: "#F5F4F0",
              borderRadius: 12,
              color: "#7A7468",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: "#5A554B", marginBottom: 8 }}>
              No featured products yet
            </div>
            <Link
              href={`/${slug}/products`}
              style={{ color: "#E85D04", fontWeight: 600, textDecoration: "none" }}
            >
              Browse all products →
            </Link>
          </div>
        </div>
      )}

      {/* Trust strip */}
      <div
        style={{
          borderTop: "1px solid #E8E8E4",
          borderBottom: "1px solid #E8E8E4",
          background: "#FFFFFF",
          padding: "20px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
        }}
      >
        {[
          {
            title: "Tested before listing",
            sub: "Every item checked",
          },
          {
            title: "Pickup in Midrand",
            sub: "Reserve online, pay in store",
          },
          {
            title: "30-day exchange",
            sub: "No questions asked",
          },
          {
            title: "Cash for your stuff",
            sub: "Walk-in valuations",
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "#FFE4CC",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#E85D04",
                flexShrink: 0,
              }}
            >
              <Check size={16} strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  marginBottom: 2,
                }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: "#7A7468" }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
