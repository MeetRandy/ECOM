"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Props = {
  tenantSlug: string;
  categories: { name: string; slug: string }[];
};

function SubNavInner({ tenantSlug, categories }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const isProductsBase =
    pathname === `/${tenantSlug}/products` ||
    pathname === `/${tenantSlug}/products/`;

  const tabBase: React.CSSProperties = {
    padding: "14px 16px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    display: "inline-block",
    borderBottom: "2px solid transparent",
    color: "var(--sf-ink)",
    whiteSpace: "nowrap",
  };

  const activeTab: React.CSSProperties = {
    ...tabBase,
    color: "var(--sf-accent)",
    borderBottom: "2px solid var(--sf-accent)",
  };

  const allActive = isProductsBase && !categoryParam;

  return (
    <nav
      style={{
        background: "var(--sf-surface)",
        borderBottom: "1px solid var(--sf-line)",
        padding: "0 32px",
        display: "flex",
        gap: 0,
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      <Link
        href={`/${tenantSlug}/products`}
        style={allActive ? activeTab : tabBase}
      >
        All products
      </Link>
      {categories.map((c) => {
        const active = isProductsBase && categoryParam === c.slug;
        return (
          <Link
            key={c.slug}
            href={`/${tenantSlug}/products?category=${c.slug}`}
            style={active ? activeTab : tabBase}
          >
            {c.name}
          </Link>
        );
      })}
      <span style={{ ...tabBase, color: "var(--sf-ink)" }}>Sell to us</span>
    </nav>
  );
}

export function StorefrontSubNav(props: Props) {
  return (
    <Suspense
      fallback={
        <nav
          style={{
            background: "var(--sf-surface)",
            borderBottom: "1px solid var(--sf-line)",
            padding: "0 32px",
            height: 46,
          }}
        />
      }
    >
      <SubNavInner {...props} />
    </Suspense>
  );
}
