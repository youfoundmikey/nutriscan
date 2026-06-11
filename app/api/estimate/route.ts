import { askClaudeJSON } from "@/lib/claude";

const SYSTEM = `You are a nutrition estimation assistant. The user describes a meal in plain text.
Estimate nutrition for the described portion (assume typical portions when unspecified).
Respond ONLY with a JSON object, no prose, no markdown fences:
{
  "name": "short dish name",
  "serving": "assumed portion",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "notes": "one short sentence about your assumptions"
}`;

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    if (!description?.trim()) {
      return Response.json({ error: "No description" }, { status: 400 });
    }
    const result = await askClaudeJSON(SYSTEM, [
      { type: "text", text: description.slice(0, 1000) },
    ]);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Estimate failed" },
      { status: 500 }
    );
  }
}
