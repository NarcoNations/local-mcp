import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        'accent-strong': 'var(--color-accent-strong)',
        border: 'var(--color-border)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-subdued': 'var(--color-surface-subdued)',
        'surface-glass': 'var(--color-surface-glass)',
        success: 'var(--color-success)',
        warn: 'var(--color-warn)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        gold: 'var(--color-gold)',
      },
      borderRadius: {
        xl: 'var(--radius-xl)',
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        focus: 'var(--shadow-focus)',
        inset: 'var(--shadow-inset)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      transitionTimingFunction: {
        'spring-snappy': 'var(--ease-spring)',
      },
      transitionDuration: {
        interactive: 'var(--duration-interactive)',
      },
    },
  },
  safelist: [
    'theme-light',
    'theme-dark',
  ],
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.focus-ring': {
          outline: 'none',
          boxShadow: 'var(--shadow-focus)',
        },
        '.focus-ring-subtle': {
          outline: 'none',
          boxShadow: 'var(--shadow-focus-subtle)',
        },
        '.surface-border': {
          borderColor: 'var(--color-border)',
        },
        '.surface-divider': {
          borderColor: 'var(--color-divider)',
        },
        '.glass-border': {
          borderColor: 'var(--color-glass-border)',
        },
      });
    }),
  ],
};

export default config;
