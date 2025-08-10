"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher({ showLabel = false }: { showLabel?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    const initial = (localStorage.getItem('theme') as "light" | "dark" | null) ?? (m.matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }
  const label = theme === 'dark' ? 'Light theme' : 'Dark theme';
  return (
    <button onClick={toggle} aria-label={label} className={`rounded-full border px-3 py-1.5 text-sm hover:bg-muted inline-flex items-center gap-2`}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel && <span>{label}</span>}
    </button>
  );
}


