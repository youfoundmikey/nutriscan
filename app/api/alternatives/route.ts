import { askClaudeJSON } from "@/lib/claude";

const SYSTEM = `You are a practical nutrition coach helping someone order healthier at restaurants and fast food chains.
Given a restaurant/chain name, optionally what they're craving, and their goal, suggest 4 realistic menu items
(things that actually exist or are very plausible at that restaurant) ranked healthiest-first.
Include one "if you really want the indulgent thing" smarter-swap version of their craving when a craving is given.
Respond ONLY with a JSON object, no prose, no markdown fences:
{
  "restaurant": "name",
  "suggestions": [
    {
      "item": "menu item name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "why": "one sentence on why it's a good pick",
      "tip": "optional short ordering tip (e.g. 'sauce on the side'), or empty string"
    }
  ]
}
Numbers are estimates; be realistic, not optimistic.`;

export async function POST(request: Request) {
  try {
    const { restaurant, craving, goal } = await request.json();
    if (!restaurant?.trim()) {
      return Response.json({ error: "No restaurant" }, { status: 400 });
    }
    const prompt = [
      `Restaurant: ${restaurant.slice(0, 100)}`,
      craving?.trim() ? `Craving: ${craving.slice(0, 200)}` : "",
      goal?.trim() ? `Goal: ${goal.slice(0, 100)}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const result = await askClaudeJSON(SYSTEM, [{ type: "text", text: prompt }], 2000);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
