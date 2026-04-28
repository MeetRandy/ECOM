import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { orders, orderLines, payments } from "@/db/schema/orders";
import { customers } from "@/db/schema/customers";
import { formatZAR } from "@/lib/money";
import { updateOrderStatus, updatePaymentStatus } from "./actions";

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
    <span className={`v-pill ${map[status] ?? ""}`} style={{ fontSize: 11, textTransform: "capitalize" }}>
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
    <span className={`v-pill ${map[status] ?? ""}`} style={{ fontSize: 11, textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="v-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {title}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ fontFamily: mono ? "var(--font-mono)" : undefined, fontWeight: mono ? 600 : undefined }}>
        {value}
      </span>
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const tenantId = await requireTenantId();
  const { id } = await params;

  const data = await withTenant(tenantId, async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));

    if (!order) return null;

    const lines = await tx
      .select()
      .from(orderLines)
      .where(eq(orderLines.orderId, order.id));

    const pmts = await tx
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id));

    let customer = null;
    if (order.customerId) {
      const [c] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, order.customerId));
      customer = c ?? null;
    }

    return { order, lines, payments: pmts, customer };
  });

  if (!data) notFound();

  const { order, lines, payments: pmts, customer } = data;
  const addr = order.shippingAddressSnapshot as Record<string, string> | null;

  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <Link
          href="/admin/orders"
          style={{ color: "var(--ink-3)", textDecoration: "none", fontSize: 13 }}
        >
          ← Orders
        </Link>
        <div style={{ width: 1, height: 16, background: "var(--border)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
          {order.orderNumber}
        </span>
        <div style={{ flex: 1 }} />

        {/* Order status */}
        <form action={async (fd: FormData) => {
          "use server";
          await updateOrderStatus(order.id, fd.get("status") as string);
        }}>
          <select
            name="status"
            defaultValue={order.status}
            className="v-input"
            style={{ fontSize: 12, padding: "4px 8px", height: 30 }}
          >
            {["pending","confirmed","processing","shipped","delivered","cancelled","refunded"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button type="submit" className="v-btn" style={{ fontSize: 12, padding: "4px 10px", height: 30, marginLeft: 6 }}>
            Save
          </button>
        </form>

        {/* Payment status */}
        <form action={async (fd: FormData) => {
          "use server";
          await updatePaymentStatus(order.id, fd.get("paymentStatus") as string);
        }}>
          <select
            name="paymentStatus"
            defaultValue={order.paymentStatus}
            className="v-input"
            style={{ fontSize: 12, padding: "4px 8px", height: 30 }}
          >
            {["unpaid","paid","partial","refunded"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button type="submit" className="v-btn" style={{ fontSize: 12, padding: "4px 10px", height: 30, marginLeft: 6 }}>
            Save
          </button>
        </form>

        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
          {new Date(order.createdAt).toLocaleString("en-ZA")}
        </span>
      </div>

      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Line items */}
          <Section title="Items">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--ink-4)", fontSize: 11, textAlign: "left" }}>
                  {["Product", "SKU", "Qty", "Unit Price", "Total"].map((h) => (
                    <th key={h} style={{ padding: "4px 8px 10px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ fontWeight: 500 }}>{line.productName}</div>
                      {line.variantName && line.variantName !== "Default" && (
                        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{line.variantName}</div>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                      {line.sku ?? "—"}
                    </td>
                    <td style={{ padding: "10px 8px" }}>{line.quantity}</td>
                    <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)" }}>
                      {formatZAR(Number(line.unitPrice))}
                    </td>
                    <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {formatZAR(Number(line.lineTotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Payments */}
          {pmts.length > 0 && (
            <Section title="Payments">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "var(--ink-4)", fontSize: 11, textAlign: "left" }}>
                    {["Method", "Amount", "Status", "Reference", "Date"].map((h) => (
                      <th key={h} style={{ padding: "4px 8px 10px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pmts.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 8px", textTransform: "capitalize" }}>{p.method}</td>
                      <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {formatZAR(Number(p.amount))}
                      </td>
                      <td style={{ padding: "10px 8px", textTransform: "capitalize" }}>{p.status}</td>
                      <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                        {p.providerRef ?? "—"}
                      </td>
                      <td style={{ padding: "10px 8px", color: "var(--ink-3)", fontSize: 12 }}>
                        {new Date(p.createdAt).toLocaleDateString("en-ZA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Order summary */}
          <Section title="Summary">
            <Row label="Subtotal" value={formatZAR(Number(order.subtotal))} mono />
            {Number(order.discountTotal) > 0 && (
              <Row label="Discount" value={`− ${formatZAR(Number(order.discountTotal))}`} mono />
            )}
            {Number(order.shippingTotal) > 0 && (
              <Row label="Shipping" value={formatZAR(Number(order.shippingTotal))} mono />
            )}
            <Row label="VAT" value={formatZAR(Number(order.vatTotal))} mono />
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8 }}>
              <Row label="Total" value={formatZAR(Number(order.total))} mono />
            </div>
            {order.paymentMethod && (
              <div style={{ marginTop: 8 }}>
                <Row label="Payment method" value={order.paymentMethod} />
              </div>
            )}
            {order.notes && (
              <div style={{ marginTop: 12, padding: 10, background: "var(--surface-2)", borderRadius: 6, fontSize: 12.5, color: "var(--ink-2)" }}>
                {order.notes}
              </div>
            )}
          </Section>

          {/* Customer */}
          <Section title="Customer">
            {customer ? (
              <>
                <Row label="Name" value={customer.name ?? "—"} />
                <Row label="Email" value={customer.email} />
                {customer.phone && <Row label="Phone" value={customer.phone} />}
              </>
            ) : (
              <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Guest order</p>
            )}
          </Section>

          {/* Shipping address */}
          {addr && (
            <Section title="Shipping Address">
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ink-2)" }}>
                {addr.name && <div style={{ fontWeight: 500 }}>{addr.name}</div>}
                {addr.line1 && <div>{addr.line1}</div>}
                {addr.line2 && <div>{addr.line2}</div>}
                {(addr.city || addr.province) && (
                  <div>{[addr.city, addr.province].filter(Boolean).join(", ")}</div>
                )}
                {addr.postalCode && <div>{addr.postalCode}</div>}
                {addr.country && <div>{addr.country}</div>}
              </div>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}
