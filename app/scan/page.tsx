"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMeal, defaultMealType, NutritionEstimate, Meal } from "@/lib/store";
import Breakdown from "@/components/Breakdown";

type Stage = "idle" | "analyzing" | "review" | "error";

export default function ScanPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<NutritionEstimate | null>(null);
  const [mealType, setMealType] = useState<Meal["mealType"]>(defaultMealType());
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(file: File) {
    setStage("analyzing");
    setErrorMsg("");
    try {
      const { base64, dataUrl } = await downscale(file);
      setPreview(dataUrl);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType: "image/jpeg" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error === "no_food"
            ? "No food detected in that photo — try again with the dish in frame."
            : data.error || "Analysis failed."
        );
      }
      setResult({
        name: data.name ?? "Meal",
        serving: data.serving ?? "",
        calories: Math.round(Number(data.calories) || 0),
        protein: Math.round(Number(data.protein) || 0),
        carbs: Math.round(Number(data.carbs) || 0),
        fat: Math.round(Number(data.fat) || 0),
        notes: data.notes,
        items: Array.isArray(data.items) ? data.items : undefined,
      });
      setStage("review");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
      setStage("error");
    }
  }

  function logIt() {
    if (!result) return;
    addMeal({
      name: result.name,
      mealType,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      source: "scan",
    });
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Scan</h1>
        <p className="text-sm text-muted">Snap your plate — AI estimates the nutrition.</p>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {stage === "idle" && (
        <div className="card flex flex-col items-center gap-6 p-10">
          <button
            onClick={() => fileRef.current?.click()}
            className="scan-pulse relative flex h-28 w-28 items-center justify-center rounded-full bg-pine text-white shadow-lg"
            aria-label="Take a photo of your food"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 8a2 2 0 012-2h1.2a2 2 0 001.6-.8l.9-1.2A2 2 0 0111.3 3h1.4a2 2 0 011.6.8l.9 1.2a2 2 0 001.6.8H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
          </button>
          <p className="text-center text-sm text-muted">
            Tap to take a photo or choose one from your library.
          </p>
        </div>
      )}

      {stage === "analyzing" && (
        <div className="card flex flex-col items-center gap-4 p-8">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your food" className="max-h-56 rounded-2xl object-cover" />
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-pine">
            <Spinner /> Analyzing your food…
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="card space-y-4 p-6">
          <p className="text-sm">{errorMsg}</p>
          <button className="btn-primary" onClick={() => setStage("idle")}>
            Try again
          </button>
        </div>
      )}

      {stage === "review" && result && (
        <div className="space-y-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Your food" className="max-h-56 w-full rounded-2xl object-cover" />
          )}
          <div className="card space-y-4 p-5">
            <div>
              <label className="label" htmlFor="scan-name">Detected</label>
              <input
                id="scan-name"
                className="field font-semibold"
                value={result.name}
                onChange={(e) => setResult({ ...result, name: e.target.value })}
              />
              {result.serving && <p className="mt-1 text-xs text-muted">{result.serving}</p>}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <NumField label="kcal" value={result.calories} onChange={(v) => setResult({ ...result, calories: v })} />
              <NumField label="Protein" value={result.protein} onChange={(v) => setResult({ ...result, protein: v })} />
              <NumField label="Carbs" value={result.carbs} onChange={(v) => setResult({ ...result, carbs: v })} />
              <NumField label="Fat" value={result.fat} onChange={(v) => setResult({ ...result, fat: v })} />
            </div>
            {result.items && result.items.length > 0 && (
              <Breakdown items={result.items} />
            )}
            {result.notes && <p className="text-xs text-muted">{result.notes}</p>}
            <div className="flex flex-wrap gap-2">
              {(["Breakfast", "Lunch", "Dinner", "Snack"] as const).map((t) => (
                <button key={t} className="chip" data-on={mealType === t} onClick={() => setMealType(t)}>
                  {t}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={logIt}>
              Add to today&apos;s log
            </button>
            <button
              className="w-full py-1 text-center text-sm font-medium text-muted"
              onClick={() => setStage("idle")}
            >
              Rescan
            </button>
          </div>
          <p className="text-center text-[11px] text-muted">
            AI estimates from a photo are approximate — adjust the numbers if you know better.
          </p>
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label !mb-1 text-center">{label}</label>
      <input
        className="field !px-1 text-center"
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Downscale the photo client-side so uploads stay small and fast.
async function downscale(file: File): Promise<{ base64: string; dataUrl: string }> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("Could not read the photo."));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Could not load the photo."));
    i.src = dataUrl;
  });
  const MAX = 1024;
  const scale = Math.min(1, MAX / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const jpeg = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: jpeg.split(",")[1], dataUrl: jpeg };
}
