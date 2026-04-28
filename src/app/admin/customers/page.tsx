import { desc, eq, sql } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { customers } from "@/db/schema/customers";
import { orders } from "@/db/schema/orders";
import { formatZAR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireAdmin();
  const tenantId = await requireTenantId();

  const rows = await withTenant(tenantId, async (tx) => {
    const customerRows = await tx
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        city: customers.city,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .orderBy(desc(customers.createdAt))
      .limit(200);

    const orderStats = await tx
      .select({
        customerId: orders.customerId,
        count: sql<number>`count(*)::int`,
        totalSpend: sql<string>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .groupBy(orders.customerId);

    const statsMap = new Map(orderStats.map((s) => [s.customerId, s]));

    return customerRows.map((c) => ({
      ...c,
      orderCount: statsMap.get(c.id)?.count ?? 0,
      totalSpend: Number(statsMap.get(c.id)?.totalSpend ?? 0),
    }));
  });

  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "14px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 1,
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Customers</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            {rows.length} customer{rows.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="v-card" style={{ overflow: "hidden", padding: 0 }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  color: "var(--ink-3)",
                  fontSize: 11,
                  textAlign: "left",
                }}
              >
                {[
                  "Name",
                  "Email",
                  "Phone",
                  "City",
                  "Orders",
                  "Total spend",
                  "Joined",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 500,
                    }}
                  >
                    {c.name ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--ink-3)",
                      fontSize: 12,
                    }}
                  >
                    {c.email}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--ink-3)",
                    }}
                  >
                    {c.phone ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--ink-3)" }}>
                    {c.city ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {c.orderCount}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                    }}
                  >
                    {c.totalSpend > 0 ? formatZAR(c.totalSpend) : "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--ink-3)",
                      fontSize: 12,
                    }}
                  >
                    {new Date(c.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: "var(--ink-4)",
                      fontSize: 12,
                    }}
                  >
                    No customers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
