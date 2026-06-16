// Turns the AI's itemized meal breakdown into grounded nutrition numbers.
//
// Accuracy strategy (why this is better than asking the model for one number):
//   1. The model is good at *identifying* foods and *estimating portions* in
//      grams — so that's all we ask it to do, per component.
//   2. Per-100g macros come from the authoritative USDA database, scaled by the
//      estimated grams. This removes the model's "recall the calories" guesswork.
//   3. Branded / restaurant items USDA can't match are looked up via web search.
//   4. If both fail, we keep the model's own per-item estimate so totals are
//      always at least as good as before.
//   5. Totals are summed deterministically (math, not the model).

import { askClaudeJSON } from "./claude";
import { lookupFood } from "./usda";

// One food component as proposed by the AI vision/text step.
export type AiItem = {
  food: string;
  grams?: number;
  query?: string; // a clean USDA-friendly search term, e.g. "chicken breast, grilled"
  branded?: boolean; // true for restaurant/packaged items unlikely to be in USDA
  // The model's own fallback estimate for this portion:
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type ResolvedItem = {
  food: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "usda" | "web" | "ai";
};

export type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const round = (n: number) => Math.round(Number.isFinite(n) ? n : 0);
const grams = (n: unknown) => {
  const g = Number(n);
  return Number.isFinite(g) && g > 0 ? g : 0;
};

function fromAi(item: AiItem, g: number): ResolvedItem {
  return {
    food: item.food,
    grams: g,
    calories: round(Number(item.calories) || 0),
    protein: round(Number(item.protein) || 0),
    carbs: round(Number(item.carbs) || 0),
    fat: round(Number(item.fat) || 0),
    source: "ai",
  };
}

// Look up every non-branded item in USDA (in parallel), then batch all the
// leftovers (USDA misses + branded items) into a single web-search call.
export async function resolveItems(items: AiItem[]): Promise<{
  items: ResolvedItem[];
  totals: Totals;
}> {
  const resolved: (ResolvedItem | null)[] = await Promise.all(
    items.map(async (item) => {
      const g = grams(item.grams) || 100; // default to 100g if unspecified
      if (item.branded) return null; // skip USDA, go straight to web batch
      const match = await lookupFood(item.query || item.food);
      if (!match) return null;
      const f = g / 100;
      return {
        food: item.food,
        grams: g,
        calories: round(match.calories * f),
        protein: round(match.protein * f),
        carbs: round(match.carbs * f),
        fat: round(match.fat * f),
        source: "usda" as const,
      };
    })
  );

  // Anything USDA didn't resolve gets one batched web lookup.
  const misses = items
    .map((item, i) => ({ item, i }))
    .filter(({ i }) => resolved[i] === null);

  if (misses.length > 0) {
    const webResults = await webLookup(misses.map(({ item }) => item));
    misses.forEach(({ item, i }, k) => {
      const g = grams(item.grams) || 100;
      const w = webResults[k];
      resolved[i] = w
        ? {
            food: item.food,
            grams: g,
            calories: round(w.calories),
            protein: round(w.protein),
            carbs: round(w.carbs),
            fat: round(w.fat),
            source: "web",
          }
        : fromAi(item, g); // web failed too — keep the model's estimate
    });
  }

  const finalItems = resolved.map((r, i) =>
    r ?? fromAi(items[i], grams(items[i].grams) || 100)
  );

  const totals = finalItems.reduce<Totals>(
    (t, m) => ({
      calories: t.calories + m.calories,
      protein: t.protein + m.protein,
      carbs: t.carbs + m.carbs,
      fat: t.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { items: finalItems, totals };
}

type WebMacros = { calories: number; protein: number; carbs: number; fat: number };

const WEB_SYSTEM = `You look up accurate nutrition facts using web search.
You are given a JSON array of food items, each with an estimated portion in grams.
For EACH item, search the web (prefer official brand/restaurant nutrition pages or
USDA data) and return the nutrition for THAT portion size.
Respond ONLY with a JSON array, same length and order as the input, no prose, no markdown:
[{ "calories": number, "protein": number, "carbs": number, "fat": number }]
Grams are total grams for that item. Macros are in grams. Be realistic, not optimistic.`;

// Batched web lookup for branded/restaurant items and USDA misses.
async function webLookup(items: AiItem[]): Promise<(WebMacros | null)[]> {
  const payload = items.map((it) => ({
    food: it.food,
    grams: grams(it.grams) || 100,
  }));
  try {
    const result = (await askClaudeJSON(
      WEB_SYSTEM,
      [{ type: "text", text: JSON.stringify(payload) }],
      2000,
      { web: true }
    )) as unknown;
    if (!Array.isArray(result)) return items.map(() => null);
    return items.map((_, i) => {
      const r = result[i] as Partial<WebMacros> | undefined;
      if (!r || typeof r.calories !== "number") return null;
      return {
        calories: Number(r.calories) || 0,
        protein: Number(r.protein) || 0,
        carbs: Number(r.carbs) || 0,
        fat: Number(r.fat) || 0,
      };
    });
  } catch {
    return items.map(() => null);
  }
}
