import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tenants } from "@/db/schema/tenants";
import { products, variants, categories } from "@/db/schema/products";
import { notFound } from "next/navigation";
import { formatZAR } from "@/lib/money";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "./AddToCartButton";
import { ProductTabs } from "./ProductTabs";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ store: string; slug: string }>;
}) {
  const { store: storeSlug, slug: productSlug } = await params;

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, storeSlug))
    .limit(1);

  if (!tenant) notFound();

  const [product] = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.tenantId, tenant.id),
        eq(products.slug, productSlug),
        eq(products.status, "active"),
      ),
    )
    .limit(1);

  if (!product) notFound();

  const variantRows = await db
    .select()
    .from(variants)
    .where(eq(variants.productId, product.id))
    .orderBy(variants.price);

  let categoryName: string | null = null;
  if (product.categoryId) {
    const [cat] = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, product.categoryId))
      .limit(1);
    categoryName = cat?.name ?? null;
  }

  const defaultVariant = variantRows[0];
  const defaultPrice = defaultVariant ? Number(defaultVariant.price) : 0;

  // Collect images: primary + extras
  const allImages = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...(product.images ?? []).filter((img) => img !== product.imageUrl),
  ];
  const thumbs = allImages.slice(0, 4);
  while (thumbs.length < 4 && allImages.length > 0) {
    thumbs.push(allImages[0]);
  }

  return (
    <main style={{ background: "#FAFAF8", minHeight: "60vh" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 32px",
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 48,
          alignItems: "start",
        }}
      >
        {/* Left — images */}
        <div>
          {/* Main image */}
          <div
            style={{
              borderRadius: 8,
              overflow: "hidden",
              background: "#F5F4F0",
              aspectRatio: "1/1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={600}
                height={600}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
                priority
              />
            ) : (
              <div
                style={{
                  fontSize: 80,
                  color: "#C8C5BE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                □
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          <div
            style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
          >
            {thumbs.map((img, i) => (
              <div
                key={i}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 6,
                  overflow: "hidden",
                  border: i === 0 ? "2px solid #E85D04" : "1px solid #E8E8E4",
                  background: "#F5F4F0",
                  flexShrink: 0,
                }}
              >
                <Image
                  src={img}
                  alt={`${product.name} view ${i + 1}`}
                  width={60}
                  height={60}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right — details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Category eyebrow */}
          {categoryName && (
            <div
              style={{
                fontSize: 11,
                color: "#7A7468",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {categoryName}
            </div>
          )}

          {/* Product name */}
          <h1
            style={{
              fontFamily: "var(--font-display, var(--font-sans))",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              margin: "0",
              color: "#1A1A1A",
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </h1>

          {/* Price row */}
          {defaultVariant && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#1A1A1A",
                }}
              >
                {formatZAR(defaultPrice)}
              </span>
              <span
                style={{
                  background: "#FFE4CC",
                  color: "#E85D04",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 4,
                  letterSpacing: "0.04em",
                }}
              >
                Tested
              </span>
            </div>
          )}

          {/* Stock indicator */}
          {(() => {
            const totalStock = variantRows.reduce((s, v) => s + v.stockQty, 0);
            return totalStock > 0 ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5A8E4A" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5A8E4A", display: "inline-block" }} />
                In stock
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#B0492A" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#B0492A", display: "inline-block" }} />
                Sold out
              </div>
            );
          })()}

          {/* Description (short preview) */}
          {product.description && (
            <p
              style={{
                fontSize: 14,
                color: "#3A352D",
                lineHeight: 1.6,
                marginTop: 0,
                marginBottom: 0,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.description}
            </p>
          )}

          {/* Divider */}
          <div style={{ borderTop: "1px solid #E8E8E4" }} />

          {/* Add to cart */}
          {variantRows.reduce((s, v) => s + v.stockQty, 0) > 0 ? (
            <AddToCartButton
              tenantSlug={storeSlug}
              product={{
                id: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
              }}
              variants={variantRows.map((v) => ({
                id: v.id,
                name: v.name,
                sku: v.sku,
                price: Number(v.price),
                compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
                stockQty: v.stockQty,
                trackStock: v.trackStock,
              }))}
            />
          ) : (
            <button disabled style={{ width: "100%", padding: "14px", background: "#E8E8E4", color: "#9A958E", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "not-allowed" }}>
              Sold Out
            </button>
          )}

          {/* Trust microcopy */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginTop: 4,
            }}
          >
            {[
              "✓ Tested before listing",
              "✓ 30-day exchange · No questions asked",
              "✓ Pickup in Midrand · Reserve online",
            ].map((line) => (
              <div
                key={line}
                style={{ fontSize: 12, color: "#5A554B" }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 56px" }}>
        <ProductTabs
          description={product.description ?? ""}
          specs={[
            { key: "SKU", value: variantRows[0]?.sku ?? "—" },
            { key: "Condition", value: "Pre-owned · Tested" },
            { key: "Category", value: categoryName ?? "—" },
            ...(variantRows.length > 1
              ? variantRows.map((v) => ({
                  key: v.name,
                  value: formatZAR(Number(v.price)),
                }))
              : []),
          ]}
        />
      </div>
    </main>
  );
}
