import { and, desc, eq, sql } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { orders } from "@/db/schema/orders";
import { customers } from "@/db/schema/customers";
import { products } from "@/db/schema/products";
import { formatZAR, round2 } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const STAT_ICONS = {
  orders: <Icon><path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3l-2 1-2-1-2 1-2-1-2 1-2-1Z" /><path d="M9 8h6M9 12h6M9 16h4" /></Icon>,
  revenue: <Icon><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Icon>,
  customers: <Icon><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7" /></Icon>,
  products: <Icon><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></Icon>,
};

const STAT_COLORS = {
  orders: "oklch(0.65 0.12 240)",
  revenue: "oklch(0.65 0.13 155)",
  customers: "oklch(0.65 0.13 80)",
  products: "oklch(0.65 0.12 290)",
};

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: keyof typeof STAT_ICONS;
  color: string;
}) {
  return (
    <div
      className="v-card"
      style={{
        padding: "18px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          background: `color-mix(in oklch, ${color} 12%, transparent)`,
          color,
        }}
      >
        {STAT_ICONS[icon]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="v-eyebrow">{label}</div>
        <div
          className="v-mono v-tnum"
          style={{ fontSize: 24, fontWeight: 700, marginTop: 4, letterSpacing: "-0.015em", lineHeight: 1.1 }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 3 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "v-pill-amber",
    confirmed: "v-pill-blue",
    processing: "v-pill-amber",
    shipped: "v-pill-blue",
    delivered: "v-pill-green",
    cancelled: "",
    refunded: "",
  };
  return (
    <span
      className={`v-pill ${map[status] ?? ""}`}
      style={{ fontSize: 10.5, textTransform: "capitalize" }}
    >
      {status}
    </span>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const tenantId = await requireTenantId();

  const data = await withTenant(tenantId, async (tx) => {
    const [orderAgg] = await tx
      .select({
        total: sql<string>`coalesce(sum(${orders.total}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(eq(orders.tenantId, tenantId));

    const [customerCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(eq(customers.tenantId, tenantId));

    const [productCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.status, "active")));

    const recentOrders = await tx
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(8);

    return {
      totalRevenue: round2(Number(orderAgg?.total ?? 0)),
      totalOrders: orderAgg?.count ?? 0,
      totalCustomers: customerCount?.count ?? 0,
      activeProducts: productCount?.count ?? 0,
      recentOrders,
    };
  });

  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100%" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Dashboard
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>
            {new Date().toLocaleDateString("en-ZA", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <Link
          href="/admin/products/new"
          className="v-btn v-btn-primary"
          style={{ textDecoration: "none" }}
        >
          + Add product
        </Link>
        <Link
          href="/admin/orders"
          className="v-btn"
          style={{ textDecoration: "none" }}
        >
          View orders
        </Link>
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
          }}
        >
          <StatCard icon="orders"    color={STAT_COLORS.orders}    label="Total orders"  value={String(data.totalOrders)}     sub="All time" />
          <StatCard icon="revenue"   color={STAT_COLORS.revenue}   label="Revenue"       value={formatZAR(data.totalRevenue)} sub="All time · ZAR" />
          <StatCard icon="customers" color={STAT_COLORS.customers} label="Customers"     value={String(data.totalCustomers)}  sub="Registered accounts" />
          <StatCard icon="products"  color={STAT_COLORS.products}  label="Products"      value={String(data.activeProducts)}  sub="Active listings" />
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { href: "/admin/products/new", label: "New product" },
            { href: "/admin/categories", label: "Manage categories" },
            { href: "/admin/promos", label: "Promo codes" },
            { href: "/admin/settings/store", label: "Store settings" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="v-btn"
              style={{ textDecoration: "none", fontSize: 12 }}
            >
              {a.label}
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <section className="v-card" style={{ overflow: "hidden", padding: 0 }}>
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Recent orders</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>
                Latest 8 transactions
              </div>
            </div>
            <Link href="/admin/orders" className="v-btn v-btn-sm" style={{ textDecoration: "none" }}>
              View all
            </Link>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", textAlign: "left" }}>
                {["Order #", "Date", "Status", "Payment", "Total"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "9px 18px",
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--ink-4)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr
                  key={o.id}
                  className="v-tr"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "12px 18px" }}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--ink)",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 18px", color: "var(--ink-3)", whiteSpace: "nowrap", fontSize: 12 }}>
                    {new Date(o.createdAt).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <StatusPill status={o.status} />
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span
                      className={`v-pill ${o.paymentStatus === "paid" ? "v-pill-green" : o.paymentStatus === "unpaid" ? "v-pill-amber" : ""}`}
                      style={{ fontSize: 10.5, textTransform: "capitalize" }}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      fontSize: 12.5,
                    }}
                  >
                    {formatZAR(Number(o.total))}
                  </td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "52px 18px",
                      textAlign: "center",
                      color: "var(--ink-4)",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
                    No orders yet — share your storefront to get your first sale.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
