/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Void Interface palette ─────────────────────────────────────────────
        'void-bg':       '#06061a',   // cosmic void background
        'void-surface':  '#0c0c28',   // panel backgrounds
        'void-card':     '#10102e',   // card backgrounds
        'void-raised':   '#161640',   // elevated surfaces
        'void-border':   '#1e1e48',   // default borders
        'void-rim':      '#2e2e60',   // highlighted borders
        'void-muted':    '#3c3c72',   // dim borders / placeholder

        // ── Neon action colors ─────────────────────────────────────────────────
        'neon-indigo':   '#6366f1',   // primary action
        'neon-cyan':     '#22d3ee',   // secondary highlight
        'neon-green':    '#34d399',   // success / completion
        'neon-yellow':   '#fbbf24',   // gold / warnings
        'neon-red':      '#f87171',   // errors / danger
        'neon-violet':   '#a78bfa',   // synergy / special
        'neon-orange':   '#fb923c',   // reactor / urgency

        // ── Text ──────────────────────────────────────────────────────────────
        'void-text':     '#ddd8f8',   // primary text (white with violet cast)
        'void-dim':      '#7b78a8',   // secondary text
        'void-ghost':    '#3e3c5e',   // ghost / disabled text

        // ── Legacy aliases (for any remaining className references) ───────────
        'game-bg':       '#06061a',
        'game-card':     '#10102e',
        'game-card2':    '#161640',
        'game-border':   '#1e1e48',
        'game-border2':  '#2e2e60',
        'pixel-blue':    '#6366f1',
        'pixel-green':   '#34d399',
        'pixel-yellow':  '#fbbf24',
        'pixel-red':     '#f87171',
        'pixel-orange':  '#fb923c',
        'pixel-violet':  '#a78bfa',
        'pixel-white':   '#ddd8f8',
        'pixel-rainbow': '#f472b6',
      },
      fontFamily: {
        sans: ['Oxanium', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
