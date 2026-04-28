type Props = {
  storeName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  storePhone: string | null;
  storeEmail: string | null;
};

export function StorefrontFooter({
  storeName,
  address,
  city,
  province,
  postalCode,
  storePhone,
  storeEmail,
}: Props) {
  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#1A1A1A",
    marginBottom: 10,
  };

  const lineStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#5A554B",
    lineHeight: 1.6,
  };

  return (
    <footer>
      <div
        style={{
          padding: "40px 32px",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 32,
          fontSize: 13,
          color: "#5A554B",
          borderTop: "1px solid #E8E8E4",
          background: "#FFFFFF",
        }}
      >
        {/* Col 1 — Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 30,
                height: 30,
                background: "#E85D04",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display, var(--font-sans))",
                fontWeight: 900,
                fontSize: 16,
                color: "#1A1A1A",
                flexShrink: 0,
              }}
            >
              V
            </div>
            <span
              style={{
                fontFamily: "var(--font-display, var(--font-sans))",
                fontWeight: 800,
                fontSize: 16,
                color: "#1A1A1A",
              }}
            >
              {storeName}
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "#5A554B",
              maxWidth: 300,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Quality pre-owned goods — tested, priced, ready to go.
          </p>
        </div>

        {/* Col 2 — Visit us */}
        <div>
          <div style={labelStyle}>Visit us</div>
          {address && <div style={lineStyle}>{address}</div>}
          <div style={lineStyle}>
            {city}
            {province ? `, ${province}` : ""}
            {postalCode ? ` ${postalCode}` : ""}
          </div>
        </div>

        {/* Col 3 — Contact */}
        <div>
          <div style={labelStyle}>Contact</div>
          {storePhone && <div style={lineStyle}>{storePhone}</div>}
          {storeEmail && <div style={lineStyle}>{storeEmail}</div>}
          {!storePhone && !storeEmail && (
            <div style={lineStyle}>—</div>
          )}
        </div>

        {/* Col 4 — Hours */}
        <div>
          <div style={labelStyle}>Hours</div>
          <div style={lineStyle}>Mon–Fri · 09:00–18:00</div>
          <div style={lineStyle}>Sat · 09:00–17:00</div>
          <div style={lineStyle}>Sun · 10:00–14:00</div>
        </div>
      </div>

      {/* Bottom strip */}
      <div
        style={{
          background: "#FFFFFF",
          padding: "0 32px 24px",
        }}
      >
        <div
          style={{
            paddingTop: 16,
            marginTop: 0,
            borderTop: "1px solid #E8E8E4",
            fontSize: 11.5,
            color: "#7A7468",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>All prices include 15% VAT · ZAR</span>
          <span>© 2026 Vorna Valley Resale</span>
        </div>
      </div>
    </footer>
  );
}
