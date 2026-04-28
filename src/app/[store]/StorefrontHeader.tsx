"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, MapPin } from "lucide-react";
import { loadCart, cartLineCount, cartSubtotal } from "@/lib/cart";
import { formatZAR } from "@/lib/money";

type Props = {
  tenantSlug: string;
  storeName: string;
  categories: { name: string; slug: string }[];
};

export function StorefrontHeader({ tenantSlug, categories }: Props) {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => {
      const cart = loadCart(tenantSlug);
      setCartCount(cartLineCount(cart));
      setCartTotal(cartSubtotal(cart));
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cart-update", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cart-update", refresh);
    };
  }, [tenantSlug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchRef.current?.value.trim() ?? "";
    const base = `/${tenantSlug}/products`;
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (selectedCategory && selectedCategory !== "all")
      params.set("category", selectedCategory);
    router.push(`${base}?${params.toString()}`);
  };

  return (
    <header
      style={{
        background: "var(--sf-header-bg)",
        color: "var(--sf-header-fg)",
        padding: "10px 32px",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 20,
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left — logo */}
      <Link
        href={`/${tenantSlug}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            background: "var(--sf-accent)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display, var(--font-sans))",
            fontWeight: 900,
            fontSize: 16,
            color: "var(--sf-header-bg)",
            flexShrink: 0,
          }}
        >
          V
        </div>
        <span
          style={{
            fontFamily: "var(--font-display, var(--font-sans))",
            fontWeight: 800,
            fontSize: 16,
            color: "var(--sf-header-fg)",
            whiteSpace: "nowrap",
          }}
        >
          Vorna Valley
        </span>
        <span
          style={{
            fontFamily: "var(--font-display, var(--font-sans))",
            fontWeight: 800,
            fontSize: 16,
            color: "var(--sf-accent)",
          }}
        >
          {" "}Resale
        </span>
      </Link>

      {/* Centre — search composite */}
      <form
        onSubmit={handleSearch}
        style={{
          maxWidth: 680,
          justifySelf: "center",
          width: "100%",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            height: 44,
            background: "var(--sf-header-input-bg)",
            color: "var(--sf-header-fg)",
            border: "none",
            borderRight: "1px solid var(--sf-header-input-sep)",
            borderRadius: "8px 0 0 8px",
            fontSize: 13,
            padding: "0 12px",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            paddingRight: 24,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23FAFAF8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 6px center",
            flexShrink: 0,
          }}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search pre-owned items in Midrand…"
          style={{
            flex: 1,
            height: 44,
            background: "var(--sf-header-input-bg)",
            color: "var(--sf-header-fg)",
            border: "none",
            padding: "0 16px",
            fontSize: 13.5,
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          style={{
            height: 44,
            background: "var(--sf-accent)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "0 8px 8px 0",
            fontSize: 13,
            fontWeight: 700,
            padding: "0 18px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <Search size={14} strokeWidth={2.5} />
          Search
        </button>
      </form>

      {/* Right — actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexShrink: 0,
        }}
      >
        {/* Location chip */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            color: "color-mix(in srgb, var(--sf-header-fg) 70%, transparent)",
          }}
        >
          <MapPin size={14} />
          Midrand
        </span>

        {/* Sign in */}
        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 13,
            color: "var(--sf-header-fg)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <User size={14} />
          Sign in
        </button>

        {/* Cart pill */}
        <Link
          href={`/${tenantSlug}/cart`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "var(--sf-accent)",
            color: "#FFFFFF",
            padding: "8px 14px",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
            position: "relative",
          }}
        >
          <ShoppingCart size={14} />
          {cartCount > 0 && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {formatZAR(cartTotal)}
            </span>
          )}
          {cartCount === 0 && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
              R 0.00
            </span>
          )}
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "var(--sf-header-bg)",
                color: "var(--sf-header-fg)",
                borderRadius: 999,
                fontSize: 9,
                fontWeight: 800,
                minWidth: 16,
                height: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
