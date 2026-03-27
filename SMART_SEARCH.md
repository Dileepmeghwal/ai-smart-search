# SmartSearch Component

> AI-powered search input for Next.js — converts natural language into structured filters, suggests completions, fixes typos, and surfaces related queries in real time.

---

## Table of Contents

1. [Overview](#overview)
2. [Use Cases](#use-cases)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [File Structure](#file-structure)
6. [Setup & Configuration](#setup--configuration)
7. [Props API](#props-api)
8. [AI Response Schema](#ai-response-schema)
9. [Supported Filter Keys](#supported-filter-keys)
10. [Customization](#customization)
11. [Reusability](#reusability)
12. [Examples](#examples)

---

## Overview

`SmartSearch` is a React client component that wraps a standard text input with a full AI intelligence layer powered by Google Gemini. As the user types, it sends the query to a Next.js API route (`/api/suggest`) which analyses the text and returns structured data — completions, extracted filters, intent labels, spelling corrections, and related searches — all rendered inline beneath the input.

The component is self-contained: it manages its own AI state via the `useAISuggestion` hook, handles debounced API calls, and exposes clean callbacks so parent components can consume the parsed data without knowing anything about the AI layer.

---

## Use Cases

| Scenario | How SmartSearch helps |
|---|---|
| **Project management tools** | Parse `"open bugs assigned to Sarah this sprint"` into `type=bug`, `status=open`, `assignee=Sarah`, `sprint=current` |
| **Issue trackers / bug dashboards** | Convert `"critical issues updated today"` into structured database filters |
| **Internal developer portals** | Let engineers search docs, PRs, or tickets in plain English |
| **E-commerce search** | Extract product attributes from `"red running shoes under $80 in size 10"` |
| **HR / people tools** | Parse `"engineers hired last month in the design team"` |
| **Support ticket systems** | Route queries like `"unresolved high-priority tickets from last week"` |
| **General search bars** | Ghost-text completion and related suggestions improve any search UX |
| **Command palettes** | Embed as a `Cmd+K` style launcher with AI-powered context |

---

## Features

### 1. Ghost Text Completion
While typing, the AI predicts a natural completion for the query. The predicted suffix appears inline in grey after the cursor.

- Press **Tab** to accept the full suggestion — the query is replaced with the completion and `onSearch` is fired.
- The ghost text only appears when the suggestion starts with the current query (case-insensitive prefix match), ensuring the overlay never looks wrong.

### 2. Natural Language → Structured Filters
The most powerful feature. When a query implies filters (priority, assignee, date, type, etc.), the AI extracts them into a key/value object and renders them as removable chips below the input.

```
Input:  "Show high priority bugs assigned to John created last week"

Chips:  [type: bug ×]  [priority: high ×]  [assignee: John ×]  [created: last_week ×]
```

- Chips are rendered with a **×** button to remove individual filters without clearing the whole query.
- The `onFiltersChange` callback fires on every AI update and on every individual chip removal, giving the parent the live filter state.
- Supports 11 filter key types — see [Supported Filter Keys](#supported-filter-keys).

### 3. "Did You Mean?" Reformulation
If the query is misspelled, ambiguous, or phrased poorly, the AI returns a `reformulation`. It is shown as a clickable suggestion:

```
✦  Did you mean:  critical issues updated today  ?
```

Clicking the suggestion replaces the input and triggers a new AI analysis. The reformulation row is suppressed when it matches the original query exactly (so typo-free queries never show it).

### 4. Related Searches
After processing any query, the AI returns 3–4 contextually relevant related searches. They appear as clickable pill buttons:

```
Related searches:
[open bugs assigned to John]  [all bugs this month]  [John's resolved tasks]  [critical bugs last week]
```

Clicking any pill calls `applyQuery`, which updates the input, triggers a new AI call, and fires `onSearch`.

### 6. AI Badge (Complexity Indicator)
A `⚡` icon badge on the right side of the input changes state to communicate AI status:

| State | Appearance |
|---|---|
| Idle | Grey background, grey icon |
| Loading / processing | Primary colour, pulsing animation |
| Complex query detected | Emerald green — indicates filters or entities were extracted |

### 7. Intent Label
Below the input, a small uppercase status line shows the AI-detected intent label (e.g. `"Filter bugs by priority, assignee & date"`). While loading it reads `"AI Processing Context..."`. This gives the user immediate feedback that the AI understood the query.

### 8. Debounced API Calls
API requests are debounced by **300 ms** (configurable in `useAISuggestion`). The hook also tracks the last submitted text and skips the API call when the value hasn't changed since the previous request, avoiding redundant network traffic.

### 9. Request Cancellation
Every in-flight request is tracked via an `AbortController`. When a new keystroke arrives before the previous request completes, the old request is aborted immediately. This prevents stale responses from overwriting fresh ones.

### 10. Loading State
The search icon is replaced with an animated `Loader2` spinner while the AI is processing, giving clear visual feedback without layout shift.

### 11. Clear Button
A "Clear" button appears in the status row whenever the input has text. It resets the query, all active filters, and all AI state in one action, and returns focus to the input.

### 12. Accessibility
- `role="combobox"` on the input with `aria-autocomplete="both"` and `aria-expanded`.
- `role="status"` + `aria-live="polite"` on the intent label so screen readers announce AI results.
- `aria-label="Smart AI Search"` on the input.
- `aria-label` on every filter remove button (`"Remove priority filter"`, etc.).
- Ghost text overlay uses `aria-hidden="true"` so it is invisible to assistive technology.

### 13. Dark Mode
Every element uses Tailwind's `dark:` variants. The component adapts automatically to the system colour scheme via `prefers-color-scheme` (or Tailwind's `dark` class strategy).

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI library | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS v4 | ^4 |
| Icons | lucide-react | ^0.577 |
| AI model | Google Gemini (flash-lite) | gemini-3.1-flash-lite-preview |
| Gemini SDK | @google/generative-ai | ^0.24.1 |
| Animation | Tailwind utilities (`animate-pulse`, `transition`, `duration`) | — |

---

## File Structure

```
src/
├── app/
│   ├── components/
│   │   └── smart/
│   │       └── SmartSearch.tsx       ← The component
│   ├── api/
│   │   └── suggest/
│   │       └── route.ts              ← Next.js API route (Gemini calls)
│   ├── globals.css                   ← CSS theme variables (--color-primary etc.)
│   └── page.tsx                      ← Usage example
├── hooks/
│   └── useAISuggestion.ts            ← Debounce + fetch + abort logic
└── lib/
    └── gemini.ts                     ← Gemini model initialisation
```

---

## Setup & Configuration

### 1. Install dependencies

```bash
npm install @google/generative-ai lucide-react
```

### 2. Set your Gemini API key

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Alternatively, the key can be supplied at runtime by storing it in `localStorage` under the key `"gemini_api_key"`. The hook reads it automatically on every request, so users can configure their own key without a server restart.

### 3. Run the dev server

```bash
npm run dev
```

---

## Props API

| Prop | Type | Default | Description |
|---|---|---|---|
| `placeholder` | `string` | `"Search anything with AI..."` | Input placeholder text |
| `className` | `string` | `""` | Class applied to the outermost `<div>` wrapper |
| `containerClassName` | `string` | `""` | Class applied to the inner `relative group` container |
| `inputWrapperClassName` | `string` | `""` | Class applied to the bordered input pill |
| `inputClassName` | `string` | `""` | Class applied to the `<input>` element |
| `ghostTextClassName` | `string` | `""` | Class applied to the ghost text overlay wrapper |
| `statusClassName` | `string` | `""` | Class applied to the AI intelligence panel below the input |
| `badgeClassName` | `string` | `""` | Class applied to the `⚡` badge on the right of the input |
| `clearButtonClassName` | `string` | `""` | Class applied to the Clear button |
| `onSearch` | `(value: string, metadata?: Record<string, unknown> \| null) => void` | — | Fired on Enter, Tab-accept, or clicking a suggestion/related pill |
| `onFiltersChange` | `(filters: Record<string, string>) => void` | — | Fired whenever the active filter set changes (AI update or chip removal) |

---

## AI Response Schema

The `/api/suggest` route returns the following JSON for `smart_search` mode. All fields are available in the `metadata` argument passed to `onSearch`.

```ts
{
  suggestions: string[];        // [0] = ghost text completion
  analysis: {
    filters:       Record<string, string> | null;  // extracted key/value filters
    entities:      string[] | null;                // extracted noun phrases
    intent:        string;                         // short intent label (max 6 words)
    is_complex:    boolean;                        // true when filters/entities found
    reformulation: string | null;                  // improved query, or null
    related:       string[];                       // 3–4 related search queries
    raw:           object;                         // full raw Gemini response
  }
}
```

---

## Supported Filter Keys

| Key | Accepted values |
|---|---|
| `type` | `bug` · `feature` · `task` · `issue` · `ticket` · `doc` · `pr` |
| `priority` | `low` · `medium` · `high` · `critical` · `urgent` |
| `status` | `open` · `closed` · `resolved` · `pending` · `in_progress` · `done` |
| `assignee` | Any person name (e.g. `"John"`, `"Sarah"`) |
| `author` | Any person name |
| `label` | Any tag or category string |
| `project` | Project or team name |
| `created` | `today` · `yesterday` · `last_week` · `last_month` · `this_week` · `this_month` · `YYYY-MM-DD` |
| `updated` | Same as `created` |
| `due` | Same as `created` |
| `sprint` | Sprint name or number |

---

## Customization

### Changing the primary colour

The `primary` colour token is defined in `src/app/globals.css` using a Tailwind v4 `@theme` block:

```css
@theme {
  --color-primary: #6366f1;        /* indigo — change this */
  --color-primary-hover: #4f46e5;
}
```

Every filter chip, focus ring, badge active state, and hover effect references `bg-primary` / `text-primary`, so this one change recolours the entire component.

### Changing the debounce delay

Pass a number (milliseconds) to `useAISuggestion` inside `SmartSearch.tsx`:

```ts
const { ... } = useAISuggestion(500); // 500 ms debounce
```

### Overriding layout via className props

Every structural element in the component accepts a `className` prop, so you can override sizing, spacing, border-radius, and shadows without touching the source:

```tsx
<SmartSearch
  inputWrapperClassName="rounded-lg py-3 px-4"   // smaller, square pill
  statusClassName="mt-1"                          // tighter spacing below
  badgeClassName="hidden"                         // hide the ⚡ badge
  className="max-w-xl"                            // narrower max width
/>
```

### Replacing the Gemini model

In `src/lib/gemini.ts`, change the `model` string:

```ts
return genAI.getGenerativeModel({
  model: "gemini-1.5-pro",   // or "gemini-1.5-flash", "gemini-2.0-flash", etc.
});
```

---

## Reusability

### Using in a different Next.js project

1. Copy these four files into your project:
   - `src/app/components/smart/SmartSearch.tsx`
   - `src/hooks/useAISuggestion.ts`
   - `src/app/api/suggest/route.ts`
   - `src/lib/gemini.ts`

2. Install dependencies:
   ```bash
   npm install @google/generative-ai lucide-react
   ```

3. Add the CSS theme variable to your `globals.css`:
   ```css
   @theme {
     --color-primary: #6366f1;
   }
   ```

4. Add your API key to `.env.local`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

5. Import and use:
   ```tsx
   import SmartSearch from "@/components/smart/SmartSearch";
   ```

### Using in a non-Next.js project (React + custom backend)

- Replace `src/app/api/suggest/route.ts` with your own backend endpoint (Express, Fastify, etc.) that accepts `POST /api/suggest` with body `{ text, context, mode }` and returns `{ suggestions, analysis }`.
- The hook (`useAISuggestion`) and component need no changes — they only call `/api/suggest`.

### Embedding in a modal / command palette

Render the component inside a dialog with a fixed-width container. All layout is relative to `max-w-2xl` on the outer wrapper, which you can override:

```tsx
<dialog open>
  <SmartSearch
    className="max-w-full"
    onSearch={(q, meta) => { handleSearch(q, meta); closeDialog(); }}
  />
</dialog>
```

---

## Examples

### Minimal usage

```tsx
import SmartSearch from "@/app/components/smart/SmartSearch";

export default function Page() {
  return (
    <SmartSearch
      onSearch={(query, meta) => {
        console.log("query:", query);
        console.log("metadata:", meta);
      }}
    />
  );
}
```

---

### With filter handling

```tsx
import SmartSearch from "@/app/components/smart/SmartSearch";

export default function IssueTracker() {
  const handleSearch = (query: string, meta: Record<string, unknown> | null | undefined) => {
    console.log("Search:", query);
  };

  const handleFiltersChange = (filters: Record<string, string>) => {
    // filters is always in sync — update your query/fetch here
    console.log("Active filters:", filters);
    // e.g. { type: "bug", priority: "high", assignee: "John", created: "last_week" }
  };

  return (
    <SmartSearch
      placeholder="Search issues, bugs, tasks..."
      onSearch={handleSearch}
      onFiltersChange={handleFiltersChange}
    />
  );
}
```

---

### Custom styling (compact, purple theme)

```css
/* globals.css */
@theme {
  --color-primary: #9333ea;   /* purple */
}
```

```tsx
<SmartSearch
  placeholder="Find anything..."
  className="max-w-lg"
  inputWrapperClassName="rounded-xl py-3 px-4 shadow-none border-2"
  inputClassName="text-base"
  badgeClassName="hidden"
  onSearch={(q) => console.log(q)}
/>
```

---

### Reading the full AI metadata object

```tsx
<SmartSearch
  onSearch={(query, meta) => {
    const filters      = meta?.filters as Record<string, string> | null;
    const intent       = meta?.intent as string;
    const reformulation = meta?.reformulation as string | null;
    const related      = meta?.related as string[];
    const isComplex    = meta?.is_complex as boolean;

    console.log({ query, filters, intent, reformulation, related, isComplex });
  }}
/>
```

Sample output for `"Show high priority bugs assigned to John created last week"`:

```json
{
  "query": "Show high priority bugs assigned to John created last week",
  "filters": {
    "type": "bug",
    "priority": "high",
    "assignee": "John",
    "created": "last_week"
  },
  "intent": "Filter bugs by priority, assignee & date",
  "reformulation": null,
  "related": [
    "open bugs assigned to John",
    "all bugs this month",
    "John's resolved tasks",
    "critical bugs last week"
  ],
  "isComplex": true
}
```

---

### Providing a user-level API key at runtime

```ts
// Store the key once (e.g. from a settings modal)
localStorage.setItem("gemini_api_key", "AIza...");

// The hook reads it automatically on every request — no reload needed.
```

---

## Available AI Modes

The `/api/suggest` route supports multiple modes beyond `smart_search`. You can call `useAISuggestion` directly in other components and pass a different mode:

| Mode | What it does | Returns |
|---|---|---|
| `smart_search` | Full intelligence: filters, intent, reformulation, related | `suggestions` + `analysis` |
| `completion` | Completes a sentence naturally (max 12 words) | `suggestions[0]` |
| `search` | Returns 4 relevant search terms / navigation paths | `suggestions[]` |
| `filter` | Converts a query into structured filters only | `analysis.filters` |
| `rewrite` | Returns 2 professional rewrites of the text | `suggestions[]` |
| `analysis` | Tone, sentiment, quality score | `analysis` |
| `fix` | Grammar and spelling correction | `suggestions[0]` |
| `chat` | Short smart-assistant answer (max 15 words) | `suggestions[0]` |

---

## Development Pillars

### Smart AI-Powered UI Feature — `100% Complete`

This pillar covers everything that makes the search bar "intelligent" — the features that would not exist without the AI layer.

**What was built:**

- **Ghost text completion** — Gemini predicts and renders the rest of the user's query inline as they type. Tab accepts the full suggestion instantly.
- **Natural language → structured filters** — A plain English sentence like `"high priority bugs assigned to John last week"` is parsed into a typed key/value filter object (`{ type, priority, assignee, created }`) and rendered as removable chips in real time.
- **"Did you mean?" reformulation** — Gemini detects misspellings, vague phrasing, or incomplete sentences and surfaces a corrected version as a clickable suggestion. It is suppressed when the query is already well-formed, so it only appears when it genuinely adds value.
- **Related searches** — After every query, the AI returns 3–4 contextually relevant related searches that the user might want next. Each is a clickable pill that repopulates the input and triggers a fresh analysis.
- **Intent detection** — The AI classifies the user's intent into a short label (e.g. `"Filter bugs by priority, assignee & date"`) shown in the status bar below the input. The `⚡` badge turns green when the query is classified as complex (filters or entities detected).
- **Debounced + abortable API calls** — API requests are debounced at 300 ms and cancelled immediately when superseded by a new keystroke, keeping the UI snappy and the API bill low.
- **Runtime API key support** — Users can supply their own Gemini key via `localStorage` without any server change, making the component safe to ship in multi-tenant or personal-use contexts.

**Status:** All AI intelligence features are fully implemented, connected end-to-end to the Gemini API, and rendering correctly in the component.

---

### Reusable Smart Component Development — `In Progress`

This pillar is about making `SmartSearch` a first-class reusable component that can be dropped into any project without modification.

**What is done:**
- All visual and behavioural customisation is exposed through props (`className`, `inputWrapperClassName`, `badgeClassName`, etc.) — no internal style overrides needed.
- Clean callback API (`onSearch`, `onFiltersChange`) so the parent is fully in control of what happens with results.
- The AI layer is fully decoupled — `useAISuggestion` is a standalone hook that can be used in any other component independently of `SmartSearch`.
- The API route (`/api/suggest`) is mode-agnostic and supports 8 distinct AI modes, making it a shared backend for future smart components.
- Full copy-paste portability: 4 files, 1 env variable, 2 npm packages.

**What remains (0% of stretch goals):**
- Package the component as a standalone npm library with a `rollup` build (config scaffolding already exists in `devDependencies`).
- Publish a Storybook with interactive prop controls for each className slot.
- Add a `context` prop so the component can be told what domain it is searching (e.g. `"GitHub Issues"`, `"E-commerce Products"`) to improve AI filter extraction accuracy.
- Add a `mode` prop to let the parent switch between `smart_search`, `filter`, `search`, etc. at the component level.

---

### Accessibility & UX Consistency Improvement

This pillar ensures the component is usable by everyone and feels consistent across all contexts it is embedded in.

**Accessibility — what is implemented:**

| Attribute / Pattern | Where | Purpose |
|---|---|---|
| `role="combobox"` | `<input>` | Identifies the input as part of an autocomplete widget |
| `aria-autocomplete="both"` | `<input>` | Signals both inline and list-based suggestions |
| `aria-expanded` | `<input>` | True when a suggestion panel is visible |
| `aria-activedescendant` | `<input>` | Points to the currently highlighted ghost suggestion |
| `role="status"` + `aria-live="polite"` | Status label | Screen reader announces intent/loading changes without interrupting |
| `aria-label="Smart AI Search"` | `<input>` | Explicit label for screen readers (no visible `<label>` needed) |
| `aria-label="Remove X filter"` | Each chip `×` button | Announces which filter will be removed |
| `aria-hidden="true"` | Ghost text overlay, AI badge | Decorative elements invisible to assistive technology |

**UX consistency — what is implemented:**

- **Focus ring** — `focus-within:ring-4 focus-within:ring-primary/5` gives a soft halo on the input wrapper that matches the primary colour, consistent across any theme.
- **Transition timing** — All state changes (badge colour, icon swap, panel opacity) use `transition-all duration-300` or `duration-500` for smooth, non-jarring transitions.
- **Loading feedback** — The search icon is replaced by a spinning `Loader2` during API calls, eliminating the silent-wait problem.
- **Status panel opacity** — The intelligence panel uses `opacity-0 group-focus-within:opacity-100` so it fades in only when the user is actively interacting and fades out cleanly on blur, avoiding visual noise when the component is idle.
- **Dark mode** — Every element has an explicit `dark:` variant. No element relies solely on `currentColor` or inherited colour, preventing unexpected dark-mode rendering bugs.
- **Clear button placement** — Aligned to the right of the status row (not inside the input) to avoid accidental activation and maintain a clean input area.
- **Filter chip removal** — The `×` button on each chip is large enough to tap (32 × 32 px hit area via padding) and changes background on hover to indicate interactivity.

**What remains:**
- Add `prefers-reduced-motion` media query to disable `animate-pulse` and `animate-spin` for users with vestibular disorders.
- Add keyboard navigation through filter chips (arrow keys + Delete to remove).
- Test with VoiceOver (macOS) and NVDA (Windows) to validate the `combobox` pattern end-to-end.
