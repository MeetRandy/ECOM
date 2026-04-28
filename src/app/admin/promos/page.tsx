import { desc, eq } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { promoCodes } from "@/db/schema/marketing";
import { formatZAR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PromosPage() {
  await requireAdmin();
  const tenantId = await requireTenantId();

  const rows = await withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.tenantId, tenantId))
      .orderBy(desc(promoCodes.createdAt))
      .limit(100),
  );

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
          <div style={{ fontSize: 15, fontWeight: 700 }}>Promo codes</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            {rows.length} code{rows.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="v-btn v-btn-primary">+ New code</button>
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
                  "Code",
                  "Type",
                  "Value",
                  "Min order",
                  "Uses",
                  "Expires",
                  "Status",
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
              {rows.map((p) => {
                const now = new Date();
                const expired = p.expiresAt ? new Date(p.expiresAt) < now : false;
                const maxed =
                  p.maxUses != null && p.usedCount >= p.maxUses;
                const active = p.active && !expired && !maxed;

                return (
                  <tr
                    key={p.id}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <code
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12.5,
                          fontWeight: 600,
                          background: "var(--surface-3)",
                          padding: "2px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {p.code}
                      </code>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textTransform: "capitalize",
                        color: "var(--ink-3)",
                      }}
                    >
                      {p.kind}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                      }}
                    >
                      {p.kind === "percent"
                        ? `${p.value}%`
                        : formatZAR(Number(p.value))}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--ink-3)" }}>
                      {p.minOrderValue
                        ? formatZAR(Number(p.minOrderValue))
                        : "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {p.usedCount}
                      {p.maxUses != null ? ` / ${p.maxUses}` : ""}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "var(--ink-3)",
                        fontSize: 12,
                      }}
                    >
                      {p.expiresAt
                        ? new Date(p.expiresAt).toLocaleDateString("en-ZA")
                        : "Never"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        className={`v-pill ${active ? "v-pill-green" : ""}`}
                        style={{ fontSize: 10.5 }}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
                    No promo codes yet.
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
