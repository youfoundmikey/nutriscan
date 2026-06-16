"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addMeal, defaultMealType, Meal, MealItem } from "@/lib/store";
import Breakdown from "@/components/Breakdown";

export default function LogPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState<number | "">("");
  const [protein, setProtein] = useState<number | "">("");
  const [carbs, setCarbs] = useState<number | "">("");
  const [fat, setFat] = useState<number | "">("");
  const [mealType, setMealType] = useState<Meal["mealType"]>(defaultMealType());
  const [desc, setDesc] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState("");
  const [estimateNote, setEstimateNote] = useState("");
  const [items, setItems] = useState<MealItem[]>([]);

  const canSave = name.trim() && calories !== "" && Number(calories) >= 0;

  async function estimate() {
    if (!desc.trim()) return;
    setEstimating(true);
    setError("");
    setEstimateNote("");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Estimate failed.");
      setName(data.name || desc);
      setCalories(Math.round(Number(data.calories) || 0));
      setProtein(Math.round(Number(data.protein) || 0));
      setCarbs(Math.round(Number(data.carbs) || 0));
      setFat(Math.round(Number(data.fat) || 0));
      setItems(Array.isArray(data.items) ? data.items : []);
      if (data.notes) setEstimateNote(data.notes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setEstimating(false);
    }
  }

  function save() {
    if (!canSave) return;
    addMeal({
      name: name.trim(),
      mealType,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      source: "manual",
    });
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Log a Meal</h1>
        <p className="text-sm text-muted">Type it in, or describe it and let AI fill the numbers.</p>
      </header>

      {/* AI assist */}
      <div className="card space-y-3 p-5">
        <label className="label" htmlFor="desc">Describe your meal</label>
        <textarea
          id="desc"
          className="field min-h-20 resize-none"
          placeholder="e.g. 2 eggs, 2 slices of toast with butter, and a banana"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button className="btn-primary" disabled={estimating || !desc.trim()} onClick={estimate}>
          {estimating ? "Estimating…" : "Estimate with AI"}
        </button>
        {items.length > 0 && <Breakdown items={items} />}
        {estimateNote && <p className="text-xs text-muted">{estimateNote}</p>}
      </div>

      {error && <div className="card p-4 text-sm">{error}</div>}

      {/* Manual fields */}
      <div className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="mname">Meal name</label>
          <input
            id="mname"
            className="field"
            placeholder="e.g. Chicken & rice bowl"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Num label="kcal" value={calories} onChange={setCalories} />
          <Num label="Protein" value={protein} onChange={setProtein} />
          <Num label="Carbs" value={carbs} onChange={setCarbs} />
          <Num label="Fat" value={fat} onChange={setFat} />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Breakfast", "Lunch", "Dinner", "Snack"] as const).map((t) => (
            <button key={t} className="chip" data-on={mealType === t} onClick={() => setMealType(t)}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={!canSave} onClick={save}>
          Save to today&apos;s log
        </button>
      </div>
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  return (
    <div>
      <label className="label !mb-1 text-center">{label}</label>
      <input
        className="field !px-1 text-center"
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
      />
    </div>
  );
}
