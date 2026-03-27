import { useState, useRef, useCallback, useEffect } from "react";

export type AISuggestionMode =
  | "completion"
  | "search"
  | "chat"
  | "rewrite"
  | "analysis"
  | "fix"
  | "filter"
  | "smart_search";

export interface UseAISuggestionOptions {
  /** API endpoint for suggestions (default: "/api/suggest") */
  apiEndpoint?: string;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Minimum characters before triggering (default: 2) */
  minLength?: number;
}

export const useAISuggestion = (options: UseAISuggestionOptions | number = {}) => {
  // Backwards-compatible: accept a number (old API) or options object
  const opts = typeof options === "number"
    ? { debounceMs: options }
    : options;
  const {
    apiEndpoint = "/api/suggest",
    debounceMs = 300,
    minLength = 2,
  } = opts;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef<string>("");

  const getSuggestion = useCallback(
    (text: string, context?: string, mode: AISuggestionMode = "completion") => {
      if (!text || text.trim().length < minLength) {
        setSuggestions([]);
        setAnalysis(null);
        setError(null);
        lastTextRef.current = "";
        return;
      }

      // Don't call API if text hasn't changed
      if (text === lastTextRef.current) return;
      lastTextRef.current = text;

      // Clear previous debounce & abort ongoing request
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();

      const fetchSuggestion = async () => {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setLoading(true);
        setError(null);

        try {
          let customKey = "";
          if (typeof window !== "undefined") {
            customKey = localStorage.getItem("gemini_api_key") || "";
          }

          const res = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": customKey,
            },
            body: JSON.stringify({ text, context, mode }),
            signal: controller.signal,
          });

          const textResponse = await res.text();
          let data: any = null;
          try {
            data = JSON.parse(textResponse);
          } catch {
            throw new Error("Unable to parse AI response.");
          }

          if (!res.ok) {
            throw new Error(data?.error || `Request failed (${res.status})`);
          }

          setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
          setAnalysis(data?.analysis ?? null);
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === "AbortError") return;

          const message = err instanceof Error ? err.message : "Connection error";
          setError(message);
          setSuggestions([]);
          setAnalysis(null);
        } finally {
          setLoading(false);
        }
      };

      // Debounce all modes
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
    clearSuggestion,
  };
};