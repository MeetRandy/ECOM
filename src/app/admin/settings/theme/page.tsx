import { requireAdmin } from "@/lib/auth-guards";

export default async function ThemeSettingsPage() {
  await requireAdmin();

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
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>Theme settings</div>
      </div>

      <div style={{ padding: 24, maxWidth: 640 }}>
        <div
          className="v-card"
          style={{ padding: 32, textAlign: "center", color: "var(--ink-3)" }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
            Theme customisation coming soon
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            You will be able to customise your storefront colours, typography,
            and layout here. In the meantime, edit your store settings to update
            your logo and banner image.
          </p>
        </div>
      </div>
    </main>
  );
}
