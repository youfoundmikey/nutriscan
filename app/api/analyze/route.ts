import { askClaudeJSON } from "@/lib/claude";
import { resolveItems, type AiItem } from "@/lib/nutrition";

// We ask the model only to IDENTIFY foods and ESTIMATE portions in grams — the
// things vision is actually good at. Real macros are then pulled from the USDA
// database (with a web-search fallback) in lib/nutrition. See that file for why.
const SYSTEM = `You are a nutrition vision assistant. The user sends a photo of food.
Break the meal into its distinct components and estimate the portion of EACH in grams.
Respond ONLY with a JSON object, no prose, no markdown fences:
{
  "name": "short dish name for the whole meal",
  "serving": "overall portion, e.g. '1 plate (~450g)'",
  "items": [
    {
      "food": "specific component name, e.g. 'grilled chicken breast'",
      "grams": number,                 // estimated edible weight of this component
      "query": "clean search term for a nutrition database, e.g. 'chicken breast, grilled'",
      "branded": false,                // true ONLY if it's clearly a packaged/restaurant item (e.g. 'Big Mac')
      "calories": number,              // your best estimate for this portion (fallback only)
      "protein": number, "carbs": number, "fat": number
    }
  ],
  "notes": "one short sentence: key assumption or health note"
}
List every visible component separately (proteins, grains, sauces, sides, drinks).
If the image clearly contains no food, return {"error": "no_food"}.`;

export async function POST(request: Request) {
  try {
    const { image, mediaType } = await request.json();
    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }
    const ai = (await askClaudeJSON(
      SYSTEM,
      [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType || "image/jpeg",
            data: image,
          },
        },
        { type: "text", text: "Analyze this food photo." },
      ],
      2000
    )) as {
      error?: string;
      name?: string;
      serving?: string;
      items?: AiItem[];
      notes?: string;
    };

    if (ai.error) return Response.json({ error: ai.error });

    const items = Array.isArray(ai.items) ? ai.items : [];
    const { items: resolved, totals } = await resolveItems(items);

    return Response.json({
      name: ai.name ?? "Meal",
      serving: ai.serving ?? "",
      ...totals,
      items: resolved,
      notes: ai.notes,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
