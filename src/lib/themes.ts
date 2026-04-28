export type ThemeId = "vorna" | "slate" | "forest" | "midnight";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  vars: Record<string, string>;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "vorna",
    name: "Vorna",
    description: "Warm amber tones — the classic look",
    vars: {
      "--sf-bg":               "#FAFAF8",
      "--sf-surface":          "#FFFFFF",
      "--sf-shelf":            "#F5F4F0",
      "--sf-ink":              "#1A1A1A",
      "--sf-ink-2":            "#3A352D",
      "--sf-muted":            "#5A554B",
      "--sf-subtle":           "#7A7468",
      "--sf-placeholder":      "#C8C5BE",
      "--sf-accent":           "#E85D04",
      "--sf-accent-soft":      "#FFE4CC",
      "--sf-accent-deep":      "#FFD9B8",
      "--sf-accent-glow":      "rgba(232,93,4,0.18)",
      "--sf-hero-border":      "#F2E5D2",
      "--sf-line":             "#E8E8E4",
      "--sf-success":          "#5A8E4A",
      "--sf-header-bg":        "#1A1A1A",
      "--sf-header-fg":        "#FAFAF8",
      "--sf-header-input-bg":  "#2A2A2A",
      "--sf-header-input-sep": "#3A3A3A",
    },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Cool blue-grey with an electric blue accent",
    vars: {
      "--sf-bg":               "#F5F6FA",
      "--sf-surface":          "#FFFFFF",
      "--sf-shelf":            "#EAECF2",
      "--sf-ink":              "#1E2337",
      "--sf-ink-2":            "#2D3555",
      "--sf-muted":            "#4A5278",
      "--sf-subtle":           "#6A7299",
      "--sf-placeholder":      "#B0B8CC",
      "--sf-accent":           "#3B6FE8",
      "--sf-accent-soft":      "#DBE5FF",
      "--sf-accent-deep":      "#C4D4FF",
      "--sf-accent-glow":      "rgba(59,111,232,0.18)",
      "--sf-hero-border":      "#D4DEFF",
      "--sf-line":             "#E4E8F0",
      "--sf-success":          "#2E7D52",
      "--sf-header-bg":        "#1E2337",
      "--sf-header-fg":        "#F5F6FA",
      "--sf-header-input-bg":  "#2D3555",
      "--sf-header-input-sep": "#3D4566",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep greens and earthy neutrals",
    vars: {
      "--sf-bg":               "#F5FAF6",
      "--sf-surface":          "#FFFFFF",
      "--sf-shelf":            "#EBF3EC",
      "--sf-ink":              "#0D2B12",
      "--sf-ink-2":            "#1D3E22",
      "--sf-muted":            "#3A6040",
      "--sf-subtle":           "#5A7D5F",
      "--sf-placeholder":      "#A0C4A5",
      "--sf-accent":           "#1F8B3A",
      "--sf-accent-soft":      "#CDEFD4",
      "--sf-accent-deep":      "#B0E5BA",
      "--sf-accent-glow":      "rgba(31,139,58,0.18)",
      "--sf-hero-border":      "#BCDFC3",
      "--sf-line":             "#D4E8D8",
      "--sf-success":          "#1F8B3A",
      "--sf-header-bg":        "#0D2B12",
      "--sf-header-fg":        "#F5FAF6",
      "--sf-header-input-bg":  "#1D3E22",
      "--sf-header-input-sep": "#2D4E32",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark backgrounds with a violet accent",
    vars: {
      "--sf-bg":               "#0E0E11",
      "--sf-surface":          "#16161A",
      "--sf-shelf":            "#1C1C22",
      "--sf-ink":              "#F0F0FF",
      "--sf-ink-2":            "#C4C4D8",
      "--sf-muted":            "#8888A0",
      "--sf-subtle":           "#606078",
      "--sf-placeholder":      "#404055",
      "--sf-accent":           "#7C5CFC",
      "--sf-accent-soft":      "#2A1F4A",
      "--sf-accent-deep":      "#3A2A5E",
      "--sf-accent-glow":      "rgba(124,92,252,0.25)",
      "--sf-hero-border":      "#2A2040",
      "--sf-line":             "#252530",
      "--sf-success":          "#3EC87A",
      "--sf-header-bg":        "#09090C",
      "--sf-header-fg":        "#F0F0FF",
      "--sf-header-input-bg":  "#121218",
      "--sf-header-input-sep": "#22222E",
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = "vorna";

export function getTheme(id: string | null | undefined): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export function themeToInlineStyle(theme: ThemeDefinition): React.CSSProperties {
  return theme.vars as React.CSSProperties;
}
