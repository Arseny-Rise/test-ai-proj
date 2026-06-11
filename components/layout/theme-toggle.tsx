"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const THEME_EVENT = "theme-change";

function getThemeSnapshot() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

function subscribeTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onThemeChange = () => {
    applyTheme(getThemeSnapshot());
    onStoreChange();
  };
  media.addEventListener("change", onThemeChange);
  window.addEventListener(THEME_EVENT, onThemeChange);
  window.addEventListener("storage", onThemeChange);
  applyTheme(getThemeSnapshot());
  return () => {
    media.removeEventListener("change", onThemeChange);
    window.removeEventListener(THEME_EVENT, onThemeChange);
    window.removeEventListener("storage", onThemeChange);
  };
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => false
  );

  const toggle = () => {
    const next = !dark;
    localStorage.setItem("theme", next ? "dark" : "light");
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Тема">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
