import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/api-manager/src/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1440px'
      }
    },
    extend: {
      colors: {
        surface: 'hsl(var(--tone-surface) / <alpha-value>)',
        surfaceMuted: 'hsl(var(--tone-surface-muted) / <alpha-value>)',
        surfaceStrong: 'hsl(var(--tone-surface-strong) / <alpha-value>)',
        accent: 'hsl(var(--tone-accent) / <alpha-value>)',
        accentSoft: 'hsl(var(--tone-accent-soft) / <alpha-value>)',
        positive: 'hsl(var(--tone-positive) / <alpha-value>)',
        caution: 'hsl(var(--tone-caution) / <alpha-value>)',
        critical: 'hsl(var(--tone-critical) / <alpha-value>)',
        border: 'hsl(var(--tone-border) / <alpha-value>)',
        text: 'hsl(var(--tone-text) / <alpha-value>)',
        textMuted: 'hsl(var(--tone-text-muted) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans]
      },
      borderRadius: {
        lg: 'calc(var(--radius-md) + 2px)',
        md: 'var(--radius-md)',
        sm: 'calc(var(--radius-md) - 4px)'
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite'
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('tailwindcss-animate')]
};

export default config;
