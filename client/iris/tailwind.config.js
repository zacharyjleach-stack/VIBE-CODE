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
        // Bento Box dark theme palette
        dark: {
          950: '#0a0a0f',  // Deepest background
          900: '#12121a',  // Card background
          800: '#1a1a25',  // Borders
          700: '#252532',  // Hover states
          600: '#363645',  // Elevated elements
          500: '#4a4a5a',  // Muted elements
          400: '#6b6b80',  // Muted text
          300: '#9090a0',  // Secondary text
          200: '#e0e0e8',  // Primary text
          100: '#f0f0f5',  // Bright text
          50: '#fafafc',   // White text
        },
        // Iris brand colors - purple accent
        iris: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Aegis brand colors - cyan accent
        aegis: {
          50: '#ecfeff',
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
        // Status colors
        status: {
          idle: '#6b7280',
          working: '#3b82f6',
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'bounce-subtle': 'bounce 2s ease-in-out infinite',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
        'glow-iris': '0 0 30px rgba(168, 85, 247, 0.4)',
        'glow-aegis': '0 0 30px rgba(6, 182, 212, 0.4)',
        'bento': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'bento-hover': '0 16px 48px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
