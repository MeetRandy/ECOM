import { eq } from "drizzle-orm";
import { db, withTenant } from "@/db/client";
import { requireTenantId } from "@/lib/tenant";
import { requireAdmin } from "@/lib/auth-guards";
import { storeSettings } from "@/db/schema/store";
import { tenants } from "@/db/schema/tenants";
import { revalidatePath } from "next/cache";
import { THEMES, type ThemeId } from "@/lib/themes";

async function saveTheme(formData: FormData) {
  "use server";
  const tenantId = await requireTenantId();
  const theme = String(formData.get("theme") ?? "vorna") as ThemeId;

  await withTenant(tenantId, async (tx) => {
    const [existing] = await tx
      .select({ id: storeSettings.id })
      .from(storeSettings)
      .where(eq(storeSettings.tenantId, tenantId))
      .limit(1);

    if (existing) {
      await tx
        .update(storeSettings)
        .set({ theme, updatedAt: new Date() })
        .where(eq(storeSettings.tenantId, tenantId));
    } else {
      await tx.insert(storeSettings).values({
        tenantId,
        storeName: "",
        theme,
      });
    }
  });

  revalidatePath("/admin/settings/theme");
}

export default async function ThemeSettingsPage() {
  await requireAdmin();
  const tenantId = await requireTenantId();

  const [settings] = await db
    .select({ theme: storeSettings.theme })
    .from(storeSettings)
    .where(eq(storeSettings.tenantId, tenantId))
    .limit(1);

  const [tenant] = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const currentTheme = settings?.theme ?? "vorna";
  const storeSlug = tenant?.slug ?? "";

  return (
    <main style={{ background: "var(--surface-2)", minHeight: "100%" }}>
      {/* Header */}
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
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>Theme</div>
      </div>

      <div style={{ padding: 24, maxWidth: 780 }}>
        <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 24 }}>
          Choose a colour theme for your storefront. Changes apply immediately after saving.
          {storeSlug && (
            <>
              {" "}Preview at{" "}
              <a
                href={`/${storeSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ink)", fontWeight: 500 }}
              >
                /{storeSlug}
              </a>
              .
            </>
          )}
        </p>

        <form action={saveTheme}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 14,
              marginBottom: 24,
            }}
          >
            {THEMES.map((theme) => {
              const isActive = currentTheme === theme.id;
              return (
                <label
                  key={theme.id}
                  style={{
                    display: "block",
                    cursor: "pointer",
                    borderRadius: 8,
                    border: isActive
                      ? "2px solid var(--ink)"
                      : "1px solid var(--border-strong)",
                    overflow: "hidden",
                    background: "var(--surface)",
                    transition: "border-color .1s",
                  }}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={theme.id}
                    defaultChecked={isActive}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                  />

                  {/* Preview swatch */}
                  <div
                    style={{
                      height: 100,
                      background: theme.vars["--sf-bg"],
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Simulated header bar */}
                    <div
                      style={{
                        height: 28,
                        background: theme.vars["--sf-header-bg"],
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          background: theme.vars["--sf-accent"],
                        }}
                      />
                      <div
                        style={{
                          flex: 1,
                          height: 10,
                          borderRadius: 4,
                          background: theme.vars["--sf-header-input-bg"],
                        }}
                      />
                      <div
                        style={{
                          width: 32,
                          height: 16,
                          borderRadius: 3,
                          background: theme.vars["--sf-accent"],
                        }}
                      />
                    </div>

                    {/* Simulated content */}
                    <div
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 8,
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            background: theme.vars["--sf-surface"],
                            border: `1px solid ${theme.vars["--sf-line"]}`,
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: 22,
                              background: theme.vars["--sf-shelf"],
                            }}
                          />
                          <div style={{ padding: "4px 6px" }}>
                            <div
                              style={{
                                height: 5,
                                borderRadius: 2,
                                background: theme.vars["--sf-ink"],
                                opacity: 0.6,
                                marginBottom: 3,
                              }}
                            />
                            <div
                              style={{
                                height: 5,
                                borderRadius: 2,
                                background: theme.vars["--sf-accent"],
                                width: "60%",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Active checkmark */}
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "var(--ink)",
                          color: "var(--ink-inv)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: "var(--ink)",
                        marginBottom: 2,
                      }}
                    >
                      {theme.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      {theme.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <button
            type="submit"
            className="v-btn v-btn-primary"
            style={{ height: 36, paddingInline: 20, fontSize: 13 }}
          >
            Save theme
          </button>
        </form>
      </div>
    </main>
  );
}
