"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";

export interface SmartUITheme {
  primary?: string;
  primaryForeground?: string;
  background?: string;
  border?: string;
  inputText?: string;
  placeholderText?: string;
  ghostText?: string;
  badgeBg?: string;
  badgeText?: string;
  chipBg?: string;
  chipText?: string;
}

export interface SmartUIPlugin {
  name: string;
  onQueryChange?: (query: string) => void;
  onFiltersChange?: (filters: Record<string, string>) => void;
  onSearch?: (query: string, metadata: Record<string, unknown> | null) => void;
  transformSuggestions?: (suggestions: string[]) => string[];
  renderExtension?: (query: string) => ReactNode;
}

export interface SmartUIConfig {
  apiEndpoint?: string;
  theme?: SmartUITheme;
  plugins?: SmartUIPlugin[];
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
}

interface SmartUIContextValue extends SmartUIConfig {
  resolvedTheme: Record<string, string>;
}

const defaultConfig: SmartUIConfig = {
  apiEndpoint: "/api/suggest",
  debounceMs: 300,
  minQueryLength: 2,
  maxSuggestions: 5,
  theme: {},
  plugins: [],
};

const SmartUIContext = createContext<SmartUIContextValue>({
  ...defaultConfig,
  resolvedTheme: {},
});

export function SmartUIProvider({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: SmartUIConfig;
}) {
  const merged = useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  const resolvedTheme = useMemo(() => {
    const t = merged.theme || {};
    return {
      "--smart-primary": t.primary || "var(--color-primary, #6366f1)",
      "--smart-primary-fg": t.primaryForeground || "#ffffff",
      "--smart-bg": t.background || "var(--color-background, #ffffff)",
      "--smart-border": t.border || "var(--color-border, #e2e8f0)",
      "--smart-input-text": t.inputText || "var(--color-foreground, #1e293b)",
      "--smart-placeholder": t.placeholderText || "#94a3b8",
      "--smart-ghost": t.ghostText || "#94a3b8",
      "--smart-badge-bg": t.badgeBg || "#f1f5f9",
      "--smart-badge-text": t.badgeText || "#64748b",
      "--smart-chip-bg": t.chipBg || "color-mix(in srgb, var(--smart-primary) 10%, transparent)",
      "--smart-chip-text": t.chipText || "var(--smart-primary)",
    };
  }, [merged.theme]);

  return (
    <SmartUIContext.Provider value={{ ...merged, resolvedTheme }}>
      <div style={resolvedTheme as React.CSSProperties}>{children}</div>
    </SmartUIContext.Provider>
  );
}

export function useSmartUIConfig(): SmartUIContextValue {
  return useContext(SmartUIContext);
}
