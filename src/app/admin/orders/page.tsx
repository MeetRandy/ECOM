import { desc, eq } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { orders } from "@/db/schema/orders";
import { customers } from "@/db/schema/customers";
import { formatZAR } from "@/lib/money";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
    <span className={`v-pill ${map[status] ?? ""}`} style={{ fontSize: 10.5, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

function PaymentPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "v-pill-green",
    unpaid: "v-pill-amber",
    partial: "v-pill-amber",
    refunded: "",
  };
  return (
    <span className={`v-pill ${map[status] ?? ""}`} style={{ fontSize: 10.5, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

export default async function OrdersPage() {
  await requireAdmin();
  const tenantId = await requireTenantId();

  const rows = await withTenant(tenantId, async (tx) => {
    const orderRows = await tx
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        total: orders.total,
        customerId: orders.customerId,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(100);

    const customerIds = [
      ...new Set(orderRows.map((o) => o.customerId).filter(Boolean)),
    ] as string[];
    const customerMap = new Map<string, string>();
    if (customerIds.length) {
      const cRows = await tx
        .select({ id: customers.id, name: customers.name, email: customers.email })
        .from(customers)
        .where(eq(customers.tenantId, tenantId));
      cRows.forEach((c) => customerMap.set(c.id, c.name ?? c.email));
    }

    return orderRows.map((o) => ({
      ...o,
      customerName: o.customerId ? (customerMap.get(o.customerId) ?? "—") : "Guest",
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
          <div style={{ fontSize: 15, fontWeight: 700 }}>Orders</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            {rows.length} order{rows.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <div className="v-card" style={{ overflow: "hidden", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr
                style={{
                  background: "var(--surface-2)",
                  color: "var(--ink-3)",
                  fontSize: 11,
                  textAlign: "left",
                }}
              >
                {["Order #", "Date", "Customer", "Status", "Payment", "Method", "Total"].map((h) => (
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
              {rows.map((o) => (
                <tr
                  key={o.id}
                  className="v-tr"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--ink)",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--ink-3)",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                    }}
                  >
                    {new Date(o.createdAt).toLocaleDateString("en-ZA")}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                    {o.customerName}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusPill status={o.status} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <PaymentPill status={o.paymentStatus} />
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--ink-3)",
                      textTransform: "capitalize",
                    }}
                  >
                    {o.paymentMethod ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatZAR(Number(o.total))}
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
                    No orders yet.
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
