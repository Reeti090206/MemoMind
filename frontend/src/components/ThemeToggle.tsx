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
      <div className="w-[38px] h-[38px] rounded-xl bg-[var(--color-obsidian-light)]/30 border border-[var(--color-obsidian-border)]" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-xl bg-[var(--color-obsidian-light)]/30 hover:bg-[var(--color-obsidian-light)]/70 text-[var(--foreground)] transition-all border border-[var(--color-obsidian-border)]"
      title="Toggle Theme"
    >
      {theme === "light" ? (
        <Moon className="h-4.5 w-4.5 text-gray-700 hover:text-black" />
      ) : (
        <Sun className="h-4.5 w-4.5 text-[var(--foreground)]/70 hover:text-[var(--foreground)]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
