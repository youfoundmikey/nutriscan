import { MealItem } from "@/lib/store";

// Per-component nutrition breakdown with a source badge, so the user can see
// exactly where each number came from (USDA database, web search, or an AI
// estimate) and trust the total without doing their own research.
const SOURCE_LABEL: Record<MealItem["source"], string> = {
  usda: "USDA",
  web: "Web",
  ai: "Est.",
};

const SOURCE_TITLE: Record<MealItem["source"], string> = {
  usda: "From the USDA FoodData Central database",
  web: "Looked up via web search",
  ai: "AI estimate (not found in a database)",
};

export default function Breakdown({ items }: { items: MealItem[] }) {
  return (
    <div className="space-y-1.5">
      <p className="label !mb-0">What&apos;s in it</p>
      <ul className="divide-y divide-black/5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-2 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium capitalize">{it.food}</p>
              <p className="text-[11px] text-muted">
                {it.grams}g · {it.protein}p / {it.carbs}c / {it.fat}f
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">{it.calories}</span>
              <span
                title={SOURCE_TITLE[it.source]}
                data-source={it.source}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide source-badge"
              >
                {SOURCE_LABEL[it.source]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
