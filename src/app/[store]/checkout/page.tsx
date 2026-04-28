"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  loadCart,
  clearCart,
  cartSubtotal,
  cartLineCount,
  type Cart,
} from "@/lib/cart";
import { formatZAR, calcVat, round2 } from "@/lib/money";

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

const PAYMENT_METHODS = [
  { value: "payfast", label: "PayFast", description: "Credit/debit card, EFT, SnapScan" },
  { value: "yoco", label: "Yoco", description: "Card payment via Yoco" },
  { value: "eft", label: "EFT", description: "Direct bank transfer" },
];

export default function CheckoutPage() {
  const params = useParams<{ store: string }>();
  const tenantSlug = params.store;
  const router = useRouter();

  const [cart, setCart] = useState<Cart>({ lines: [], tenantSlug });
  const [mounted, setMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("payfast");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = loadCart(tenantSlug);
    setCart(c);
    setMounted(true);
  }, [tenantSlug]);

  const subtotal = cartSubtotal(cart);
  const { vat } = calcVat(subtotal);
  const total = round2(subtotal);
  const lineCount = cartLineCount(cart);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.lines.length === 0) return;
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      tenantSlug,
      customerName: fd.get("name") as string,
      customerEmail: fd.get("email") as string,
      customerPhone: fd.get("phone") as string,
      shippingAddress: {
        line1: fd.get("line1") as string,
        city: fd.get("city") as string,
        province: fd.get("province") as string,
        postalCode: fd.get("postalCode") as string,
        country: "ZA",
      },
      paymentMethod,
      lines: cart.lines.map((l) => ({
        variantId: l.variantId,
        productName: l.productName,
        variantName: l.variantName,
        sku: l.sku,
        quantity: l.quantity,
        unitPrice: String(l.price),
        lineTotal: String(round2(l.price * l.quantity)),
      })),
    };

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to place order. Please try again.");
      return;
    }

    const data = await res.json();
    clearCart(tenantSlug);
    window.dispatchEvent(new Event("cart-update"));
    router.push(`/${tenantSlug}/order-confirmed?order=${data.orderNumber}`);
  };

  if (!mounted) return null;

  if (lineCount === 0) {
    return (
      <main
        style={{
          maxWidth: 600,
          margin: "80px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Your cart is empty</h1>
        <Link
          href={`/${tenantSlug}/products`}
          className="v-btn v-btn-primary"
          style={{
            textDecoration: "none",
            marginTop: 20,
            display: "inline-flex",
          }}
        >
          Back to products
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: 28,
        }}
      >
        Checkout
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Left: forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Customer details */}
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
              Customer details
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="v-label" htmlFor="name">
                  Full name *
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="v-input"
                  style={{ height: 36 }}
                  placeholder="Jane Smith"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label className="v-label" htmlFor="email">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="v-input"
                    style={{ height: 36 }}
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="v-label" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="v-input"
                    style={{ height: 36 }}
                    placeholder="+27 12 345 6789"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping address */}
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
              Shipping address
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="v-label" htmlFor="line1">
                  Street address *
                </label>
                <input
                  id="line1"
                  name="line1"
                  required
                  className="v-input"
                  style={{ height: 36 }}
                  placeholder="123 Main Street"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label className="v-label" htmlFor="city">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    required
                    className="v-input"
                    style={{ height: 36 }}
                    placeholder="Cape Town"
                  />
                </div>
                <div>
                  <label className="v-label" htmlFor="postalCode">
                    Postal code *
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    required
                    className="v-input"
                    style={{ height: 36 }}
                    placeholder="8001"
                  />
                </div>
              </div>
              <div>
                <label className="v-label" htmlFor="province">
                  Province *
                </label>
                <select
                  id="province"
                  name="province"
                  required
                  className="v-select"
                >
                  <option value="">— Select province —</option>
                  {SA_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payment method */}
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
              Payment method
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PAYMENT_METHODS.map((m) => {
                const active = paymentMethod === m.value;
                return (
                  <label
                    key={m.value}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: "var(--radius)",
                      border: active
                        ? "2px solid var(--ink)"
                        : "1px solid var(--border-strong)",
                      cursor: "pointer",
                      background: active ? "var(--surface-2)" : "var(--surface)",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={active}
                      onChange={() => setPaymentMethod(m.value)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                        }}
                      >
                        {m.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-3)",
                          marginTop: 2,
                        }}
                      >
                        {m.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: order summary */}
        <div
          style={{
            position: "sticky",
            top: 80,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div className="v-card" style={{ padding: 20 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              Order summary ({lineCount} item{lineCount !== 1 ? "s" : ""})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cart.lines.map((line) => (
                <div
                  key={line.variantId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      color: "var(--ink-2)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {line.productName}
                    {line.variantName !== "Default"
                      ? ` – ${line.variantName}`
                      : ""}
                    {" "}×{line.quantity}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    {formatZAR(round2(line.price * line.quantity))}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border)",
                marginTop: 12,
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--ink-4)",
                }}
              >
                <span>VAT included (15%)</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {formatZAR(vat)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 15,
                  fontWeight: 700,
                  marginTop: 4,
                }}
              >
                <span>Total</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {formatZAR(total)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--danger-soft)",
                color: "var(--danger)",
                borderRadius: "var(--radius)",
                fontSize: 12.5,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="v-btn v-btn-primary"
            style={{
              height: 46,
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Placing order…" : `Place order · ${formatZAR(total)}`}
          </button>

          <p
            style={{
              fontSize: 11.5,
              color: "var(--ink-4)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            By placing your order, you agree to our terms of service. Your
            personal information is protected under POPIA.
          </p>
        </div>
      </form>
    </main>
  );
}
