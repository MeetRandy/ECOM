"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { signUpAction, type SignUpState } from "./actions";
import { slugify } from "@/lib/slugify";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState<SignUpState, FormData>(
    signUpAction,
    null,
  );
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // Auto-generate slug from store name unless user has manually edited it
  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(storeName));
    }
  }, [storeName, slugEdited]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Veld <span style={{ color: "var(--accent-ink)" }}>ECOM</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
            Create your store
          </div>
        </div>

        <div
          className="v-card"
          style={{ padding: 24, display: "flex", flexDirection: "column", gap: 0 }}
        >
          <form
            action={formAction}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {/* Store name */}
            <div>
              <label className="v-label" htmlFor="storeName">
                Store name
              </label>
              <input
                id="storeName"
                name="storeName"
                type="text"
                required
                className="v-input"
                style={{ height: 36 }}
                placeholder="My Awesome Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
              {state?.errors?.storeName && (
                <p style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 4 }}>
                  {state.errors.storeName[0]}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="v-label" htmlFor="slug">
                Store URL
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "var(--radius)",
                  background: "var(--surface)",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    padding: "0 10px",
                    fontSize: 12.5,
                    color: "var(--ink-4)",
                    borderRight: "1px solid var(--border-strong)",
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    background: "var(--surface-2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  veld.ecom/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    padding: "0 10px",
                    height: 36,
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                  placeholder="my-store"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugEdited(true);
                  }}
                />
              </div>
              {state?.errors?.slug && (
                <p style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 4 }}>
                  {state.errors.slug[0]}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="v-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="v-input"
                style={{ height: 36 }}
                placeholder="you@example.com"
              />
              {state?.errors?.email && (
                <p style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 4 }}>
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="v-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className="v-input"
                style={{ height: 36 }}
                placeholder="At least 8 characters"
              />
              {state?.errors?.password && (
                <p style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 4 }}>
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            {state?.message && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius)",
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                  fontSize: 12.5,
                }}
              >
                {state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="v-btn v-btn-primary"
              style={{
                height: 38,
                width: "100%",
                justifyContent: "center",
                fontSize: 13.5,
                marginTop: 4,
                opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? "Creating store…" : "Create store"}
            </button>

            <p
              style={{
                fontSize: 11,
                color: "var(--ink-4)",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              By creating an account you agree to our terms of service and
              acknowledge our POPIA privacy notice.
            </p>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12.5,
            color: "var(--ink-3)",
            marginTop: 16,
          }}
        >
          Already have a store?{" "}
          <Link href="/sign-in" style={{ color: "var(--ink)", fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
