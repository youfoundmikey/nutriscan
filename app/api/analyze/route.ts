import { askClaudeJSON } from "@/lib/claude";

const SYSTEM = `You are a nutrition analysis assistant. The user sends a photo of food.
Identify the food and estimate its nutrition for the visible portion.
Respond ONLY with a JSON object, no prose, no markdown fences:
{
  "name": "short dish name",
  "serving": "estimated portion, e.g. '1 bowl (~350g)'",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "notes": "one short sentence: key assumption or health note"
}
If the image clearly contains no food, return {"error": "no_food"}.`;

export async function POST(request: Request) {
  try {
    const { image, mediaType } = await request.json();
    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }
    const result = await askClaudeJSON(SYSTEM, [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType || "image/jpeg",
          data: image,
        },
      },
      { type: "text", text: "Analyze this food photo." },
    ]);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
