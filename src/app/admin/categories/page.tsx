import { eq } from "drizzle-orm";
import { withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { categories } from "@/db/schema/products";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireAdmin();
  const tenantId = await requireTenantId();

  const rows = await withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenantId))
      .orderBy(categories.displayOrder),
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
          <div style={{ fontSize: 15, fontWeight: 700 }}>Categories</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            {rows.length} categor{rows.length !== 1 ? "ies" : "y"}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="v-btn v-btn-primary">+ New category</button>
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
                {["Name", "Slug", "Order"].map((h) => (
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
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                    {c.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--ink-3)",
                    }}
                  >
                    {c.slug}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--ink-3)" }}>
                    {c.displayOrder}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: "var(--ink-4)",
                      fontSize: 12,
                    }}
                  >
                    No categories yet.
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
