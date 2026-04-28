"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "./actions";

type Props = { tenantName: string; userName: string; userRole: string };

function Svg({ children, size = 15 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <Svg>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Svg>
  ),
  orders: (
    <Svg>
      <path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3l-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </Svg>
  ),
  customers: (
    <Svg>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7" />
    </Svg>
  ),
  products: (
    <Svg>
      <path d="m3 7 9-4 9 4-9 4-9-4Z" />
      <path d="M3 7v10l9 4 9-4V7M12 11v10" />
    </Svg>
  ),
  categories: (
    <Svg>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </Svg>
  ),
  promos: (
    <Svg>
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </Svg>
  ),
  store: (
    <Svg>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20" />
    </Svg>
  ),
  palette: (
    <Svg>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </Svg>
  ),
  logout: (
    <Svg size={13}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </Svg>
  ),
  external: (
    <Svg size={11}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
    </Svg>
  ),
};

const NAV = [
  {
    group: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", exact: true }],
  },
  {
    group: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/categories", label: "Categories", icon: "categories" },
    ],
  },
  {
    group: "Marketing",
    items: [{ href: "/admin/promos", label: "Promo codes", icon: "promos" }],
  },
  {
    group: "Settings",
    items: [
      { href: "/admin/settings/store", label: "Store settings", icon: "store" },
      { href: "/admin/settings/theme", label: "Theme", icon: "palette" },
    ],
  },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function AdminNav({ tenantName, userName, userRole }: Props) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      style={{
        width: 220,
        minWidth: 220,
        height: "100%",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
      }}
    >
      {/* ── Brand ─────────────────────────────────────────── */}
      <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            marginBottom: 8,
          }}
        >
          ECOM
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 8px",
            borderRadius: 6,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            fontSize: 11.5,
            color: "var(--ink-3)",
            fontWeight: 500,
          }}
        >
          {ICONS.store}
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tenantName}
          </span>
          {ICONS.external}
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <div
        className="v-scroll"
        style={{ overflow: "auto", padding: "10px 8px 12px" }}
      >
        {NAV.map((g) => (
          <div key={g.group} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "var(--ink-4)",
                padding: "0 8px 5px",
              }}
            >
              {g.group}
            </div>
            {g.items.map((item) => {
              const active = isActive(item.href, (item as { href: string; label: string; icon: string; exact?: boolean }).exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? undefined : "v-nav-item"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "7px 8px",
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--ink)" : "var(--ink-2)",
                    background: active ? "var(--surface-3)" : "transparent",
                    textDecoration: "none",
                    marginBottom: 1,
                    borderLeft: `2px solid ${active ? "var(--ink)" : "transparent"}`,
                    transition: "background .1s",
                  }}
                >
                  {ICONS[item.icon]}
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── User footer ───────────────────────────────────── */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: "var(--surface-2)",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "var(--ink)",
            color: "var(--ink-inv)",
            display: "grid",
            placeItems: "center",
            fontSize: 10.5,
            fontWeight: 700,
            flexShrink: 0,
            letterSpacing: "0.02em",
          }}
        >
          {initials(userName || "?")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--ink-3)",
              textTransform: "capitalize",
            }}
          >
            {userRole}
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title="Sign out"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink-3)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {ICONS.logout}
          </button>
        </form>
      </div>
    </nav>
  );
}
