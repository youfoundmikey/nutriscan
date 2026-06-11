"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Today", icon: HomeIcon },
  { href: "/scan", label: "Scan", icon: ScanIcon, center: true },
  { href: "/alternatives", label: "Eat Out", icon: ForkIcon },
  { href: "/log", label: "Log", icon: PlusIcon },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-card/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2 py-2">
        {tabs.map((t) => {
          const active = pathname === t.href;
          const Icon = t.icon;
          if (t.center) {
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-label="Scan food"
                className="relative -mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-pine text-white shadow-lg"
              >
                <Icon active={active} />
              </Link>
            );
          }
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex w-16 flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium ${
                active ? "text-pine" : "text-muted"
              }`}
            >
              <Icon active={active} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
    </svg>
  );
}
function ScanIcon(_: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}
function ForkIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round">
      <path d="M7 3v7a2 2 0 002 2v9M7 3v5M11 3v5" transform="translate(-2 0)" />
      <path d="M17 3c-1.5 1-2.5 3-2.5 5.5 0 2 1 3.5 2.5 3.5v9" />
    </svg>
  );
}
function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  );
}
