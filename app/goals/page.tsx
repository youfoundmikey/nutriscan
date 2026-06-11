"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_GOALS,
  Goals,
  goalsSnapshot,
  parseGoals,
  saveGoals,
  subscribeStore,
} from "@/lib/store";

type Draft = { [K in keyof Goals]: number | "" };

const fields: { key: keyof Goals; label: string; unit: string; hint: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal", hint: "Daily energy target" },
  { key: "protein", label: "Protein", unit: "g", hint: "Builds and repairs muscle" },
  { key: "carbs", label: "Carbs", unit: "g", hint: "Your main fuel source" },
  { key: "fat", label: "Fat", unit: "g", hint: "Hormones and absorption" },
];

export default function GoalsPage() {
  const goalsJson = useSyncExternalStore(subscribeStore, goalsSnapshot, () => "");
  const stored = useMemo(() => parseGoals(goalsJson), [goalsJson]);

  const [edits, setEdits] = useState<Partial<Draft>>({});
  const [saved, setSaved] = useState(false);

  const draft: Draft = { ...stored, ...edits };
  const valid = fields.every(({ key }) => draft[key] !== "" && Number(draft[key]) > 0);
  const dirty = Object.keys(edits).length > 0;

  function set(key: keyof Goals, v: number | "") {
    setEdits((e) => ({ ...e, [key]: v }));
    setSaved(false);
  }

  function save() {
    if (!valid) return;
    saveGoals({
      calories: Number(draft.calories),
      protein: Number(draft.protein),
      carbs: Number(draft.carbs),
      fat: Number(draft.fat),
    });
    setEdits({});
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-sm text-muted">Set your daily calorie and macro targets.</p>
      </header>

      <div className="card space-y-4 p-5">
        {fields.map(({ key, label, unit, hint }) => (
          <div key={key} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <label className="label !mb-0" htmlFor={`goal-${key}`}>{label}</label>
              <p className="text-xs text-muted">{hint}</p>
            </div>
            <input
              id={`goal-${key}`}
              className="field !w-24 text-center"
              type="number"
              inputMode="numeric"
              min={1}
              value={draft[key]}
              onChange={(e) =>
                set(key, e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
              }
            />
            <span className="w-8 text-sm text-muted">{unit}</span>
          </div>
        ))}

        <button className="btn-primary" disabled={!valid || (!dirty && saved)} onClick={save}>
          {saved && !dirty ? "Saved ✓" : "Save goals"}
        </button>
        {!valid && <p className="text-xs text-muted">Every target needs a number above zero.</p>}
      </div>

      <button
        className="text-sm text-muted underline decoration-dotted underline-offset-4"
        onClick={() => {
          setEdits(DEFAULT_GOALS);
          setSaved(false);
        }}
      >
        Reset to defaults
      </button>
    </div>
  );
}
