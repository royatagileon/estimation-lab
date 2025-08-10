"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
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
  return (
    <button onClick={toggle} aria-label="Toggle theme" className="p-2 rounded-lg hover:bg-muted">
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}


