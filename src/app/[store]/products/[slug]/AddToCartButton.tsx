"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { formatZAR } from "@/lib/money";

type Variant = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQty: number;
  trackStock: boolean;
};

type Props = {
  tenantSlug: string;
  product: { id: string; name: string; imageUrl: string | null };
  variants: Variant[];
};

export function AddToCartButton({ tenantSlug, product, variants }: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id ?? "",
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedVariantId);
  const outOfStock =
    selected?.trackStock && (selected?.stockQty ?? 0) < qty;

  const handleAddToCart = () => {
    if (!selected) return;
    addToCart(tenantSlug, {
      variantId: selected.id,
      productId: product.id,
      productName: product.name,
      variantName: selected.name,
      sku: selected.sku,
      imageUrl: product.imageUrl,
      price: selected.price,
      compareAtPrice: selected.compareAtPrice,
      quantity: qty,
    });
    window.dispatchEvent(new Event("cart-update"));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Variant selector */}
      {variants.length > 1 && (
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--sf-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Variant
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {variants.map((v) => {
              const isActive = v.id === selectedVariantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: isActive
                      ? "2px solid var(--sf-accent)"
                      : "1px solid var(--sf-line)",
                    background: isActive ? "var(--sf-accent-soft)" : "var(--sf-surface)",
                    color: isActive ? "var(--sf-accent)" : "var(--sf-ink)",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    transition: "all .1s",
                  }}
                >
                  {v.name}
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      opacity: 0.75,
                    }}
                  >
                    {formatZAR(v.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity picker */}
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--sf-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}
        >
          Quantity
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            style={{
              width: 36,
              height: 36,
              border: "1px solid var(--sf-line)",
              borderRight: "none",
              borderRadius: "6px 0 0 6px",
              background: "var(--sf-surface)",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--sf-muted)",
            }}
          >
            −
          </button>
          <div
            style={{
              width: 52,
              height: 36,
              border: "1px solid var(--sf-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--sf-ink)",
            }}
          >
            {qty}
          </div>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            style={{
              width: 36,
              height: 36,
              border: "1px solid var(--sf-line)",
              borderLeft: "none",
              borderRadius: "0 6px 6px 0",
              background: "var(--sf-surface)",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--sf-muted)",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Add to cart button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!!outOfStock || !selected}
        style={{
          width: "100%",
          height: 52,
          background: added ? "var(--sf-success)" : outOfStock ? "var(--sf-line)" : "var(--sf-accent)",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 700,
          cursor: outOfStock || !selected ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "background 0.2s",
          opacity: outOfStock || !selected ? 0.6 : 1,
        }}
      >
        <ShoppingCart size={18} strokeWidth={2} />
        {added
          ? "✓ Added to cart"
          : outOfStock
          ? "Out of stock"
          : "Add to cart"}
      </button>

      {/* Ghost buy now */}
      <button
        type="button"
        style={{
          width: "100%",
          height: 48,
          background: "transparent",
          border: "1px solid var(--sf-ink)",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          color: "var(--sf-ink)",
          cursor: "pointer",
        }}
      >
        Buy now
      </button>
    </div>
  );
}
