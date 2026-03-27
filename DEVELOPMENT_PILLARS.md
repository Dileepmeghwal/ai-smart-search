# Development Pillars

> Three core principles that define how the SmartSearch component is built, maintained, and evolved.

---

## 1. Implement Smart AI-Powered UI Feature

### What It Means
Every user interaction in the component is enhanced by AI. The input field is not just a text box — it is a real-time intelligence layer that understands the user's intent, corrects their phrasing, extracts structured data from plain sentences, and surfaces relevant next steps, all without the user having to learn any special syntax.

### What Was Built

| Feature | Description |
|---|---|
| **Ghost Text Completion** | As the user types, Gemini predicts the rest of the query and renders it inline in grey. Press `Tab` to accept the full suggestion instantly. |
| **Natural Language → Filters** | A plain sentence like `"high priority bugs assigned to John last week"` is parsed into a typed filter object `{ type, priority, assignee, created }` and shown as removable chips in real time. |
| **"Did You Mean?" Reformulation** | Gemini detects typos, vague phrasing, or incomplete input and surfaces a corrected version as a clickable suggestion. Suppressed when the query is already well-formed. |
| **Related Searches** | After every query, the AI returns 3–4 contextually relevant searches the user might want next. Each is a clickable pill that repopulates the input and triggers a fresh analysis. |
| **Trending Searches** | Shown when the input is empty and focused. Guides new users toward common workflows without requiring any typing. |
| **Intent Detection** | The AI classifies each query into a short human-readable label shown in the status bar (e.g. `"Filter bugs by priority, assignee & date"`). |
| **Complexity Badge** | The `⚡` icon badge turns emerald green when filters or entities are detected, giving a visual signal that the AI understood structured intent. |

### How It Works — End to End

```
User types query
      ↓
useAISuggestion (debounce 300ms)
      ↓
POST /api/suggest  { text, mode: "smart_search" }
      ↓
Gemini API (gemini-3.1-flash-lite-preview)
      ↓
JSON response:
  { completion, filters, intent, is_complex,
    reformulation, related, entities }
      ↓
Component renders:
  • Ghost text overlay
  • Intent label in status bar
  • "Did you mean?" row
  • Converted filter chips
  • Related search pills
```

### Key Design Decisions
- **Debounce + Abort** — API calls fire 300 ms after the last keystroke. Any in-flight request is aborted immediately when a new one is triggered, preventing stale responses from overwriting fresh UI state.
- **No call on unchanged text** — The hook tracks the last submitted value and skips the API if the text has not changed, avoiding redundant network traffic on re-renders.
- **Reformulation guard** — The "Did you mean?" row compares the reformulation to the current query (case-insensitive) and only renders when they meaningfully differ, so well-typed queries never show the row.

---

## 2. Reusable Smart Component Development

### What It Means
`SmartSearch` is designed to be a drop-in component — not tightly coupled to this project. Any developer should be able to copy four files, set one environment variable, and have a fully functional AI search bar in a new codebase in under five minutes.

### What Was Built

**Prop-driven customisation**
Every structural element exposes a `className` prop so consumers can override layout, spacing, border-radius, and colours without forking the component source.

| Prop | Controls |
|---|---|
| `className` | Outer wrapper max-width, margin |
| `containerClassName` | Inner relative container |
| `inputWrapperClassName` | The bordered input pill |
| `inputClassName` | The `<input>` element itself |
| `ghostTextClassName` | Ghost text overlay |
| `statusClassName` | The entire intelligence panel below the input |
| `badgeClassName` | The `⚡` complexity badge |
| `clearButtonClassName` | The Clear button |

**Clean callback API**
The component exposes two callbacks and handles all internal AI state itself — the parent never needs to know how Gemini works.

```ts
onSearch(query: string, metadata?: Record<string, unknown> | null): void
// Fired on Enter, Tab-accept, or clicking any pill

onFiltersChange(filters: Record<string, string>): void
// Fired on every AI update and every chip removal
```

**Decoupled AI hook**
`useAISuggestion` is a standalone hook that can be used independently in any other component. It manages debounce, abort, loading, error, suggestions, and analysis state.

```ts
const { suggestions, analysis, loading, error, getSuggestion, clearSuggestion } =
  useAISuggestion(debounceMs?: number);
```

**Multi-mode API route**
`/api/suggest` is not specific to `SmartSearch`. It supports 8 modes and can power other AI-enhanced inputs across the same app.

| Mode | Use case |
|---|---|
| `smart_search` | Full intelligence — filters, reformulation, related |
| `completion` | Sentence completion for text editors |
| `search` | Navigation path suggestions |
| `filter` | Filter extraction only |
| `rewrite` | Professional rewrite variants |
| `analysis` | Tone, sentiment, quality score |
| `fix` | Grammar and spelling correction |
| `chat` | Short smart-assistant answer |

**Copy-paste portability**
To reuse in any Next.js project:
1. Copy `SmartSearch.tsx`, `useAISuggestion.ts`, `route.ts`, `gemini.ts`
2. Run `npm install @google/generative-ai lucide-react`
3. Add `GEMINI_API_KEY=...` to `.env.local`
4. Add `--color-primary` to your Tailwind theme

**What Remains**
- Package as an npm library using the existing `rollup` build config in `devDependencies`
- Publish a Storybook with interactive controls for every prop
- Add a `context` prop so the component can be told what domain it is searching (improves filter extraction)
- Add a `trendingQueries` prop to replace the static `TRENDING` array without editing source
- Add a `mode` prop to let the parent switch AI modes at the component level

---

## 3. Accessibility & UX Consistency Improvement

### What It Means
The component must be usable by everyone — keyboard-only users, screen reader users, and users who rely on high contrast or reduced motion — and must feel visually consistent across every state, theme, and context it is embedded in.

### Accessibility — What Was Built

**ARIA roles and attributes**

| Attribute | Element | Purpose |
|---|---|---|
| `role="combobox"` | `<input>` | Identifies the input as part of an autocomplete widget |
| `aria-autocomplete="both"` | `<input>` | Signals both inline (ghost) and list-based suggestions |
| `aria-expanded` | `<input>` | `true` when the intelligence panel is visible |
| `aria-activedescendant` | `<input>` | Points to the currently highlighted ghost suggestion |
| `aria-label="Smart AI Search"` | `<input>` | Explicit label for screen readers — no visible `<label>` needed |
| `role="status"` | Status paragraph | Marks the intent/loading text as a live region |
| `aria-live="polite"` | Status paragraph | Screen reader announces changes without interrupting the user |
| `aria-label="Remove X filter"` | Each chip `×` button | Announces exactly which filter will be removed |
| `aria-hidden="true"` | Ghost text overlay | Decorative — invisible to assistive technology |
| `aria-hidden="true"` | AI badge `⚡` | Decorative — invisible to assistive technology |
| `role="list"` + `role="listitem"` | Filter chips, related pills | Correct semantics for dynamic item collections |

**Keyboard interactions**

| Key | Behaviour |
|---|---|
| `Tab` | Accepts ghost text completion — fills the input with the full suggestion |
| `Enter` | Submits the current query, fires `onSearch` |

### UX Consistency — What Was Built

**Focus ring**
`focus-within:ring-4 focus-within:ring-primary/5` applies a soft, colour-matched halo to the input wrapper when any child element receives focus. Works with any primary colour.

**Transition timing**
All state changes use deliberate, consistent durations:
- `duration-300` — icon swap (Search ↔ Loader), badge colour, border colour
- `duration-500` — badge pulse, intelligence panel fade-in

**Loading feedback**
The `Search` icon is replaced with an animated `Loader2` spinner during API calls. Users always know the AI is working — there is no silent-wait period.

**Intelligence panel visibility**
The panel uses `opacity-0 group-focus-within:opacity-100 transition-opacity duration-500` — it fades in only while the user is actively interacting with the input and fades out cleanly on blur. The component is visually quiet when idle.

**Dark mode**
Every element has an explicit `dark:` variant. No element inherits colour ambiguously, preventing unexpected rendering bugs when the host application switches themes.

| Element | Light | Dark |
|---|---|---|
| Input background | `bg-white` | `dark:bg-slate-900` |
| Border | `border-slate-200` | `dark:border-slate-800` |
| Ghost text | `text-slate-400` | `dark:text-slate-500` |
| Related/trending pills | `bg-slate-100 text-slate-600` | `dark:bg-slate-800 dark:text-slate-300` |
| AI badge (idle) | `bg-slate-50 text-slate-400` | `dark:bg-slate-800 text-slate-400` |

**Filter chip UX**
- Each chip has a `×` remove button with a `hover:bg-primary/20` background transition so its interactivity is always evident.
- The chip layout uses `pl-2.5 pr-1.5` asymmetric padding to visually separate the label text from the remove button without extra margin.

**Clear button**
Placed in the status row — not inside the input — to prevent accidental activation and keep the input area uncluttered.

### What Remains
- Add `prefers-reduced-motion` media query to disable `animate-pulse` and `animate-spin` for users with vestibular disorders
- Add keyboard navigation through filter chips (Arrow keys to move, `Delete` or `Backspace` to remove)
- Add a visible `:focus-visible` outline on trending and related pill buttons for keyboard-only users
- End-to-end screen reader testing with VoiceOver (macOS) and NVDA (Windows)
- Validate colour contrast ratios against WCAG 2.1 AA for all text/background combinations in both light and dark mode
