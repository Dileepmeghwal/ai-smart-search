// ── Components ──────────────────────────────────────────────────────────────
export { default as SmartSearch } from "./app/components/smart/SmartSearch";

// ── Hooks ───────────────────────────────────────────────────────────────────
export { useAISuggestion } from "./hooks/useAISuggestion";

// ── Provider ────────────────────────────────────────────────────────────────
export { SmartUIProvider, useSmartUIConfig } from "./providers/SmartUIProvider";

// ── Types ───────────────────────────────────────────────────────────────────
export type { AISuggestionMode } from "./hooks/useAISuggestion";
export type {
  SmartUITheme,
  SmartUIPlugin,
  SmartUIConfig,
} from "./providers/SmartUIProvider";
