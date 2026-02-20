/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Neutral base (zinc-based) ── */
        surface: {
          DEFAULT: '#09090b',
          subtle:  '#111113',
          elevated:'#141416',
        },
        border: {
          DEFAULT: '#27272a',
          subtle:  '#1c1c1f',
          strong:  '#3f3f46',
        },
        text: {
          DEFAULT: '#fafafa',
          muted:   '#a1a1aa',
          faint:   '#52525b',
        },

        /* ── Keep legacy dark scale for old code ── */
        dark: {
          950: '#09090b',
          900: '#111113',
          800: '#141416',
          700: '#1c1c1f',
          600: '#27272a',
          500: '#3f3f46',
          400: '#52525b',
          300: '#71717a',
          200: '#a1a1aa',
          100: '#d4d4d8',
          50:  '#fafafa',
        },

        /* ── Iris brand — violet ── */
        iris: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },

        /* ── Aegis brand — cyan ── */
        aegis: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },

        /* ── Status ── */
        status: {
          idle:    '#52525b',
          active:  '#8b5cf6',
          success: '#22c55e',
          warning: '#f59e0b',
          error:   '#ef4444',
          cyan:    '#06b6d4',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },

      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':     'spin 2s linear infinite',
        'fade-up':       'fade-up 0.4s ease-out forwards',
        'slide-in-right':'slide-in-right 0.25s ease-out forwards',
        'shimmer':       'shimmer 1.5s infinite',
      },

      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      boxShadow: {
        'glow-iris':   '0 0 24px rgba(139, 92, 246, 0.35)',
        'glow-aegis':  '0 0 24px rgba(6, 182, 212, 0.3)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)',
        'card-hover':  '0 4px 12px rgba(0,0,0,0.4)',
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      backgroundImage: {
        'grid-subtle': `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '48px 48px',
      },
    },
  },
  plugins: [],
};
