import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';
import { ReactNode } from 'react';

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
    /** Custom trending searches shown when input is empty */
    trending?: string[];
}
declare function SmartSearch({ placeholder, className, containerClassName, inputWrapperClassName, inputClassName, ghostTextClassName, statusClassName, badgeClassName, clearButtonClassName, onSearch, onFiltersChange, apiEndpoint, debounceMs, minQueryLength, trending, }: SmartSearchProps): react_jsx_runtime.JSX.Element;

interface AutofillSuggestion {
    value: string;
    confidence: number;
    source: "history" | "ai" | "pattern";
}
interface UseSmartFormAutofillOptions {
    fieldName: string;
    fieldType?: "text" | "email" | "name" | "address" | "search" | "custom";
    formContext?: Record<string, string>;
    apiEndpoint?: string;
    debounceMs?: number;
    minLength?: number;
    maxSuggestions?: number;
    onSelect?: (value: string) => void;
}
interface UseSmartFormAutofillReturn {
    suggestions: AutofillSuggestion[];
    isOpen: boolean;
    loading: boolean;
    error: string | null;
    activeIndex: number;
    inputProps: {
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
        onKeyDown: (e: React.KeyboardEvent) => void;
        onFocus: () => void;
        onBlur: () => void;
        "aria-expanded": boolean;
        "aria-autocomplete": "list";
        "aria-controls": string;
        "aria-activedescendant": string | undefined;
        role: "combobox";
    };
    listProps: {
        id: string;
        role: "listbox";
        "aria-label": string;
    };
    getItemProps: (index: number) => {
        id: string;
        role: "option";
        "aria-selected": boolean;
        onClick: () => void;
        onMouseEnter: () => void;
    };
    selectSuggestion: (value: string) => void;
    dismiss: () => void;
    fetchSuggestions: (value: string) => void;
}
declare function useSmartFormAutofill({ fieldName, fieldType, formContext, apiEndpoint, debounceMs, minLength, maxSuggestions, onSelect, }: UseSmartFormAutofillOptions): UseSmartFormAutofillReturn;

interface SmartFormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onKeyDown"> {
    label: string;
    fieldName: string;
    fieldType?: UseSmartFormAutofillOptions["fieldType"];
    formContext?: Record<string, string>;
    onValueChange?: (value: string) => void;
    /** Override API endpoint (falls back to SmartUIProvider or /api/suggest) */
    apiEndpoint?: string;
    /** Show AI badge */
    showBadge?: boolean;
    /** Container class */
    containerClassName?: string;
    /** Label class */
    labelClassName?: string;
    /** Input wrapper class */
    inputWrapperClassName?: string;
    /** Dropdown class */
    dropdownClassName?: string;
    /** Suggestion item class */
    itemClassName?: string;
    /** Active suggestion item class */
    activeItemClassName?: string;
}
declare const SmartFormField: react.ForwardRefExoticComponent<SmartFormFieldProps & react.RefAttributes<HTMLInputElement>>;

type AISuggestionMode = "completion" | "search" | "chat" | "rewrite" | "analysis" | "fix" | "filter" | "smart_search";
interface UseAISuggestionOptions {
    /** API endpoint for suggestions (default: "/api/suggest") */
    apiEndpoint?: string;
    /** Debounce delay in ms (default: 300) */
    debounceMs?: number;
    /** Minimum characters before triggering (default: 2) */
    minLength?: number;
}
declare const useAISuggestion: (options?: UseAISuggestionOptions | number) => {
    suggestions: string[];
    suggestion: string;
    analysis: Record<string, unknown>;
    loading: boolean;
    error: string;
    getSuggestion: (text: string, context?: string, mode?: AISuggestionMode) => void;
    clearSuggestion: () => void;
};

interface SmartUITheme {
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
interface SmartUIPlugin {
    name: string;
    onQueryChange?: (query: string) => void;
    onFiltersChange?: (filters: Record<string, string>) => void;
    onSearch?: (query: string, metadata: Record<string, unknown> | null) => void;
    transformSuggestions?: (suggestions: string[]) => string[];
    renderExtension?: (query: string) => ReactNode;
}
interface SmartUIConfig {
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
declare function SmartUIProvider({ children, config, }: {
    children: ReactNode;
    config?: SmartUIConfig;
}): react_jsx_runtime.JSX.Element;
declare function useSmartUIConfig(): SmartUIContextValue;

export { type AISuggestionMode, type AutofillSuggestion, SmartFormField, SmartSearch, type SmartUIConfig, type SmartUIPlugin, SmartUIProvider, type SmartUITheme, type UseSmartFormAutofillOptions, type UseSmartFormAutofillReturn, useAISuggestion, useSmartFormAutofill, useSmartUIConfig };
