/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0f0f1a',
        'game-card': '#1a1a2e',
        'game-border': '#2a2a4a',
        'pixel-red': '#e63946',
        'pixel-orange': '#f4a261',
        'pixel-yellow': '#ffd166',
        'pixel-green': '#06d6a0',
        'pixel-blue': '#118ab2',
        'pixel-violet': '#9b5de5',
        'pixel-white': '#f8f9fa',
        'pixel-rainbow': '#ff6b9d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
