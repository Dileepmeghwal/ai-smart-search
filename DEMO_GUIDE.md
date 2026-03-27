# SmartSearch Live Demo Script

> Follow this guide to showcase the "wow" factor of the **SmartSearch** component in a live presentation.

---

## 🎬 Introduction (60 Seconds)

**Goal:** Hook the audience by defining the problem.

- **Start with the problem:** "Traditional search bars are dumb boxes. You have to speak 'machine'—exact keywords, click-heavy filter menus, and no help if you make a typo."
- **Introduce the solution:** "SmartSearch is an AI-native input that speaks human. It's powered by Gemini and turns natural language into structured data instantly."

---

## ✨ Scenario 1: The "Ghost" of Search (Ghost Text)

**Action:** Start typing a common search query slowly.

1. **Type:** `high`
2. **Observe:** The AI predicts the rest of your sentence (`priority bugs this week`) in grey text.
3. **Say:** "I haven't even finished my thought, and the AI is already anticipating my intent with zero layout shift."
4. **Key Action:** Press **Tab**. The query is instantly accepted.

---

## 🔥 Scenario 2: Talk to Your Data (Natural Language → Filters)

**Action:** Clear the search and type a complex, structured request in plain English.

1. **Type:** `Show critical bugs assigned to John created yesterday`
2. **Observe:**
    - The search icon turns into a loading spinner.
    - **Flash moment:** Below the input, interactive chips appear: `[priority: critical]` `[type: bug]` `[assignee: John]` `[created: 2026-03-25]`.
3. **Say:** "I didn't open a single dropdown. The AI extracted every parameter from my sentence into a structured object that my database can actually use."
4. **Action:** Click the **×** on the `[priority]` chip.
5. **Observe:** The chip disappears, and the `onFiltersChange` callback (if logged to console) fires with the updated JSON.

---

## 🩹 Scenario 3: The "Did You Mean?" Recovery (Typo Correction)

**Action:** Type a query with significant misspellings.

1. **Type:** `crtical isuess updtd today`
2. **Observe:**
    - The AI detects the messy input.
    - A suggestion appears below: `✦ Did you mean: critical issues updated today ?`
3. **Say:** "Even when I'm sloppy, the AI corrects my intent without forcing me to re-type."
4. **Action:** Click the suggestion. It populates the input perfectly and triggers a fresh search.

---

## 🔗 Scenario 4: Deep Diving (Related Searches)

**Action:** Type a broad query.

1. **Type:** `project design`
2. **Observe:** Below the status line, related search pills appear: `[design tasks this month]` `[open design PRs]` `[design team backlog]`.
3. **Say:** "The AI acts as a co-pilot, suggesting where I might want to go next based on my current context."
4. **Action:** Click a related pill to show how it seamlessly flows into the next search state.

---

## 🛠 Under the Hood (For Developers)

**Goal:** Briefly show why this is easy to use.

1. **Show Code:** "Adding this to your app is literally one line."
   ```tsx
   <SmartSearch onSearch={(query, meta) => handleSearch(query, meta)} />
   ```
2. **Show Metadata:** Open the Browser Console and show the JSON object returned.
   ```json
   {
     "filters": { "priority": "high", "assignee": "John" },
     "intent": "Filter by priority and assignee",
     "is_complex": true
   }
   ```
3. **Say:** "It's not just a UI; it's a data parser that removes the need for complex filter UI logic."

---

## ✅ Pro-Tips for a Flawless Demo

- **Reset often:** Use the **Clear** button in the AI panel to reset state between scenarios.
- **Tab is your friend:** Acceptance via Tab is much faster and look more 'magical' than clicking.
- **Console Log:** Keep your browser console open on the side to show the `onSearch` metadata being fired—it proves the technical depth to developers.
- **Internet:** Since this calls the Gemini API, ensure you have a stable connection.

---

**Summary for the audience:**
- **Natural Language** (No syntax to learn)
- **Zero-Click Filtering** (Chips generated from text)
- **Contextual Intelligence** (Corrections + Suggestions)
- **Developer First** (One-line implementation)
