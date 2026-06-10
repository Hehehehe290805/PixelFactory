// ── Block Types ───────────────────────────────────────────────────────────────
// Each design in the design library bundles one of these block types.
// desc is shown as the hover tooltip in DeckSelector and ShopSidebar.

export const BLOCK_TYPES = {
  base:          { label: 'Base',          levelCost: 13,  desc: 'Workhorse. Output scales with design size' },
  doubler:       { label: 'Doubler',       levelCost: 39,  desc: '×2 output if all 4 ortho neighbors have fewer pixels' },
  cross_amp:     { label: 'Cross Amp',     levelCost: 32,  desc: '+⌊pixelCount÷10⌋ px/s to each diagonal neighbor' },
  color_checker: { label: 'Color Checker', levelCost: 26,  desc: 'Triggers −5% required output on placement (one-time)' },
  greedy:        { label: 'Greedy',        levelCost: 52,  desc: 'On complete: (myPixels − neighborPixels) × 10 gold' },
  amplifier:     { label: 'Amplifier',     levelCost: 45,  desc: '+8% output per occupied neighbor cell (up to ×1.64)' },
  resonator:     { label: 'Resonator',     levelCost: 55,  desc: '+50% output if any ortho neighbor is same block type' },
  reactor:       { label: 'Reactor',       levelCost: 91,  desc: 'Starts at 50% output; ramps to 200% over 15 s; resets on move' },
  echo:          { label: 'Echo',          levelCost: 45,  desc: '+4% output for each 10 s stationary (max +80%)' },
  prism:         { label: 'Prism',         levelCost: 58,  desc: '+5% output per unique non-white color in design (max +30%)' },
  conductor:     { label: 'Conductor',     levelCost: 72,  desc: 'Borrows the highest design synergy bonus from adjacent blocks' },
  splitter:      { label: 'Splitter',      levelCost: 65,  desc: 'Gives each ortho neighbor +20% of this block\'s rate' },
  focus:         { label: 'Focus',         levelCost: 42,  desc: 'Output scales with dominant color ratio (×1→×2, fixed per design)' },
  cluster:       { label: 'Cluster',       levelCost: 55,  desc: '+12% output per occupied neighbor (all 8, excl. void)' },
  forge:         { label: 'Forge',         levelCost: 78,  desc: 'On complete: +3 gold per pixel in this design' },
  overflow:      { label: 'Overflow',      levelCost: 65,  desc: '3× output burst for 5 s every 10 s' },
  mirror:        { label: 'Mirror',        levelCost: 58,  desc: 'Copies the output rate of its highest-producing ortho neighbor' },
  catalyst:      { label: 'Catalyst',      levelCost: 78,  desc: 'Design synergy bonuses in same row are ×1.5' },
  void:          { label: 'Void',          levelCost: 45,  desc: '0 output; gives +15% to all 8 surrounding blocks' },
}

// ── Grid Styles ───────────────────────────────────────────────────────────────

export const GRID_STYLES = {
  base:         { label: 'Base Grid',     cost: 0,    desc: 'No bonus' },
  gold_rush:    { label: 'Gold Rush',     cost: 500,  desc: '+15% gold after each level' },
  overclock:    { label: 'Overclock',     cost: 800,  desc: '+10% output across all blocks' },
  efficiency:   { label: 'Efficiency',   cost: 600,  desc: '+20% time limit, −10% required output' },
  bargain:      { label: 'Bargain',       cost: 700,  desc: 'In-level shop designs 20% cheaper' },
  quantum:      { label: 'Quantum',       cost: 1000, desc: 'Every 30 s all blocks produce 2× for 5 s' },
  neural:       { label: 'Neural',        cost: 700,  desc: 'Design synergy thresholds reduced by 1 (easier to activate)' },
  industrial:   { label: 'Industrial',    cost: 600,  desc: '+3% output per 10 placed blocks on the grid' },
  synergy_plus: { label: 'Synergy+',      cost: 900,  desc: 'Same-series adjacency synergy bonus is +25% (not +15%)' },
  cascade:      { label: 'Cascade',       cost: 750,  desc: 'Rows 6–11 produce more: +4% per row below row 5 (up to +24%)' },
  overcharge:   { label: 'Overcharge',    cost: 850,  desc: '+25% output for all blocks' },
  lattice:      { label: 'Lattice',       cost: 650,  desc: 'Blocks with exactly 4 occupied ortho neighbors get +35%' },
}

// ── Misc ──────────────────────────────────────────────────────────────────────
export const GRID_SIZE         = 12
export const BLOCK_CANVAS_SIZE = 16
export const TICK_MS           = 100
export const MOVE_COOLDOWN_MS  = 5000

// Starting pixel budget for deck pre-buy phase (scales with level, capped at 300)
export function getStartingPixelBudget(levelNumber) {
  return Math.min(50 + levelNumber * 5, 300)
}
