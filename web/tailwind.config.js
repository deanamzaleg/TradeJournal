/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0c0f',
        panel: '#14171c',
        'panel-2': '#1b1f26',
        border: '#262b33',
        text: '#f2f4f7',
        muted: '#8b929e',
        accent: '#b4ec51',
        'accent-h': '#a3e635',
        positive: '#3fd07f',
        negative: '#f0566e',
        buy: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
