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

export type NutritionEstimate = {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
};

const MEALS_KEY = "nutriscan.meals";
const GOAL_KEY = "nutriscan.goal";

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

export function loadGoal(): number {
  if (typeof window === "undefined") return 2000;
  const g = Number(localStorage.getItem(GOAL_KEY));
  return Number.isFinite(g) && g > 0 ? g : 2000;
}

export function saveGoal(goal: number) {
  localStorage.setItem(GOAL_KEY, String(goal));
}

export function defaultMealType(): Meal["mealType"] {
  const h = new Date().getHours();
  if (h < 11) return "Breakfast";
  if (h < 15) return "Lunch";
  if (h < 21) return "Dinner";
  return "Snack";
}
