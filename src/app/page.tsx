import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Top nav */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          height: 52,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
          Veld <span style={{ color: "var(--accent-ink)" }}>ECOM</span>
        </div>
        <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/sign-in" className="v-btn v-btn-ghost" style={{ textDecoration: "none" }}>
            Sign in
          </Link>
          <Link href="/sign-up" className="v-btn v-btn-primary" style={{ textDecoration: "none" }}>
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 32px",
          textAlign: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 999,
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "var(--accent-ink)",
            }}
          />
          South African e-commerce
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: 0,
            maxWidth: 700,
          }}
        >
          Veld ECOM
        </h1>

        <p
          style={{
            fontSize: "clamp(15px, 2vw, 19px)",
            color: "var(--ink-3)",
            maxWidth: 520,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Multi-tenant e-commerce for South African retailers. Launch your online
          store with built-in ZAR pricing, 15% VAT, and local payment integrations.
        </p>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <Link
            href="/sign-up"
            className="v-btn v-btn-primary"
            style={{
              height: 44,
              padding: "0 24px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Get started free
          </Link>
          <Link
            href="/sign-in"
            className="v-btn"
            style={{
              height: 44,
              padding: "0 24px",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          {[
            "ZAR currency",
            "15% VAT inclusive",
            "PayFast ready",
            "Yoco ready",
            "POPIA compliant",
            "Multi-store",
          ].map((feat) => (
            <span key={feat} className="v-pill" style={{ fontSize: 12 }}>
              {feat}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "20px 32px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 12,
          color: "var(--ink-4)",
        }}
      >
        <span>© 2026 Veld ECOM</span>
        <span>Built for South African retailers</span>
      </footer>
    </main>
  );
}
