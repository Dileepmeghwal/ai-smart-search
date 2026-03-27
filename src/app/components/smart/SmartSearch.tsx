"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Search,
  Zap,
  SlidersHorizontal,
  CornerDownRight,
  X,
} from "lucide-react";
import { useAISuggestion } from "@/hooks/useAISuggestion";
import { useSmartUIConfig } from "@/providers/SmartUIProvider";
import { motion, AnimatePresence } from "framer-motion";

// ─── Props ────────────────────────────────────────────────────────────────────
interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  ghostTextClassName?: string;
  statusClassName?: string;
  badgeClassName?: string;
  clearButtonClassName?: string;
  onSearch?: (value: string, metadata?: Record<string, unknown> | null) => void;
  /** Called when AI-parsed filters change or a chip is removed */
  onFiltersChange?: (filters: Record<string, string>) => void;
  /** API endpoint — overrides SmartUIProvider, falls back to "/api/suggest" */
  apiEndpoint?: string;
  /** Debounce delay in ms — overrides SmartUIProvider, falls back to 300 */
  debounceMs?: number;
  /** Min characters before AI triggers — overrides SmartUIProvider, falls back to 2 */
  minQueryLength?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SmartSearch({
  placeholder = "Search anything with AI...",
  className = "",
  containerClassName = "",
  inputWrapperClassName = "",
  inputClassName = "",
  ghostTextClassName = "",
  statusClassName = "",
  badgeClassName = "",
  clearButtonClassName = "",
  onSearch,
  onFiltersChange,
  apiEndpoint,
  debounceMs,
  minQueryLength,
}: SmartSearchProps) {
  // ── Resolve config: prop → provider → default ─────────────────────────────
  const providerConfig = useSmartUIConfig();
  const resolvedEndpoint =
    apiEndpoint ?? providerConfig.apiEndpoint ?? "/api/suggest";
  const resolvedDebounce = debounceMs ?? providerConfig.debounceMs ?? 300;
  const resolvedMinLength =
    minQueryLength ?? providerConfig.minQueryLength ?? 2;

  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, analysis, loading, error, getSuggestion, clearSuggestion } =
    useAISuggestion({
      apiEndpoint: resolvedEndpoint,
      debounceMs: resolvedDebounce,
      minLength: resolvedMinLength,
    });

  // ── Derived from AI response ───────────────────────────────────────────────
  const ai = analysis as Record<string, unknown> | null;
  const isComplex = ai?.is_complex as boolean | undefined;
  const intent = ai?.intent as string | undefined;
  const related = ai?.related as string[] | undefined;

  // ── Ghost text (Tab to accept) ─────────────────────────────────────────────
  const suggestion = suggestions[0] || "";
  const showGhost =
    query.length > 0 &&
    suggestion.toLowerCase().startsWith(query.toLowerCase());
  const ghostText = showGhost ? suggestion.slice(query.length) : "";

  // ── Correction: AI returned a suggestion that doesn't prefix-match (typo) ─
  const showCorrection =
    !showGhost &&
    !loading &&
    query.length >= resolvedMinLength &&
    suggestion.length > 0 &&
    suggestion.toLowerCase().trim() !== query.toLowerCase().trim();

  // ── Sync activeFilters whenever AI returns new filters ─────────────────────
  useEffect(() => {
    if (analysis) {
      const raw = ai?.filters as Record<string, string> | null | undefined;
      const valid = (raw && typeof raw === "object") 
        ? Object.fromEntries(
            Object.entries(raw).filter(
              ([, v]) => v !== null && v !== undefined && v !== "",
            ),
          )
        : {};
      
      setActiveFilters(valid);
      onFiltersChange?.(valid);
    }
    // Note: We don't clear activeFilters when analysis is null (e.g. on search commit),
    // allowing them to stay visible until the query is cleared or changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length >= resolvedMinLength) {
      getSuggestion(val, "Global Search", "smart_search");
    } else {
      clearSuggestion();
      setActiveFilters({});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Accept suggestion with Tab or Right Arrow
    if ((e.key === "Tab" || e.key === "ArrowRight") && (ghostText || showCorrection)) {
      // For ArrowRight, only accept if cursor is at the end
      if (e.key === "ArrowRight") {
        const isAtEnd = (e.target as HTMLInputElement).selectionStart === query.length;
        if (!isAtEnd) return;
      }
      
      e.preventDefault();
      const fullText = ghostText ? query + ghostText : suggestion;
      setQuery(fullText);
      onSearch?.(fullText, analysis);
      clearSuggestion();
    }
    if (e.key === "Enter") {
      onSearch?.(query, analysis);
      clearSuggestion();
    }
  };

  const handleClear = () => {
    setQuery("");
    setActiveFilters({});
    clearSuggestion();
    inputRef.current?.focus();
  };

  const removeFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      onFiltersChange?.(next);
      return next;
    });
  };

  const applyQuery = (q: string) => {
    setQuery(q);
    getSuggestion(q, "Global Search", "smart_search");
    onSearch?.(q, analysis);
    inputRef.current?.focus();
  };

  const hasFilters = Object.keys(activeFilters).length > 0;
  const showRelated = !loading && !!related && related.length > 0;
  const showIntelligence = !!query;

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className={`relative group ${containerClassName}`}>
        {/* ── Input box ─────────────────────────────────────────────────── */}
        <div
          className={`relative flex items-center bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm
            transition-all duration-300 focus-within:border-primary
            focus-within:ring-4 focus-within:ring-primary/5 px-5 py-4
            ${inputWrapperClassName}`}
        >
          {/* Icon */}
          <div className="mr-4 text-slate-400 group-focus-within:text-primary transition-colors shrink-0">
            {loading ? (
              <Loader2
                className="w-5 h-5 animate-spin text-primary"
                aria-hidden="true"
              />
            ) : (
              <Search className="w-5 h-5" aria-hidden="true" />
            )}
          </div>

          {/* Input + ghost overlay */}
          <div className="relative flex-1 h-8 flex items-center overflow-hidden">
            <AnimatePresence>
              {/* Ghost text: prefix-match (append after query) */}
              {showGhost && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute left-0 inset-y-0 pointer-events-none text-lg font-medium
                    select-none flex items-center whitespace-pre z-0 ${ghostTextClassName}`}
                  style={{
                    color: "var(--smart-ghost, var(--ss-ghost-color, rgba(148, 163, 184, 0.45)))",
                  }}
                >
                  <span className="opacity-0">{query}</span>
                  <span
                    className="flex items-center"
                    aria-hidden="true"
                    id="ghost-suggestion"
                  >
                    {ghostText}
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.7, scale: 1 }}
                      className="ml-3 px-1.5 py-0.5 rounded border border-current bg-white/10 dark:bg-black/10 text-[9px] font-bold uppercase tracking-tighter"
                    >
                      Tab
                    </motion.span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={query ? "" : placeholder}
              autoComplete="off"
              spellCheck="false"
              aria-label="Smart AI Search"
              aria-autocomplete="both"
              aria-activedescendant={showGhost ? "ghost-suggestion" : undefined}
              className={`w-full bg-transparent border-none focus:outline-none
                text-lg font-medium text-slate-800 dark:text-slate-100
                placeholder:text-slate-400 z-10 leading-none h-full
                ${inputClassName}`}
            />
          </div>

          {/* AI badge */}
          <div
            className="ml-4 flex items-center gap-2 shrink-0"
            aria-hidden="true"
          >
            <div
              className={`p-1.5 rounded-lg transition-all duration-500
                ${
                  loading
                    ? "bg-primary text-white animate-pulse"
                    : isComplex
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-400"
                }
                ${badgeClassName}`}
            >
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* ── AI intelligence panel ────────────────────────────────────── */}
        <div
          className={`mt-3 px-1 flex flex-col gap-3 opacity-0
            group-focus-within:opacity-100 transition-opacity duration-500
            ${statusClassName}`}
        >
          {/* Row 1 — status label + clear */}
          <div className="flex justify-between items-center w-full">
            <p
              role="status"
              aria-live="polite"
              className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-300
                ${error ? "text-red-400 dark:text-red-500" : "text-slate-400"}`}
            >
              {loading
                ? "AI Processing Context..."
                : error
                  ? "AI Offline — showing local results"
                  : intent
                    ? intent
                    : query
                      ? "Smart Suggestions Ready"
                      : "Type for AI-powered Search"}
            </p>

            {query && (
              <button
                onClick={handleClear}
                aria-label="Clear search"
                className={`text-[10px] font-bold text-slate-400 hover:text-primary
                  uppercase tracking-widest transition-colors ${clearButtonClassName}`}
              >
                Clear
              </button>
            )}
          </div>

          {/* Row 1.5 — Correction suggestion */}
          {showCorrection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 px-1"
            >
              <Zap className="w-3 h-3 text-primary animate-pulse" />
              <button
                onClick={() => applyQuery(suggestion)}
                className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors text-left"
              >
                Did you mean: <span className="text-primary italic font-bold">"{suggestion}"</span>?
                <span className="ml-2 text-[10px] opacity-60 font-normal uppercase tracking-tighter">(Tab to fix)</span>
              </button>
            </motion.div>
          )}

          {/* Row 2 — Converted filters */}
          {showIntelligence && hasFilters && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Converted filters
                </span>
              </div>
              <ul role="list" className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([key, value]) => (
                  <li
                    key={key}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary
                      pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium"
                  >
                    <span className="text-primary/50 font-normal">{key}:</span>
                    <span>{String(value)}</span>
                    <button
                      onClick={() => removeFilter(key)}
                      aria-label={`Remove ${key} filter`}
                      className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Row 4 — Related searches */}
          {showIntelligence && showRelated && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <CornerDownRight className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Related searches
                </span>
              </div>
              <ul role="list" className="flex flex-wrap gap-2">
                {related!.map((term, i) => (
                  <li key={i}>
                    <button
                      onClick={() => applyQuery(term)}
                      className="text-xs font-medium px-2.5 py-1 rounded-full
                        bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                        hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {term}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
