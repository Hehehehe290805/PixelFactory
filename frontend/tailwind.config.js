/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'game-bg':       '#0a0a18',
        'game-card':     '#111128',
        'game-card2':    '#191934',  // slightly lighter card for nested panels
        'game-border':   '#36366a',  // visible, saturated purple-grey
        'game-border2':  '#4a4a88',  // hover/active border
        'pixel-red':     '#f03e4e',
        'pixel-orange':  '#f59342',
        'pixel-yellow':  '#ffd166',
        'pixel-green':   '#00d49a',
        'pixel-blue':    '#1499cc',
        'pixel-violet':  '#a066f0',
        'pixel-white':   '#f0f0fa',
        'pixel-rainbow': '#ff6b9d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
