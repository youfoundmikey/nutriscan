"use client";
import { useState } from "react";
import { addMeal, defaultMealType } from "@/lib/store";

type Suggestion = {
  item: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  why: string;
  tip?: string;
};

const GOALS = ["Lower calorie", "High protein", "Low carb", "Just balanced"];
const QUICK = ["McDonald's", "Chipotle", "Chick-fil-A", "Subway", "Taco Bell", "Starbucks"];

export default function AlternativesPage() {
  const [restaurant, setRestaurant] = useState("");
  const [craving, setCraving] = useState("");
  const [goal, setGoal] = useState(GOALS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const [loggedIdx, setLoggedIdx] = useState<number | null>(null);

  async function search(r?: string) {
    const name = (r ?? restaurant).trim();
    if (!name) return;
    if (r) setRestaurant(r);
    setLoading(true);
    setError("");
    setResults(null);
    setLoggedIdx(null);
    try {
      const res = await fetch("/api/alternatives", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ restaurant: name, craving, goal }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed.");
      setResults(data.suggestions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function logSuggestion(s: Suggestion, idx: number) {
    addMeal({
      name: `${s.item} (${restaurant})`,
      mealType: defaultMealType(),
      calories: Math.round(s.calories),
      protein: Math.round(s.protein),
      carbs: Math.round(s.carbs),
      fat: Math.round(s.fat),
      source: "ai",
    });
    setLoggedIdx(idx);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Eat Out Smarter</h1>
        <p className="text-sm text-muted">Healthier picks at restaurants and fast food.</p>
      </header>

      <div className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="rest">Restaurant or chain</label>
          <input
            id="rest"
            className="field"
            placeholder="e.g. McDonald's, Olive Garden…"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} className="chip" onClick={() => search(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="crave">Craving something? <span className="normal-case font-normal">(optional)</span></label>
          <input
            id="crave"
            className="field"
            placeholder="e.g. a burger, something sweet…"
            value={craving}
            onChange={(e) => setCraving(e.target.value)}
          />
        </div>
        <div>
          <span className="label">Goal</span>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button key={g} className="chip" data-on={goal === g} onClick={() => setGoal(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary" disabled={loading || !restaurant.trim()} onClick={() => search()}>
          {loading ? "Finding picks…" : "Get suggestions"}
        </button>
      </div>

      {error && <div className="card p-4 text-sm">{error}</div>}

      {results && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Best picks at {restaurant}</h2>
          {results.length === 0 && (
            <div className="card p-5 text-sm text-muted">No suggestions came back — try a different restaurant.</div>
          )}
          {results.map((s, i) => (
            <div key={i} className="card space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{s.item}</p>
                <p className="shrink-0 font-display font-semibold text-clem">{Math.round(s.calories)} kcal</p>
              </div>
              <p className="text-xs text-muted">
                P {Math.round(s.protein)}g · C {Math.round(s.carbs)}g · F {Math.round(s.fat)}g
              </p>
              <p className="text-sm">{s.why}</p>
              {s.tip && (
                <p className="rounded-lg bg-leaf-soft px-3 py-2 text-xs font-medium text-pine">
                  Tip: {s.tip}
                </p>
              )}
              <button
                className="text-sm font-semibold text-pine underline underline-offset-4 disabled:no-underline disabled:text-muted"
                disabled={loggedIdx === i}
                onClick={() => logSuggestion(s, i)}
              >
                {loggedIdx === i ? "Added to today's log ✓" : "I ordered this — log it"}
              </button>
            </div>
          ))}
          <p className="text-center text-[11px] text-muted">
            Menu items and nutrition are AI estimates — check the restaurant&apos;s official info for exact numbers.
          </p>
        </section>
      )}
    </div>
  );
}
