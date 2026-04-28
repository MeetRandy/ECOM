"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ShoppingCart, X } from "lucide-react";
import {
  loadCart,
  updateQuantity,
  cartSubtotal,
  cartLineCount,
  type Cart,
} from "@/lib/cart";
import { formatZAR } from "@/lib/money";

export default function CartPage() {
  const params = useParams<{ store: string }>();
  const tenantSlug = params.store;
  const [cart, setCart] = useState<Cart>({ lines: [], tenantSlug });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(loadCart(tenantSlug));
    setMounted(true);
  }, [tenantSlug]);

  const handleQtyChange = (variantId: string, qty: number) => {
    const updated = updateQuantity(tenantSlug, variantId, qty);
    setCart({ ...updated });
    window.dispatchEvent(new Event("cart-update"));
  };

  const subtotal = cartSubtotal(cart);
  const vat = subtotal * 0.15;
  const total = subtotal + vat;
  const lineCount = cartLineCount(cart);

  if (!mounted) return null;

  return (
    <main style={{ background: "#FAFAF8", minHeight: "60vh" }}>
      <div style={{ padding: "32px" }}>
        {/* Heading */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display, var(--font-sans))",
              fontSize: 28,
              fontWeight: 800,
              color: "#1A1A1A",
              margin: 0,
            }}
          >
            Your cart
          </h1>
          {lineCount > 0 && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "#7A7468",
              }}
            >
              ({lineCount} {lineCount === 1 ? "item" : "items"})
            </span>
          )}
        </div>

        {cart.lines.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 24px",
              textAlign: "center",
            }}
          >
            <ShoppingCart size={48} color="#E8E8E4" strokeWidth={1.5} />
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#1A1A1A",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              Your cart&apos;s empty
            </div>
            <p style={{ fontSize: 14, color: "#7A7468", marginBottom: 24 }}>
              Looks like you haven&apos;t added anything yet.
            </p>
            <Link
              href={`/${tenantSlug}/products`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 44,
                padding: "0 22px",
                background: "#E85D04",
                color: "#FFFFFF",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: 32,
              alignItems: "start",
            }}
          >
            {/* Line items */}
            <div>
              {cart.lines.map((line, i) => (
                <div
                  key={line.variantId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    borderBottom: "1px solid #E8E8E4",
                    paddingBottom: 16,
                    marginBottom: 16,
                    minHeight: 96,
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "#F5F4F0",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt={line.productName}
                        width={80}
                        height={80}
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 28, color: "#C8C5BE" }}>□</span>
                    )}
                  </div>

                  {/* Name + variant */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#1A1A1A",
                        marginBottom: 2,
                      }}
                    >
                      {line.productName}
                    </div>
                    {line.variantName && line.variantName !== "Default" && (
                      <div style={{ fontSize: 12, color: "#7A7468" }}>
                        {line.variantName}
                      </div>
                    )}
                  </div>

                  {/* Qty controls */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                      flexShrink: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleQtyChange(line.variantId, line.quantity - 1)
                      }
                      style={{
                        width: 28,
                        height: 28,
                        border: "1px solid #E8E8E4",
                        borderRight: "none",
                        borderRadius: "4px 0 0 4px",
                        background: "#FFFFFF",
                        cursor: "pointer",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#5A554B",
                      }}
                    >
                      −
                    </button>
                    <div
                      style={{
                        width: 36,
                        height: 28,
                        border: "1px solid #E8E8E4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1A1A1A",
                      }}
                    >
                      {line.quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleQtyChange(line.variantId, line.quantity + 1)
                      }
                      style={{
                        width: 28,
                        height: 28,
                        border: "1px solid #E8E8E4",
                        borderLeft: "none",
                        borderRadius: "0 4px 4px 0",
                        background: "#FFFFFF",
                        cursor: "pointer",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#5A554B",
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Line price */}
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1A1A1A",
                      flexShrink: 0,
                      minWidth: 80,
                      textAlign: "right",
                    }}
                  >
                    {formatZAR(line.price * line.quantity)}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleQtyChange(line.variantId, 0)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#7A7468",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    title="Remove item"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E8E4",
                borderRadius: 8,
                padding: 24,
                position: "sticky",
                top: 80,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1A1A",
                  marginBottom: 16,
                }}
              >
                Order Summary
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Subtotal */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#5A554B" }}>Subtotal (incl. VAT)</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 500,
                      color: "#1A1A1A",
                    }}
                  >
                    {formatZAR(subtotal)}
                  </span>
                </div>

                {/* VAT */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#7A7468" }}>VAT (15%)</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "#7A7468",
                    }}
                  >
                    {formatZAR(vat)}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #E8E8E4", margin: "4px 0" }} />

                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: "#1A1A1A" }}>Total</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "#1A1A1A",
                    }}
                  >
                    {formatZAR(total)}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/${tenantSlug}/checkout`}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 20,
                  height: 48,
                  background: "#E85D04",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  textAlign: "center",
                  lineHeight: "48px",
                }}
              >
                Proceed to checkout →
              </Link>

              {/* Trust microcopy */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
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
        )}
      </div>
    </main>
  );
}
