"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type SignInState } from "./actions";

export default function SignInPage() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signInAction,
    null,
  );

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
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Veld <span style={{ color: "var(--accent-ink)" }}>ECOM</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
            Sign in to your account
          </div>
        </div>

        <div
          className="v-card"
          style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
        >
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
            </div>

            <div>
              <label className="v-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="v-input"
                style={{ height: 36 }}
                placeholder="••••••••"
              />
            </div>

            {state && !state.ok && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius)",
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                  fontSize: 12.5,
                }}
              >
                {state.error}
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
              {pending ? "Signing in…" : "Sign in"}
            </button>
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
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" style={{ color: "var(--ink)", fontWeight: 500 }}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
