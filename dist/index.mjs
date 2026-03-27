import { createContext, forwardRef, useRef, useId, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Loader2, ChevronDown, Search, Zap, SlidersHorizontal, X, CornerDownRight, TrendingUp } from 'lucide-react';
import { jsxs, jsx } from 'react/jsx-runtime';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var useAISuggestion = (options = {}) => {
  const opts = typeof options === "number" ? { debounceMs: options } : options;
  const {
    apiEndpoint = "/api/suggest",
    debounceMs = 300,
    minLength = 2
  } = opts;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastTextRef = useRef("");
  const getSuggestion = useCallback(
    (text, context, mode = "completion") => {
      if (!text || text.trim().length < minLength) {
        setSuggestions([]);
        setAnalysis(null);
        setError(null);
        lastTextRef.current = "";
        return;
      }
      if (text === lastTextRef.current) return;
      lastTextRef.current = text;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const fetchSuggestion = () => __async(null, null, function* () {
        var _a;
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setLoading(true);
        setError(null);
        try {
          let customKey = "";
          if (typeof window !== "undefined") {
            customKey = localStorage.getItem("gemini_api_key") || "";
          }
          const res = yield fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": customKey
            },
            body: JSON.stringify({ text, context, mode }),
            signal: controller.signal
          });
          const textResponse = yield res.text();
          let data = null;
          try {
            data = JSON.parse(textResponse);
          } catch (e) {
            throw new Error("Unable to parse AI response.");
          }
          if (!res.ok) {
            throw new Error((data == null ? void 0 : data.error) || `Request failed (${res.status})`);
          }
          setSuggestions(Array.isArray(data == null ? void 0 : data.suggestions) ? data.suggestions : []);
          setAnalysis((_a = data == null ? void 0 : data.analysis) != null ? _a : null);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          const message = err instanceof Error ? err.message : "Connection error";
          setError(message);
          setSuggestions([]);
          setAnalysis(null);
        } finally {
          setLoading(false);
        }
      });
      timeoutRef.current = setTimeout(fetchSuggestion, debounceMs);
    },
    [apiEndpoint, debounceMs, minLength]
  );
  const clearSuggestion = useCallback(() => {
    setSuggestions([]);
    setAnalysis(null);
    setError(null);
    setLoading(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    lastTextRef.current = "";
  }, []);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);
  return {
    suggestions,
    suggestion: suggestions[0] || "",
    analysis,
    loading,
    error,
    getSuggestion,
    clearSuggestion
  };
};
var defaultConfig = {
  apiEndpoint: "/api/suggest",
  debounceMs: 300,
  minQueryLength: 2,
  maxSuggestions: 5,
  theme: {},
  plugins: []
};
var SmartUIContext = createContext(__spreadProps(__spreadValues({}, defaultConfig), {
  resolvedTheme: {}
}));
function SmartUIProvider({
  children,
  config = {}
}) {
  const merged = useMemo(() => __spreadValues(__spreadValues({}, defaultConfig), config), [config]);
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
      "--smart-chip-text": t.chipText || "var(--smart-primary)"
    };
  }, [merged.theme]);
  return /* @__PURE__ */ jsx(SmartUIContext.Provider, { value: __spreadProps(__spreadValues({}, merged), { resolvedTheme }), children: /* @__PURE__ */ jsx("div", { style: resolvedTheme, children }) });
}
function useSmartUIConfig() {
  return useContext(SmartUIContext);
}
var DEFAULT_TRENDING = [
  "high priority bugs this week",
  "open tasks assigned to me",
  "features due this sprint",
  "critical issues updated today",
  "unresolved bugs last month"
];
function SmartSearch({
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
  trending
}) {
  var _a, _b, _c;
  const providerConfig = useSmartUIConfig();
  const resolvedEndpoint = (_a = apiEndpoint != null ? apiEndpoint : providerConfig.apiEndpoint) != null ? _a : "/api/suggest";
  const resolvedDebounce = (_b = debounceMs != null ? debounceMs : providerConfig.debounceMs) != null ? _b : 300;
  const resolvedMinLength = (_c = minQueryLength != null ? minQueryLength : providerConfig.minQueryLength) != null ? _c : 2;
  const trendingItems = trending != null ? trending : DEFAULT_TRENDING;
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState(
    {}
  );
  const inputRef = useRef(null);
  const { suggestions, analysis, loading, getSuggestion, clearSuggestion } = useAISuggestion({
    apiEndpoint: resolvedEndpoint,
    debounceMs: resolvedDebounce,
    minLength: resolvedMinLength
  });
  const ai = analysis;
  const isComplex = ai == null ? void 0 : ai.is_complex;
  const intent = ai == null ? void 0 : ai.intent;
  const related = ai == null ? void 0 : ai.related;
  const suggestion = suggestions[0] || "";
  const showGhost = query.length > 0 && suggestion.toLowerCase().startsWith(query.toLowerCase());
  const ghostText = showGhost ? suggestion.slice(query.length) : "";
  const showCorrection = !showGhost && !loading && query.length > 2 && suggestion.length > 0 && suggestion.toLowerCase().trim() !== query.toLowerCase().trim();
  useEffect(() => {
    const raw = ai == null ? void 0 : ai.filters;
    if (raw && typeof raw === "object") {
      const valid = Object.fromEntries(
        Object.entries(raw).filter(
          ([, v]) => v !== null && v !== void 0 && v !== ""
        )
      );
      setActiveFilters(valid);
      onFiltersChange == null ? void 0 : onFiltersChange(valid);
    } else if (!analysis) {
      setActiveFilters({});
    }
  }, [analysis]);
  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > resolvedMinLength) {
      getSuggestion(val, "Global Search", "smart_search");
    } else {
      clearSuggestion();
      setActiveFilters({});
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Tab" && (ghostText || showCorrection)) {
      e.preventDefault();
      const fullText = ghostText ? query + ghostText : suggestion;
      setQuery(fullText);
      onSearch == null ? void 0 : onSearch(fullText, analysis);
      clearSuggestion();
    }
    if (e.key === "Enter") {
      onSearch == null ? void 0 : onSearch(query, analysis);
      clearSuggestion();
    }
  };
  const handleClear = () => {
    var _a2;
    setQuery("");
    setActiveFilters({});
    clearSuggestion();
    (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
  };
  const removeFilter = (key) => {
    setActiveFilters((prev) => {
      const next = __spreadValues({}, prev);
      delete next[key];
      onFiltersChange == null ? void 0 : onFiltersChange(next);
      return next;
    });
  };
  const applyQuery = (q) => {
    var _a2;
    setQuery(q);
    getSuggestion(q, "Global Search", "smart_search");
    onSearch == null ? void 0 : onSearch(q, analysis);
    (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
  };
  const hasFilters = Object.keys(activeFilters).length > 0;
  const showRelated = !loading && !!related && related.length > 0;
  const showTrending = !query && !loading;
  const showIntelligence = !!query;
  return /* @__PURE__ */ jsx("div", { className: `w-full max-w-2xl mx-auto ${className}`, children: /* @__PURE__ */ jsxs("div", { className: `relative group ${containerClassName}`, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `relative flex items-center bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm
            transition-all duration-300 focus-within:border-primary
            focus-within:ring-4 focus-within:ring-primary/5 px-5 py-4
            ${inputWrapperClassName}`,
        children: [
          /* @__PURE__ */ jsx("div", { className: "mr-4 text-slate-400 group-focus-within:text-primary transition-colors shrink-0", children: loading ? /* @__PURE__ */ jsx(
            Loader2,
            {
              className: "w-5 h-5 animate-spin text-primary",
              "aria-hidden": "true"
            }
          ) : /* @__PURE__ */ jsx(Search, { className: "w-5 h-5", "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 h-8 flex items-center overflow-hidden", children: [
            showGhost && /* @__PURE__ */ jsxs(
              "div",
              {
                className: `absolute left-0 inset-y-0 pointer-events-none text-lg font-medium
                  select-none flex items-center whitespace-pre z-0 ${ghostTextClassName}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "opacity-0", children: query }),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: "text-slate-400 dark:text-slate-500 opacity-60",
                      "aria-hidden": "true",
                      children: ghostText
                    }
                  )
                ]
              }
            ),
            showCorrection && /* @__PURE__ */ jsx(
              "div",
              {
                className: `absolute left-0 inset-y-0 pointer-events-none text-lg font-medium
                  select-none flex items-center whitespace-pre z-0 ${ghostTextClassName}`,
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsx("span", { className: "text-primary/40 italic", children: suggestion })
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: inputRef,
                type: "text",
                value: query,
                onChange: handleChange,
                onKeyDown: handleKeyDown,
                placeholder: query ? "" : placeholder,
                "aria-label": "Smart AI Search",
                "aria-autocomplete": "both",
                "aria-activedescendant": showGhost ? "ghost-suggestion" : void 0,
                className: `w-full bg-transparent border-none focus:outline-none
                text-lg font-medium text-slate-800 dark:text-slate-100
                placeholder:text-slate-400 z-10 leading-none h-full
                ${inputClassName}`
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "ml-4 flex items-center gap-2 shrink-0",
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: `p-1.5 rounded-lg transition-all duration-500
                ${loading ? "bg-primary text-white animate-pulse" : isComplex ? "bg-emerald-500 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400"}
                ${badgeClassName}`,
                  children: /* @__PURE__ */ jsx(Zap, { className: "w-3.5 h-3.5" })
                }
              )
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `mt-3 px-1 flex flex-col gap-3 opacity-0
            group-focus-within:opacity-100 transition-opacity duration-500
            ${statusClassName}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center w-full", children: [
            /* @__PURE__ */ jsx(
              "p",
              {
                role: "status",
                "aria-live": "polite",
                className: "text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]",
                children: loading ? "AI Processing Context..." : intent ? intent : query ? "Smart Suggestions Ready" : "Type for AI-powered Search"
              }
            ),
            query && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleClear,
                "aria-label": "Clear search",
                className: `text-[10px] font-bold text-slate-400 hover:text-primary
                  uppercase tracking-widest transition-colors ${clearButtonClassName}`,
                children: "Clear"
              }
            )
          ] }),
          showIntelligence && hasFilters && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(SlidersHorizontal, { className: "w-3 h-3 text-slate-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: "Converted filters" })
            ] }),
            /* @__PURE__ */ jsx("ul", { role: "list", className: "flex flex-wrap gap-2", children: Object.entries(activeFilters).map(([key, value]) => /* @__PURE__ */ jsxs(
              "li",
              {
                className: "flex items-center gap-1.5 bg-primary/10 text-primary\n                      pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium",
                children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-primary/50 font-normal", children: [
                    key,
                    ":"
                  ] }),
                  /* @__PURE__ */ jsx("span", { children: String(value) }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => removeFilter(key),
                      "aria-label": `Remove ${key} filter`,
                      className: "ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors",
                      children: /* @__PURE__ */ jsx(X, { className: "w-2.5 h-2.5" })
                    }
                  )
                ]
              },
              key
            )) })
          ] }),
          showIntelligence && showRelated && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(CornerDownRight, { className: "w-3 h-3 text-slate-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: "Related searches" })
            ] }),
            /* @__PURE__ */ jsx("ul", { role: "list", className: "flex flex-wrap gap-2", children: related.map((term, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => applyQuery(term),
                className: "text-xs font-medium px-2.5 py-1 rounded-full\n                        bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300\n                        hover:bg-primary/10 hover:text-primary transition-colors",
                children: term
              }
            ) }, i)) })
          ] }),
          showTrending && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(TrendingUp, { className: "w-3 h-3 text-slate-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest", children: "Trending searches" })
            ] }),
            /* @__PURE__ */ jsx("ul", { role: "list", className: "flex flex-wrap gap-2", children: trendingItems.map((term, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => applyQuery(term),
                className: "text-xs font-medium px-2.5 py-1 rounded-full\n                        bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300\n                        hover:bg-primary/10 hover:text-primary transition-colors",
                children: term
              }
            ) }, i)) })
          ] })
        ]
      }
    )
  ] }) });
}
var cache = /* @__PURE__ */ new Map();
var CACHE_TTL = 6e4;
function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}
function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}
function useSmartFormAutofill({
  fieldName,
  fieldType = "text",
  formContext = {},
  apiEndpoint = "/api/suggest",
  debounceMs = 350,
  minLength = 2,
  maxSuggestions = 5,
  onSelect
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const lastValueRef = useRef("");
  const listId = `autofill-list-${fieldName.replace(/\s+/g, "-")}`;
  const dismiss = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);
  const selectSuggestion = useCallback(
    (value) => {
      onSelect == null ? void 0 : onSelect(value);
      dismiss();
    },
    [onSelect, dismiss]
  );
  const fetchSuggestions = useCallback(
    (value) => {
      if (!value || value.length < minLength) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      if (value === lastValueRef.current) return;
      lastValueRef.current = value;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
      const cacheKey = `autofill:${fieldName}:${fieldType}:${value}`;
      const cached = getCached(cacheKey);
      if (cached) {
        setSuggestions(cached.slice(0, maxSuggestions));
        setIsOpen(cached.length > 0);
        return;
      }
      timerRef.current = setTimeout(() => __async(null, null, function* () {
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        setError(null);
        try {
          const customKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") || "" : "";
          const contextText = Object.entries(formContext).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ");
          const mode = "autofill";
          const res = yield fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": customKey
            },
            body: JSON.stringify({
              text: value,
              context: `Field: ${fieldName}, Type: ${fieldType}${contextText ? `, Form data: ${contextText}` : ""}`,
              mode
            }),
            signal: controller.signal
          });
          const data = yield res.json();
          if (!res.ok) throw new Error((data == null ? void 0 : data.error) || "Request failed");
          const raw = (data.suggestions || []).slice(0, maxSuggestions).map(
            (s, i) => typeof s === "string" ? { value: s, confidence: 1 - i * 0.1, source: "ai" } : s
          );
          setCached(cacheKey, raw);
          setSuggestions(raw);
          setIsOpen(raw.length > 0);
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          const msg = err instanceof Error ? err.message : "Connection error";
          setError(msg);
          setIsOpen(false);
        } finally {
          setLoading(false);
        }
      }), debounceMs);
    },
    [fieldName, fieldType, formContext, apiEndpoint, debounceMs, minLength, maxSuggestions]
  );
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen || suggestions.length === 0) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, -1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0) {
            selectSuggestion(suggestions[activeIndex].value);
          }
          break;
        case "Escape":
          dismiss();
          break;
        case "Tab":
          if (activeIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[activeIndex].value);
          } else {
            dismiss();
          }
          break;
      }
    },
    [isOpen, suggestions, activeIndex, selectSuggestion, dismiss]
  );
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);
  return {
    suggestions,
    isOpen,
    loading,
    error,
    activeIndex,
    inputProps: {
      onChange: (e) => fetchSuggestions(e.target.value),
      onKeyDown: handleKeyDown,
      onFocus: () => {
        if (suggestions.length > 0) setIsOpen(true);
      },
      onBlur: () => setTimeout(dismiss, 150),
      "aria-expanded": isOpen,
      "aria-autocomplete": "list",
      "aria-controls": listId,
      "aria-activedescendant": activeIndex >= 0 ? `${listId}-item-${activeIndex}` : void 0,
      role: "combobox"
    },
    listProps: {
      id: listId,
      role: "listbox",
      "aria-label": `Suggestions for ${fieldName}`
    },
    getItemProps: (index) => ({
      id: `${listId}-item-${index}`,
      role: "option",
      "aria-selected": index === activeIndex,
      onClick: () => selectSuggestion(suggestions[index].value),
      onMouseEnter: () => setActiveIndex(index)
    }),
    selectSuggestion,
    dismiss,
    fetchSuggestions
  };
}
var SmartFormField = forwardRef(
  function SmartFormField2(_a, forwardedRef) {
    var _b = _a, {
      label,
      fieldName,
      fieldType = "text",
      formContext = {},
      onValueChange,
      apiEndpoint,
      showBadge = true,
      containerClassName = "",
      labelClassName = "",
      inputWrapperClassName = "",
      dropdownClassName = "",
      itemClassName = "",
      activeItemClassName = "",
      value
    } = _b, inputProps = __objRest(_b, [
      "label",
      "fieldName",
      "fieldType",
      "formContext",
      "onValueChange",
      "apiEndpoint",
      "showBadge",
      "containerClassName",
      "labelClassName",
      "inputWrapperClassName",
      "dropdownClassName",
      "itemClassName",
      "activeItemClassName",
      "value"
    ]);
    const { apiEndpoint: ctxEndpoint, debounceMs } = useSmartUIConfig();
    const localRef = useRef(null);
    const ref = forwardedRef || localRef;
    const labelId = useId();
    const {
      suggestions,
      isOpen,
      loading,
      activeIndex,
      inputProps: autofillInputProps,
      listProps,
      getItemProps,
      selectSuggestion
    } = useSmartFormAutofill({
      fieldName,
      fieldType,
      formContext,
      apiEndpoint: apiEndpoint || ctxEndpoint || "/api/suggest",
      debounceMs,
      onSelect: (val) => {
        var _a2;
        if (ref.current) {
          const nativeInputValueSetter = (_a2 = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )) == null ? void 0 : _a2.set;
          nativeInputValueSetter == null ? void 0 : nativeInputValueSetter.call(ref.current, val);
          ref.current.dispatchEvent(new Event("input", { bubbles: true }));
        }
        onValueChange == null ? void 0 : onValueChange(val);
      }
    });
    return /* @__PURE__ */ jsxs("div", { className: `relative flex flex-col gap-1 ${containerClassName}`, children: [
      /* @__PURE__ */ jsxs(
        "label",
        {
          id: labelId,
          htmlFor: `smart-field-${fieldName}`,
          className: `text-sm font-medium text-slate-700 dark:text-slate-300 ${labelClassName}`,
          children: [
            label,
            showBadge && /* @__PURE__ */ jsxs(
              "span",
              {
                "aria-label": "AI-assisted field",
                className: "ml-2 inline-flex items-center gap-1 text-[10px] font-bold\n                text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest",
                children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "w-2.5 h-2.5", "aria-hidden": "true" }),
                  "AI"
                ]
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `relative flex items-center bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700 rounded-xl
            focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20
            transition-all ${inputWrapperClassName}`,
          children: [
            /* @__PURE__ */ jsx(
              "input",
              __spreadProps(__spreadValues(__spreadValues({}, inputProps), autofillInputProps), {
                ref,
                id: `smart-field-${fieldName}`,
                value,
                "aria-labelledby": labelId,
                className: `flex-1 bg-transparent px-4 py-3 text-sm text-slate-800
              dark:text-slate-100 placeholder:text-slate-400 border-none
              focus:outline-none rounded-xl ${inputProps.className || ""}`
              })
            ),
            /* @__PURE__ */ jsx("div", { className: "pr-3 flex items-center gap-1.5 shrink-0", "aria-hidden": "true", children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-primary" }) : suggestions.length > 0 ? /* @__PURE__ */ jsx(
              ChevronDown,
              {
                className: `w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`
              }
            ) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-slate-300" }) })
          ]
        }
      ),
      isOpen && suggestions.length > 0 && /* @__PURE__ */ jsx(
        "ul",
        __spreadProps(__spreadValues({}, listProps), {
          className: `absolute top-full left-0 right-0 mt-1 z-50
              bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700
              rounded-xl shadow-lg overflow-hidden py-1
              max-h-48 overflow-y-auto ${dropdownClassName}`,
          children: suggestions.map((s, i) => /* @__PURE__ */ jsxs(
            "li",
            __spreadProps(__spreadValues({}, getItemProps(i)), {
              className: `px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between
                  transition-colors
                  ${i === activeIndex ? `bg-primary/10 text-primary font-medium ${activeItemClassName}` : `text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 ${itemClassName}`}`,
              children: [
                /* @__PURE__ */ jsx("span", { children: s.value }),
                s.confidence >= 0.9 && /* @__PURE__ */ jsx(
                  Sparkles,
                  {
                    className: "w-3 h-3 text-amber-400 shrink-0",
                    "aria-label": "High confidence"
                  }
                )
              ]
            }),
            i
          ))
        })
      )
    ] });
  }
);
SmartFormField.displayName = "SmartFormField";

export { SmartFormField, SmartSearch, SmartUIProvider, useAISuggestion, useSmartFormAutofill, useSmartUIConfig };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map