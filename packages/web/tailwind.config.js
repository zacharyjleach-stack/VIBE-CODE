/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0C',
        surface: 'rgba(255, 255, 255, 0.04)',
        border: 'rgba(255, 255, 255, 0.08)',
        accent: '#7C6AFF',
        'accent-cyan': '#00D4FF',
        'accent-green': '#00FF88',
        'accent-orange': '#FF6B35',
      },
    },
  },
  plugins: [],
};
