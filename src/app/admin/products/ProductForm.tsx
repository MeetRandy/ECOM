"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slugify";
import type { Product, Variant, Category } from "@/db/schema/products";

export type VariantRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  stockQty: string;
  trackStock: boolean;
};

type Props = {
  product?: Product & { variants: Variant[] };
  categories: Pick<Category, "id" | "name">[];
  onSave: (data: ProductFormData) => Promise<{ error?: string }>;
};

export type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  status: string;
  featured: boolean;
  imageUrl: string;
  variants: VariantRow[];
};

function newVariantRow(id: string): VariantRow {
  return {
    id,
    name: "Default",
    sku: "",
    barcode: "",
    price: "",
    compareAtPrice: "",
    cost: "",
    stockQty: "0",
    trackStock: true,
  };
}

export function ProductForm({ product, categories, onSave }: Props) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!product);
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    product?.variants.length
      ? product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku ?? "",
          barcode: v.barcode ?? "",
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? "",
          cost: v.cost ?? "",
          stockQty: String(v.stockQty),
          trackStock: v.trackStock,
        }))
      : [newVariantRow("new-1")],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const updateVariant = useCallback(
    (id: string, field: keyof VariantRow, value: string | boolean) => {
      setVariantRows((rows) =>
        rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
      );
    },
    [],
  );

  const addVariant = () => {
    setVariantRows((rows) => [
      ...rows,
      newVariantRow(`new-${Date.now()}`),
    ]);
  };

  const removeVariant = (id: string) => {
    setVariantRows((rows) => rows.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await onSave({
      name,
      slug,
      description,
      categoryId,
      status,
      featured,
      imageUrl,
      variants: variantRows,
    });
    setSaving(false);
    if (result.error) setError(result.error);
  };

  const colWidths = [32, 160, 100, 110, 90, 90, 80, 80, 80];

  return (
    <div style={{ background: "var(--surface-2)", minHeight: "100vh" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          <Link
            href="/admin/products"
            style={{ color: "var(--ink-3)", textDecoration: "none" }}
          >
            Products
          </Link>
          <span>/</span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>
            {product ? name || "Edit product" : "New product"}
          </span>
        </div>

        <span
          className={`v-pill ${status === "active" ? "v-pill-green" : status === "archived" ? "" : "v-pill-amber"}`}
          style={{ fontSize: 10.5 }}
        >
          {status}
        </span>

        <div style={{ flex: 1 }} />

        {error && (
          <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>
        )}

        <Link
          href="/admin/products"
          className="v-btn"
          style={{ textDecoration: "none" }}
        >
          Discard
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="v-btn v-btn-primary"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 20,
          padding: 24,
          maxWidth: 1200,
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Basics */}
          <div className="v-card" style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid var(--border)",
              }}
            >
              Basics
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <label className="v-label">Product name</label>
                <input
                  className="v-input"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Classic T-Shirt"
                  style={{ height: 36 }}
                />
              </div>
              <div>
                <label className="v-label">Slug (URL)</label>
                <input
                  className="v-input"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugEdited(true);
                  }}
                  placeholder="classic-t-shirt"
                  style={{ height: 36 }}
                />
              </div>
              <div>
                <label className="v-label">Description</label>
                <textarea
                  className="v-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product…"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="v-card" style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid var(--border)",
              }}
            >
              Images
            </div>
            <div>
              <label className="v-label">Primary image URL</label>
              <input
                className="v-input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                style={{ height: 36 }}
              />
            </div>
            {imageUrl && (
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 80px)",
                  gap: 8,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Product"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                  }}
                />
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="v-card" style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Variants</span>
              <button
                type="button"
                onClick={addVariant}
                className="v-btn v-btn-sm"
              >
                + Add variant
              </button>
            </div>

            {/* Variant header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: colWidths.map((w) => `${w}px`).join(" "),
                gap: 6,
                marginBottom: 6,
                alignItems: "center",
              }}
            >
              {["", "Name", "SKU", "Barcode", "Price (ZAR)", "Compare at", "Cost", "Stock", ""].map(
                (h, i) => (
                  <div
                    key={i}
                    className="v-eyebrow"
                    style={{ padding: "0 4px", overflow: "hidden" }}
                  >
                    {h}
                  </div>
                ),
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {variantRows.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: colWidths
                      .map((w) => `${w}px`)
                      .join(" "),
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  {/* Drag handle placeholder */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      color: "var(--ink-4)",
                    }}
                  >
                    ⋮⋮
                  </div>
                  <input
                    className="v-input"
                    value={v.name}
                    onChange={(e) =>
                      updateVariant(v.id, "name", e.target.value)
                    }
                    placeholder="Default"
                  />
                  <input
                    className="v-input"
                    value={v.sku}
                    onChange={(e) =>
                      updateVariant(v.id, "sku", e.target.value)
                    }
                    placeholder="SKU"
                  />
                  <input
                    className="v-input"
                    value={v.barcode}
                    onChange={(e) =>
                      updateVariant(v.id, "barcode", e.target.value)
                    }
                    placeholder="Barcode"
                  />
                  <input
                    className="v-input v-tnum"
                    value={v.price}
                    onChange={(e) =>
                      updateVariant(v.id, "price", e.target.value)
                    }
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  <input
                    className="v-input v-tnum"
                    value={v.compareAtPrice}
                    onChange={(e) =>
                      updateVariant(v.id, "compareAtPrice", e.target.value)
                    }
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="—"
                  />
                  <input
                    className="v-input v-tnum"
                    value={v.cost}
                    onChange={(e) =>
                      updateVariant(v.id, "cost", e.target.value)
                    }
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="—"
                  />
                  <input
                    className="v-input v-tnum"
                    value={v.stockQty}
                    onChange={(e) =>
                      updateVariant(v.id, "stockQty", e.target.value)
                    }
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "var(--ink-4)",
                      cursor: "pointer",
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                    title="Remove variant"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <p
              style={{
                marginTop: 10,
                fontSize: 11.5,
                color: "var(--ink-4)",
              }}
            >
              All prices are VAT-inclusive (15% VAT).
            </p>
          </div>
        </div>

        {/* Right sidebar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            position: "sticky",
            top: 60,
            alignSelf: "start",
          }}
        >
          {/* Status */}
          <div className="v-card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 10,
                color: "var(--ink)",
              }}
            >
              Status
            </div>
            <select
              className="v-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "active" | "archived")}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Visibility */}
          <div className="v-card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 12,
                color: "var(--ink)",
              }}
            >
              Visibility
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 12.5,
              }}
            >
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured product
            </label>
          </div>

          {/* Category */}
          <div className="v-card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 10,
                color: "var(--ink)",
              }}
            >
              Category
            </div>
            <select
              className="v-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* VAT info */}
          <div
            className="v-card"
            style={{ padding: 16, background: "var(--accent-soft)" }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--accent-ink)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              VAT Note
            </div>
            <p style={{ fontSize: 11.5, color: "var(--accent-ink)", margin: 0, lineHeight: 1.5 }}>
              Prices are entered VAT-inclusive. The system automatically
              calculates 15% VAT on checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
