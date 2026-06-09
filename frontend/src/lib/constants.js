// ── Pixel Colors ─────────────────────────────────────────────────────────────
// special: true  → must be unlocked in Shop before appearing in BlockEditor
// outputMult     → how many "pixels worth" this counts for in baseRate()
// goldPerPixel   → bonus gold per pixel of this type on level complete

export const PIXEL_COLORS = {
  // Standard (always available)
  white:   { label: 'White',   hex: '#f0f0fa', cost: 1,  outputMult: 1   },
  red:     { label: 'Red',     hex: '#f03e4e', cost: 3,  outputMult: 1   },
  orange:  { label: 'Orange',  hex: '#f59342', cost: 3,  outputMult: 1   },
  yellow:  { label: 'Yellow',  hex: '#ffd166', cost: 3,  outputMult: 1   },
  green:   { label: 'Green',   hex: '#00d49a', cost: 3,  outputMult: 1   },
  blue:    { label: 'Blue',    hex: '#1499cc', cost: 3,  outputMult: 1   },
  violet:  { label: 'Violet',  hex: '#a066f0', cost: 3,  outputMult: 1   },

  // Unlockable specials
  rainbow: { label: 'Rainbow', hex: '#ff6b9d', cost: 1,  outputMult: 1,   special: true },
  silver:  { label: 'Silver',  hex: '#9db4cc', cost: 2,  outputMult: 2,   special: true, desc: 'Worth 2× for output, neutral for sets' },
  gold:    { label: 'Gold',    hex: '#ffc000', cost: 8,  outputMult: 1,   goldPerPixel: 5, special: true, desc: '+5 gold per pixel on level complete' },
  neon:    { label: 'Neon',    hex: '#39ff14', cost: 5,  outputMult: 1.5, special: true, desc: 'Worth 1.5× for output' },
}

// ── Block Types ───────────────────────────────────────────────────────────────

export const BLOCK_TYPES = {
  // Base set
  base:          { label: 'Base',          shopCost: 50,   levelCost: 20,  desc: 'Workhorse. Output = pixelCount × 0.8 px/s' },
  doubler:       { label: 'Doubler',       shopCost: 150,  levelCost: 60,  desc: '×2 output if all 4 orthogonal neighbors have < half its pixels' },
  cross_amp:     { label: 'Cross Amp',     shopCost: 120,  levelCost: 50,  desc: '+⌊pixelCount/10⌋ px/s to each diagonal neighbor' },
  color_checker: { label: 'Color Checker', shopCost: 100,  levelCost: 40,  desc: 'Assigned a color at placement. 50%+ match → −5% required output (once)' },
  greedy:        { label: 'Greedy',        shopCost: 200,  levelCost: 80,  desc: 'On complete: (myPixels − all 8 neighbors\' pixels) × 10 gold' },

  // Unlockable specials (from Shop)
  overflow:      { label: 'Overflow',      shopCost: 300,  levelCost: 100, desc: 'Stores excess each tick; bursts 5s of production every 10s' },
  mirror:        { label: 'Mirror',        shopCost: 250,  levelCost: 90,  desc: 'Copies the output rate of its highest-producing orthogonal neighbor' },
  catalyst:      { label: 'Catalyst',      shopCost: 350,  levelCost: 120, desc: 'Synergy bonuses in its row ×1.5' },
  void:          { label: 'Void',          shopCost: 200,  levelCost: 70,  desc: 'Produces 0 px itself; removes adjacency penalties from neighbors' },

  // New block types (Phase 2)
  amplifier:     { label: 'Amplifier',     shopCost: 180,  levelCost: 70,  desc: '+8% output per occupied neighbor cell (up to ×1.64 with 8 neighbors)' },
  resonator:     { label: 'Resonator',     shopCost: 220,  levelCost: 85,  desc: '+50% output if any orthogonal neighbor is the same block type' },
  reactor:       { label: 'Reactor',       shopCost: 400,  levelCost: 140, desc: 'Starts at 50% output; ramps +5%/s to 200% max. Resets on move' },
  conductor:     { label: 'Conductor',     shopCost: 300,  levelCost: 110, desc: 'Borrows the highest set bonus from any adjacent block' },
  prism:         { label: 'Prism',         shopCost: 250,  levelCost: 90,  desc: '+5% output per unique non-white color in its pixels (max +30%)' },

  // New block types (Phase 3)
  echo:          { label: 'Echo',          shopCost: 180,  levelCost: 70,  desc: '+4% output for each 10s stationary (max +80% at ~3.5 min)' },
  splitter:      { label: 'Splitter',      shopCost: 280,  levelCost: 100, desc: 'Gives each orthogonal neighbor a flat +20% of this block\'s base rate' },
  focus:         { label: 'Focus',         shopCost: 160,  levelCost: 65,  desc: 'Assigned a color at placement; output doubles when all pixels match that color' },
  cluster:       { label: 'Cluster',       shopCost: 230,  levelCost: 85,  desc: '+12% output per occupied neighbor (all 8, excluding void)' },
  forge:         { label: 'Forge',         shopCost: 320,  levelCost: 120, desc: 'On level complete: +3 gold per pixel held (no production bonus)' },
}

// ── Grid Styles ───────────────────────────────────────────────────────────────

export const GRID_STYLES = {
  base:         { label: 'Base Grid',     cost: 0,    desc: 'No bonus' },
  gold_rush:    { label: 'Gold Rush',     cost: 500,  desc: '+15% gold after each level' },
  overclock:    { label: 'Overclock',     cost: 800,  desc: '+10% output across all blocks' },
  efficiency:   { label: 'Efficiency',   cost: 600,  desc: '+20% time limit, −10% required output' },
  bargain:      { label: 'Bargain',       cost: 700,  desc: 'Blocks and pixels 20% cheaper in-level' },
  quantum:      { label: 'Quantum',       cost: 1000, desc: 'Every 30s all blocks produce 2× for 5s' },
  neural:       { label: 'Neural',        cost: 700,  desc: 'Color Checker trigger reduces −8% required (not −5%)' },
  industrial:   { label: 'Industrial',    cost: 600,  desc: '+3% output per 10 placed blocks on the grid' },
  synergy_plus: { label: 'Synergy+',      cost: 900,  desc: 'Same-set adjacency synergy bonus is +25% (not +15%)' },
  cascade:      { label: 'Cascade',       cost: 750,  desc: 'Rows 6–11 produce more: +4% per row below row 5 (up to +24% at bottom)' },
  overcharge:   { label: 'Overcharge',    cost: 850,  desc: '+25% output for all blocks' },
  lattice:      { label: 'Lattice',       cost: 650,  desc: 'Blocks with exactly 4 occupied orthogonal neighbors get +35% output' },
}

// ── Misc constants ────────────────────────────────────────────────────────────

export const GRID_SIZE         = 12
export const BLOCK_CANVAS_SIZE = 16
export const TICK_MS           = 100
export const MOVE_COOLDOWN_MS  = 5000

// ── Pixel Sets ────────────────────────────────────────────────────────────────
// Colors listed are the ONLY allowed colors in the set (rainbow/neon count as any).
// silver is neutral — ignored for set detection.
// gold is treated as rainbow (any color) for set detection.

export const PIXEL_SETS = {
  // ── Original 5 sets ───────────────────────────────────────────────────────
  PRIMARY:     { colors: ['red', 'blue', 'yellow'],          minPixels: 40, outputBonus: 0.20 },
  MIDNIGHT:    { colors: ['blue', 'violet'],                 minPixels: 35, outputBonus: 0.15 },
  PHILIPPINES: { colors: ['red', 'blue', 'yellow', 'white'], minPixels: 45, outputBonus: 0.10 },
  GRASS:       { colors: ['yellow', 'green'],                minPixels: 30, outputBonus: 0.12 },
  SUNSET:      { colors: ['red', 'yellow', 'orange'],        minPixels: 38, outputBonus: 0.18 },

  // ── Special-pixel sets (require unlockable pixels from Shop) ──────────────
  SILVER_MIST: { colors: ['silver', 'white'],                minPixels: 40, outputBonus: 0.22 },
  NEON_RUSH:   { colors: ['neon', 'yellow', 'green'],        minPixels: 35, outputBonus: 0.20 },
  AURORA:      { colors: ['violet', 'blue', 'green'],        minPixels: 38, outputBonus: 0.25 },
  SUNRISE:     { colors: ['orange', 'yellow'],               minPixels: 45, outputBonus: 0.26 },

  // ── Standard-color sets (white, red, orange, yellow, green, blue, violet) ─
  OCEAN:       { colors: ['blue', 'green'],                  minPixels: 32, outputBonus: 0.18 },
  FIRE:        { colors: ['red', 'orange'],                  minPixels: 28, outputBonus: 0.20 },
  ROYAL:       { colors: ['violet', 'blue', 'red'],          minPixels: 38, outputBonus: 0.24 },
  EMBER:       { colors: ['red', 'orange', 'violet'],        minPixels: 42, outputBonus: 0.28 },
  TROPICS:     { colors: ['orange', 'green', 'blue'],        minPixels: 42, outputBonus: 0.26 },
  CORAL:       { colors: ['red', 'orange', 'green'],         minPixels: 36, outputBonus: 0.22 },
}
