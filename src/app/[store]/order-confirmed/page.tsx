import Link from "next/link";

export default async function OrderConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ store: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { store: slug } = await params;
  const { order: orderNumber } = await searchParams;

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "80px auto",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 52,
          marginBottom: 20,
          lineHeight: 1,
        }}
      >
        ✅
      </div>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          marginBottom: 12,
        }}
      >
        Order confirmed!
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--ink-3)",
          lineHeight: 1.6,
          marginBottom: 8,
        }}
      >
        Thank you for your order. We&apos;ve received it and will process it shortly.
      </p>
      {orderNumber && (
        <div
          style={{
            display: "inline-block",
            padding: "8px 16px",
            background: "var(--surface-3)",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 24,
            border: "1px solid var(--border)",
          }}
        >
          {orderNumber}
        </div>
      )}
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-4)",
          marginBottom: 28,
          lineHeight: 1.6,
        }}
      >
        A confirmation email will be sent to you. For payment via EFT, please
        use the order number as your reference.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Link
          href={`/${slug}/products`}
          className="v-btn v-btn-primary"
          style={{
            textDecoration: "none",
            height: 40,
            padding: "0 20px",
            fontSize: 13.5,
          }}
        >
          Continue shopping
        </Link>
        <Link
          href={`/${slug}`}
          className="v-btn"
          style={{
            textDecoration: "none",
            height: 40,
            padding: "0 20px",
            fontSize: 13.5,
          }}
        >
          Back to store
        </Link>
      </div>
    </main>
  );
}
