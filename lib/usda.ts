// USDA FoodData Central lookup — authoritative per-100g macros.
//
// Free, government-maintained nutrition database. A key isn't strictly required
// (the public "DEMO_KEY" works but is rate-limited to ~30 req/hour). For real
// use, get a free key at https://fdc.nal.usda.gov/api-key-signup.html and set
// USDA_API_KEY.

export type Per100g = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodMatch = Per100g & {
  description: string;
  dataType: string;
  fdcId: number;
};

const SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

// FoodData Central nutrient numbers (stable identifiers).
const N_ENERGY_KCAL = "208";
const N_ENERGY_ATWATER = "957"; // some Foundation foods only report this
const N_PROTEIN = "203";
const N_FAT = "204";
const N_CARBS = "205";

// Prefer curated, generic entries over the noisy Branded set. We only fall back
// to Branded when nothing else matches.
const GENERIC_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)"];
const ALL_TYPES = [...GENERIC_TYPES, "Branded"];

type RawNutrient = { nutrientNumber?: string; value?: number };
type RawFood = {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients?: RawNutrient[];
};

function nutrient(food: RawFood, number: string): number | undefined {
  const n = food.foodNutrients?.find((x) => x.nutrientNumber === number);
  return typeof n?.value === "number" ? n.value : undefined;
}

function toPer100g(food: RawFood): FoodMatch | null {
  const energy = nutrient(food, N_ENERGY_KCAL) ?? nutrient(food, N_ENERGY_ATWATER);
  const protein = nutrient(food, N_PROTEIN);
  const carbs = nutrient(food, N_CARBS);
  const fat = nutrient(food, N_FAT);

  // A usable match must *report* energy or at least one macro. We check for
  // presence (`undefined`), not truthiness — water legitimately reports 0 kcal /
  // 0 macros, and treating that as "no signal" used to make the search fall
  // through to a calorie-dense near-name match (e.g. "water" → "Crackers, water").
  if (
    energy === undefined &&
    protein === undefined &&
    carbs === undefined &&
    fat === undefined
  ) {
    return null;
  }

  const p = protein ?? 0;
  const c = carbs ?? 0;
  const f = fat ?? 0;
  // Prefer the labelled energy value; fall back to an Atwater estimate from macros.
  const calories = energy ?? Math.round(p * 4 + c * 4 + f * 9);

  // Reject physically impossible energy density (pure fat ≈ 900 kcal/100g); such
  // matches are almost always the wrong food.
  if (calories > 900) return null;

  return {
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    calories,
    protein: p,
    carbs: c,
    fat: f,
  };
}

async function search(query: string, dataTypes: string[]): Promise<RawFood[]> {
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const res = await fetch(`${SEARCH_URL}?api_key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query,
      dataType: dataTypes,
      pageSize: 5,
      requireAllWords: false,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  return Array.isArray(data?.foods) ? (data.foods as RawFood[]) : [];
}

// Returns authoritative per-100g macros for the best match, or null if USDA has
// nothing usable (the caller should then fall back to web search / AI estimate).
export async function lookupFood(query: string): Promise<FoodMatch | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    // Try curated/generic entries first; only widen to Branded if needed.
    let foods = await search(q, GENERIC_TYPES);
    if (foods.length === 0) foods = await search(q, ALL_TYPES);
    for (const food of foods) {
      const match = toPer100g(food);
      if (match) return match;
    }
    return null;
  } catch {
    return null;
  }
}
