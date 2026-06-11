"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Meal,
  mealsForDate,
  deleteMeal,
  loadGoal,
  saveGoal,
  todayKey,
} from "@/lib/store";

export default function TodayPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goal, setGoal] = useState(2000);
  const [editingGoal, setEditingGoal] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = () => setMeals(mealsForDate(todayKey()));

  useEffect(() => {
    refresh();
    setGoal(loadGoal());
    setReady(true);
  }, []);

  const totals = meals.reduce(
    (t, m) => ({
      calories: t.calories + m.calories,
      protein: t.protein + m.protein,
      carbs: t.carbs + m.carbs,
      fat: t.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const pct = Math.min(totals.calories / goal, 1);
  const remaining = Math.max(goal - totals.calories, 0);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-muted">{dateLabel}</p>
        <h1 className="text-2xl font-bold">Today</h1>
      </header>

      {/* Calorie ring */}
      <section className="card flex items-center gap-6 p-5">
        <CalorieRing pct={ready ? pct : 0} calories={totals.calories} />
        <div className="flex-1 space-y-1">
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input
                className="field !w-24 !py-1.5 text-center"
                type="number"
                inputMode="numeric"
                defaultValue={goal}
                autoFocus
                onBlur={(e) => {
                  const g = Number(e.target.value);
                  if (g > 0) {
                    setGoal(g);
                    saveGoal(g);
                  }
                  setEditingGoal(false);
                }}
              />
              <span className="text-sm text-muted">kcal goal</span>
            </div>
          ) : (
            <button
              onClick={() => setEditingGoal(true)}
              className="text-left text-sm text-muted underline decoration-dotted underline-offset-4"
            >
              Goal: {goal.toLocaleString()} kcal
            </button>
          )}
          <p className="text-lg font-semibold">
            {remaining.toLocaleString()} <span className="text-sm font-normal text-muted">kcal left</span>
          </p>
        </div>
      </section>

      {/* Macros */}
      <section className="grid grid-cols-3 gap-3">
        <MacroCard label="Protein" value={totals.protein} color="var(--leaf)" />
        <MacroCard label="Carbs" value={totals.carbs} color="var(--clem)" />
        <MacroCard label="Fat" value={totals.fat} color="var(--pine)" />
      </section>

      {/* Meals */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Meals</h2>
        {ready && meals.length === 0 && (
          <div className="card p-6 text-center text-sm text-muted">
            Nothing logged yet.{" "}
            <Link href="/scan" className="font-semibold text-pine underline">
              Scan your first meal
            </Link>{" "}
            or{" "}
            <Link href="/log" className="font-semibold text-pine underline">
              add one manually
            </Link>
            .
          </div>
        )}
        {meals.map((m) => (
          <div key={m.id} className="card flex items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold">{m.name}</p>
              <p className="text-xs text-muted">
                {m.mealType} · {m.time} · P {m.protein}g · C {m.carbs}g · F {m.fat}g
              </p>
            </div>
            <p className="font-display font-semibold text-clem">{m.calories}</p>
            <button
              aria-label={`Delete ${m.name}`}
              onClick={() => {
                deleteMeal(m.id);
                refresh();
              }}
              className="rounded-full p-2 text-muted hover:text-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13h8l1-13" />
              </svg>
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

function CalorieRing({ pct, calories }: { pct: number; calories: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={pct >= 1 ? "var(--clem)" : "var(--leaf)"}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold">{calories.toLocaleString()}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted">kcal eaten</span>
      </div>
    </div>
  );
}

function MacroCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="font-display text-xl font-bold" style={{ color }}>
        {Math.round(value)}g
      </p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </div>
  );
}
