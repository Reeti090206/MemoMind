"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-[38px] h-[38px] rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:border-[var(--color-muted)] transition-all cursor-pointer"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {theme === "light" ? (
        <Moon className="h-4.5 w-4.5" />
      ) : (
        <Sun className="h-4.5 w-4.5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
