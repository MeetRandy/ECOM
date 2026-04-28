"use client";

import { useState } from "react";

type Props = {
  description: string;
  specs: { key: string; value: string }[];
};

export function ProductTabs({ description, specs }: Props) {
  const [active, setActive] = useState<"description" | "specs">("description");

  const tabBase: React.CSSProperties = {
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: "none",
    borderBottom: "2px solid transparent",
    color: "var(--sf-ink)",
    transition: "color 0.1s, border-color 0.1s",
  };

  const tabActive: React.CSSProperties = {
    ...tabBase,
    color: "var(--sf-ink)",
    borderBottom: "2px solid var(--sf-accent)",
    fontWeight: 600,
  };

  return (
    <div
      style={{
        background: "var(--sf-surface)",
        border: "1px solid var(--sf-line)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--sf-line)",
        }}
      >
        <button
          type="button"
          onClick={() => setActive("description")}
          style={active === "description" ? tabActive : tabBase}
        >
          Description
        </button>
        <button
          type="button"
          onClick={() => setActive("specs")}
          style={active === "specs" ? tabActive : tabBase}
        >
          Specifications
        </button>
      </div>

      {/* Tab content */}
      <div style={{ padding: "24px" }}>
        {active === "description" ? (
          <div
            style={{
              fontSize: 14,
              color: "var(--sf-ink-2)",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {description || "No description available."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {specs.map((s) => (
                <tr
                  key={s.key}
                  style={{ borderBottom: "1px solid var(--sf-shelf)" }}
                >
                  <td
                    style={{
                      padding: "10px 0",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--sf-muted)",
                      width: "40%",
                    }}
                  >
                    {s.key}
                  </td>
                  <td
                    style={{
                      padding: "10px 0",
                      fontSize: 13,
                      color: "var(--sf-ink)",
                    }}
                  >
                    {s.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
