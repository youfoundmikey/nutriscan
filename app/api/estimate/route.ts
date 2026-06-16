import { askClaudeJSON } from "@/lib/claude";
import { resolveItems, type AiItem } from "@/lib/nutrition";

// Identify + portion only; real macros come from USDA / web in lib/nutrition.
const SYSTEM = `You are a nutrition estimation assistant. The user describes a meal in plain text.
Break the meal into its distinct components and estimate the portion of EACH in grams
(assume typical portions when unspecified).
Respond ONLY with a JSON object, no prose, no markdown fences:
{
  "name": "short dish name for the whole meal",
  "serving": "assumed overall portion",
  "items": [
    {
      "food": "specific component name, e.g. 'white rice, cooked'",
      "grams": number,                 // estimated edible weight of this component
      "query": "clean search term for a nutrition database",
      "branded": false,                // true ONLY if it's clearly a packaged/restaurant item
      "calories": number,              // your best estimate for this portion (fallback only)
      "protein": number, "carbs": number, "fat": number
    }
  ],
  "notes": "one short sentence about your assumptions"
}
List every component the user mentions separately.`;

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    if (!description?.trim()) {
      return Response.json({ error: "No description" }, { status: 400 });
    }
    const ai = (await askClaudeJSON(
      SYSTEM,
      [{ type: "text", text: description.slice(0, 1000) }],
      2000
    )) as {
      name?: string;
      serving?: string;
      items?: AiItem[];
      notes?: string;
    };

    const items = Array.isArray(ai.items) ? ai.items : [];
    const { items: resolved, totals } = await resolveItems(items);

    return Response.json({
      name: ai.name ?? description.slice(0, 60),
      serving: ai.serving ?? "",
      ...totals,
      items: resolved,
      notes: ai.notes,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Estimate failed" },
      { status: 500 }
    );
  }
}
