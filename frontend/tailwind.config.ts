import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          /* Driven by --neon-teal-rgb so shop accents swap app-wide */
          teal: 'rgb(var(--neon-teal-rgb) / <alpha-value>)',
        },
        system: {
          bg: '#050a14',
          panel: '#0f1629',
          border: '#1e3a5f',
          glow: 'rgb(var(--neon-teal-rgb) / <alpha-value>)',
          gold: '#d4a843',
          accent: 'rgb(var(--neon-teal-rgb) / <alpha-value>)',
          danger: '#e53935',
          muted: '#6b7fa3',
        },
      },
      fontFamily: {
        system: ['var(--font-system)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgb(var(--neon-teal-rgb) / 0.15)',
        'glow-strong': '0 0 30px rgb(var(--neon-teal-rgb) / 0.3)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgb(var(--neon-teal-rgb) / 0.03) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--neon-teal-rgb) / 0.03) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
