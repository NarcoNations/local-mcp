import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', 'theme-dark'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--color-bg) / <alpha-value>)',
        foreground: 'hsl(var(--color-fg) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        'surface-subdued': 'hsl(var(--color-surface-subdued) / <alpha-value>)',
        border: 'hsl(var(--color-border) / <alpha-value>)',
        accent: 'hsl(var(--color-accent) / <alpha-value>)',
        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        cyan: 'hsl(var(--color-cyan) / <alpha-value>)',
        gold: 'hsl(var(--color-gold) / <alpha-value>)',
        success: 'hsl(var(--color-success) / <alpha-value>)',
        warning: 'hsl(var(--color-warning) / <alpha-value>)',
        danger: 'hsl(var(--color-danger) / <alpha-value>)',
        info: 'hsl(var(--color-info) / <alpha-value>)',
        muted: 'hsl(var(--color-muted) / <alpha-value>)',
        focus: 'hsl(var(--color-focus) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
      },
      boxShadow: {
        subtle: '0 1px 2px hsl(var(--color-shadow) / 0.12), 0 8px 16px hsl(var(--color-shadow) / 0.08)',
        float: '0 12px 32px hsl(var(--color-shadow) / 0.24)',
      },
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.focus-ring': {
          outline: 'none',
          boxShadow: '0 0 0 2px hsl(var(--color-focus) / 0.7)',
        },
        '.focus-ring-offset': {
          outline: 'none',
          boxShadow:
            '0 0 0 2px hsl(var(--color-bg) / 1), 0 0 0 4px hsl(var(--color-focus) / 0.7)',
        },
        '.surface-border': {
          border: '1px solid hsl(var(--color-border) / 0.65)',
        },
        '.surface-elevated': {
          backgroundColor: 'hsl(var(--color-surface) / 1)',
          boxShadow: '0 1px 2px hsl(var(--color-shadow) / 0.12), 0 8px 16px hsl(var(--color-shadow) / 0.08)',
        },
        '.surface-subdued': {
          backgroundColor: 'hsl(var(--color-surface-subdued) / 1)',
        },
        '.glass-surface': {
          backgroundColor: 'hsl(var(--color-surface) / 0.55)',
          backdropFilter: 'blur(16px)',
          border: '1px solid hsl(var(--color-border) / 0.35)',
        },
      });
    },
  ],
};

export default config;
