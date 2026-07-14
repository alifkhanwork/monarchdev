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
          teal: '#00E5FF',
        },
        system: {
          bg: '#050a14',
          panel: '#0f1629',
          border: '#1e3a5f',
          glow: '#00E5FF',
          gold: '#d4a843',
          accent: '#00E5FF',
          danger: '#e53935',
          muted: '#6b7fa3',
        },
      },
      fontFamily: {
        system: ['var(--font-system)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 255, 0.15)',
        'glow-strong': '0 0 30px rgba(0, 229, 255, 0.3)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
