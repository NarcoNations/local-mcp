import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: ["class", ".theme-dark"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'InterVariable'", "'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'SFMono-Regular'", "Menlo", "monospace"],
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        raised: "var(--shadow-raised)",
        pop: "var(--shadow-pop)",
      },
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        "surface-glass": "var(--color-surface-glass)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        accent: "var(--color-accent)",
        "accent-soft": "var(--color-accent-soft)",
        focus: "var(--color-focus)",
        success: "var(--color-success)",
        "success-soft": "var(--color-success-soft)",
        warning: "var(--color-warning)",
        "warning-soft": "var(--color-warning-soft)",
        danger: "var(--color-danger)",
        "danger-soft": "var(--color-danger-soft)",
        info: "var(--color-info)",
        "info-soft": "var(--color-info-soft)",
        muted: "var(--color-text-muted)",
        primary: "var(--color-text)",
      },
    },
  },
  safelist: [
    "bg-[var(--color-surface)]",
    "bg-[var(--color-surface-elevated)]",
    "bg-[var(--color-surface-glass)]",
    "text-[var(--color-text)]",
    "text-[var(--color-text-muted)]",
    "border-[color:var(--color-border)]",
    "shadow-[var(--shadow-subtle)]",
    "shadow-[var(--shadow-raised)]",
    "shadow-[var(--shadow-pop)]",
  ],
  plugins: [],
};

export default config;
