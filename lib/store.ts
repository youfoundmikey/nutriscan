// Client-side meal store backed by localStorage.

export type Meal = {
  id: string;
  name: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:MM
  source: "scan" | "manual" | "ai";
};

// One grounded food component within an estimate. `source` shows where the
// numbers came from so the user can trust them at a glance.
export type MealItem = {
  food: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "usda" | "web" | "ai";
};

export type NutritionEstimate = {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  items?: MealItem[];
};

export type Goals = {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
};

const MEALS_KEY = "nutriscan.meals";
const LEGACY_GOAL_KEY = "nutriscan.goal";
const GOALS_KEY = "nutriscan.goals";

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 65,
};

// Change notification so components can react to store writes
// (useSyncExternalStore-compatible). The "storage" event covers other tabs.
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

export function subscribeStore(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Raw string snapshots: stable references for useSyncExternalStore.
export function mealsSnapshot(): string {
  return localStorage.getItem(MEALS_KEY) || "[]";
}

export function goalsSnapshot(): string {
  const raw = localStorage.getItem(GOALS_KEY);
  if (raw) return raw;
  // Migrate the old single calorie goal if one was saved.
  const legacy = Number(localStorage.getItem(LEGACY_GOAL_KEY));
  if (Number.isFinite(legacy) && legacy > 0) {
    return JSON.stringify({ ...DEFAULT_GOALS, calories: legacy });
  }
  return "";
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadMeals(): Meal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MEALS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveMeals(meals: Meal[]) {
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  emitChange();
}

export function addMeal(meal: Omit<Meal, "id" | "date" | "time"> & Partial<Pick<Meal, "date" | "time">>): Meal {
  const now = new Date();
  const full: Meal = {
    id: crypto.randomUUID(),
    date: meal.date || todayKey(now),
    time:
      meal.time ||
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    ...meal,
  } as Meal;
  const meals = loadMeals();
  meals.push(full);
  saveMeals(meals);
  return full;
}

export function deleteMeal(id: string) {
  saveMeals(loadMeals().filter((m) => m.id !== id));
}

export function mealsForDate(date: string): Meal[] {
  return loadMeals()
    .filter((m) => m.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

// Pure parse of a goalsSnapshot() string — safe to call during hydration.
export function parseGoals(json: string): Goals {
  if (!json) return DEFAULT_GOALS;
  try {
    const g = JSON.parse(json);
    return {
      calories: positiveOr(g.calories, DEFAULT_GOALS.calories),
      protein: positiveOr(g.protein, DEFAULT_GOALS.protein),
      carbs: positiveOr(g.carbs, DEFAULT_GOALS.carbs),
      fat: positiveOr(g.fat, DEFAULT_GOALS.fat),
    };
  } catch {
    return DEFAULT_GOALS;
  }
}

export function loadGoals(): Goals {
  if (typeof window === "undefined") return DEFAULT_GOALS;
  return parseGoals(goalsSnapshot());
}

export function saveGoals(goals: Goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  emitChange();
}

function positiveOr(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function defaultMealType(): Meal["mealType"] {
  const h = new Date().getHours();
  if (h < 11) return "Breakfast";
  if (h < 15) return "Lunch";
  if (h < 21) return "Dinner";
  return "Snack";
}
