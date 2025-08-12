"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher({ showLabel = false }: { showLabel?: boolean }) {
  useEffect(() => {
    // Force light theme and disable toggling
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);
  return null;
}


