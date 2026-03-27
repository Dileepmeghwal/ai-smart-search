import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export type AISuggestionMode =
  | "completion"
  | "search"
  | "chat"
  | "rewrite"
  | "analysis"
  | "fix"
  | "filter"
  | "smart_search"
  | "autofill";

export async function POST(req: Request) {
  try {
    const { text, context, mode = "completion" } = await req.json();
    const customKey = req.headers.get("x-api-key");

    if (!text || text.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    let modelInstance: ReturnType<typeof getGeminiModel>;
    try {
      modelInstance = getGeminiModel(customKey || undefined);
    } catch {
      return NextResponse.json(
        {
          suggestions: [],
          error: "Missing or invalid API key. Please configure your Gemini API Key in settings.",
        },
        { status: 401 }
      );
    }

    let prompt = "";

    switch (mode) {
      case "completion":
        prompt = `You are a writing assistant. Complete the user's sentence naturally. User text: "${text}". Max 12 words. Plain text only.`;
        break;

      case "search":
        prompt = `Suggest 4 relevant search terms or navigation paths for: "${text}". Return JSON array of strings.`;
        break;

      case "chat":
        prompt = `Briefly answer this as a smart helper (max 15 words): "${text}". Plain text only.`;
        break;

      case "rewrite":
        prompt = `Rewrite this text professionally and clearly: "${text}". Return 2 variations as JSON array of strings.`;
        break;

      case "analysis":
        prompt = `Analyze tone, sentiment, and quality of: "${text}". Return JSON: { "tone": "...", "sentiment": "...", "suggestions": ["...", "..."], "score": 0-100 }`;
        break;

      case "fix":
        prompt = `Fix grammar/spelling in: "${text}". Return corrected text only.`;
        break;

      case "filter":
        prompt = `Convert this natural language query into structured filters.
Query: "${text}"
Context: ${context || "General"}
Return ONLY a JSON object: { "filters": { ... } }.
Example: "Show high priority bugs assigned to John created last week"
Output: { "filters": { "type": "bug", "priority": "high", "assignee": "John", "created": "last_week" } }`;
        break;

      case "autofill":
        prompt = `You are a smart form autofill assistant. The user is typing in a form field.

Field info: ${context || "text input"}
Current input: "${text}"

Generate ${5} helpful autofill suggestions that complete or improve the user's input.
Rules:
- Suggestions must be relevant to the field type and context
- Each suggestion should be a complete, usable value (not a fragment)
- Order by most likely match first
- For email fields: complete the domain if partial
- For name fields: suggest full names based on partial input
- For address fields: suggest plausible addresses
- For search/text fields: suggest complete phrases

Return ONLY a JSON array of strings (no explanation, no markdown):
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]`;
        break;

      case "smart_search":
        prompt = `You are a smart search assistant. Analyze the search query and return a rich JSON response.

━━ FILTER EXTRACTION ━━
Extract structured filters when the query implies them. Supported keys:
- type       : bug | feature | task | issue | ticket | doc | pr
- priority   : low | medium | high | critical | urgent
- status     : open | closed | resolved | pending | in_progress | done
- assignee   : person name
- author     : creator name
- label      : tag or category keyword
- project    : project or team name
- created / updated / due : today | yesterday | last_week | last_month | this_week | this_month | YYYY-MM-DD
- sprint     : sprint name or number

━━ REFORMULATION ━━
If the query is vague, misspelled, or could be phrased better, provide a cleaner version.
Only set "reformulation" if it meaningfully improves the query. Otherwise null.

━━ RELATED SEARCHES ━━
Provide 3–4 short, distinct related search queries the user might also want.

━━ EXAMPLES ━━
Query: "Show high priority bugs assigned to John created last week"
Output: {
  "completion": "Show high priority bugs assigned to John created last week",
  "filters": { "type": "bug", "priority": "high", "assignee": "John", "created": "last_week" },
  "intent": "Filter bugs by priority, assignee & date",
  "is_complex": true,
  "reformulation": null,
  "related": ["open bugs assigned to John", "all bugs this month", "John's resolved tasks", "critical bugs last week"]
}

Query: "crtical isuess updated tody"
Output: {
  "completion": "critical issues updated today",
  "filters": { "type": "issue", "priority": "critical", "updated": "today" },
  "intent": "Critical issues updated today",
  "is_complex": true,
  "reformulation": "critical issues updated today",
  "related": ["open critical issues", "issues updated this week", "all critical bugs", "recently updated tasks"]
}

Query: "how to center a div"
Output: {
  "completion": "how to center a div in CSS using flexbox",
  "filters": null,
  "intent": "General search",
  "is_complex": false,
  "reformulation": null,
  "related": ["CSS flexbox centering guide", "center div vertically and horizontally", "CSS grid layout tips", "align items center CSS"]
}

Now analyze:
Query: "${text}"

Return ONLY valid JSON — no markdown, no explanation:
{
  "completion": "natural completion of the query",
  "filters": { "key": "value" } or null,
  "entities": ["extracted noun phrases"] or null,
  "intent": "Short title of detected action (max 6 words)",
  "is_complex": boolean,
  "reformulation": "improved query string" or null,
  "related": ["related query 1", "related query 2", "related query 3"]
}`;
        break;

      default:
        prompt = `Provide a helpful response for: "${text}"`;
    }

    const result = await modelInstance.generateContent(prompt);
    const responseText = result.response.text().trim();

    let suggestions: string[] = [];
    let analysis: Record<string, unknown> | null = null;

    // Mode-specific parsing
    if (mode === "smart_search") {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
        suggestions = [data.completion || ""];
        analysis = {
          filters: data.filters,
          entities: data.entities,
          intent: data.intent,
          is_complex: (data.filters && Object.keys(data.filters).length > 0) || (data.entities && data.entities.length > 0) || !!data.is_complex,
          reformulation: data.reformulation,
          related: data.related,
          raw: data,
        };
      } catch {
        console.error("Smart Search Parse Error");
        suggestions = [responseText];
      }
    } else if (mode === "autofill") {
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
        suggestions = Array.isArray(parsed)
          ? parsed.filter((s: unknown) => typeof s === "string").slice(0, 5)
          : [];
      } catch {
        suggestions = responseText
          .split("\n")
          .map((s: string) => s.replace(/^[\d\-\*\.\s]+/, "").replace(/^["']|["']$/g, "").trim())
          .filter(Boolean)
          .slice(0, 5);
      }
    } else if (mode === "analysis" || mode === "filter") {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      } catch {
        console.error(`${mode} Parse Error`);
      }
    } else if (mode === "search" || mode === "rewrite") {
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      } catch {
        suggestions = responseText
          .split("\n")
          .map((s: string) => s.replace(/^\d+\.\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 4);
      }
    } else {
      suggestions = [responseText.replace(/^["'\s]+|["'\s]+$/g, "").trim()];
    }

    return NextResponse.json({ suggestions, analysis });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("AI API Error:", errorMsg);
    return NextResponse.json(
      { suggestions: [], error: `API Failure: ${errorMsg}` },
      { status: 500 }
    );
  }
}
