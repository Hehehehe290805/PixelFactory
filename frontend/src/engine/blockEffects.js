import { GRID_SIZE } from '../lib/constants'

const ORTHOGONAL = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const ALL8       = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
const DIAGONAL   = [[-1,-1],[-1,1],[1,-1],[1,1]]

function nbOrtho(r, c, grid) {
  return ORTHOGONAL.map(([dr, dc]) => grid[r + dr]?.[c + dc]).filter(Boolean)
}

// ── Base output ───────────────────────────────────────────────────────────────
// Series tier: premium synergies (space/celestial) trade raw output for synergy ceiling.
// Accessible series (trees/food/landscapes/abstract) output more but have weaker synergies.
const SERIES_RATE = {
  space: 0.7, celestial: 0.7,
  symbols: 1.0, flowers: 1.0, animals: 1.0, buildings: 1.0, shapes: 1.0, weather: 1.0,
  trees: 1.3, food: 1.3, landscapes: 1.3, abstract: 1.3,
}

export function baseRate(block) {
  if (block.type === 'void') return 0
  return SERIES_RATE[block.series] ?? 1.0
}

// ── Doubler ───────────────────────────────────────────────────────────────────
// ×2 output when no orthogonal neighbor shares this block's series.
// Rewards cross-series placement and punishes same-series stacking.
export function getDoublerMultiplier(block, row, col, grid) {
  if (block.type !== 'doubler') return 1
  for (const [dr, dc] of ORTHOGONAL) {
    const n = grid[row + dr]?.[col + dc]
    if (n && n.series === block.series) return 1
  }
  return 2
}

// ── Cross Amp ─────────────────────────────────────────────────────────────────
// Each active cross_amp diagonal neighbor adds a flat 0.5 px/s.
export function getCrossAmplifierBonus(row, col, grid) {
  let bonus = 0
  for (const [dr, dc] of DIAGONAL) {
    const n = grid[row + dr]?.[col + dc]
    if (n && n.type === 'cross_amp' && n.pauseTimer === 0) {
      bonus += 0.5
    }
  }
  return bonus
}

// ── Greedy (on-complete gold) ─────────────────────────────────────────────────
// Gold = (myRate - avgNeighborRate) × 20 when myRate > average.
// Rewards isolation: a greedy block surrounded by weaker blocks pays out more.
export function calculateGreedyBonus(row, col, grid, rateMap) {
  const block = grid[row][col]
  if (!block || block.type !== 'greedy') return 0
  const myRate = rateMap?.[row]?.[col] ?? 0
  let neighborTotal = 0, neighborCount = 0
  for (const [dr, dc] of ALL8) {
    const n = grid[row + dr]?.[col + dc]
    if (n) { neighborTotal += rateMap?.[row + dr]?.[col + dc] ?? 0; neighborCount++ }
  }
  if (neighborCount === 0) return 0
  const avgNeighborRate = neighborTotal / neighborCount
  return Math.max(0, Math.round((myRate - avgNeighborRate) * 20))
}

export function totalGreedyBonus(grid, rateMap) {
  let total = 0
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) total += calculateGreedyBonus(r, c, grid, rateMap)
  return total
}

// ── Forge (on-complete gold) ──────────────────────────────────────────────────
// Earns gold based on this block's production rate at level end.
export function calculateForgeBonus(row, col, grid, rateMap) {
  const block = grid[row][col]
  if (!block || block.type !== 'forge') return 0
  return Math.max(5, Math.round((rateMap?.[row]?.[col] ?? 0) * 6))
}

export function totalForgeBonus(grid, rateMap) {
  let total = 0
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) total += calculateForgeBonus(r, c, grid, rateMap)
  return total
}

// ── Overflow (3× burst every 10s) ────────────────────────────────────────────
export function getOverflowMultiplier(block) {
  if (block.type !== 'overflow') return 1
  return (block.overflowTimer ?? 0) >= 100 ? 3.0 : 1.0
}

// ── Catalyst (synergy bonuses in row ×1.5) ───────────────────────────────────
export function buildCatalystRows(grid) {
  const rows = new Set()
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const b = grid[r][c]
      if (b && b.type === 'catalyst' && b.pauseTimer === 0) rows.add(r)
    }
  }
  return rows
}

// ── Void ──────────────────────────────────────────────────────────────────────
export function getVoidBonus(row, col, grid) {
  let bonus = 1
  for (const [dr, dc] of ALL8) {
    const n = grid[row + dr]?.[col + dc]
    if (n && n.type === 'void' && n.pauseTimer === 0) bonus += 0.15
  }
  return bonus
}

// ── Amplifier ─────────────────────────────────────────────────────────────────
export function getAmplifierMultiplier(block, row, col, grid) {
  if (block.type !== 'amplifier') return 1
  let count = 0
  for (const [dr, dc] of ALL8) {
    const r = row + dr, c = col + dc
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && grid[r][c]) count++
  }
  return 1 + count * 0.08
}

// ── Resonator ─────────────────────────────────────────────────────────────────
export function getResonatorMultiplier(block, row, col, grid) {
  if (block.type !== 'resonator') return 1
  for (const n of nbOrtho(row, col, grid)) {
    if (n.type === 'resonator') return 1.5
  }
  return 1
}

// ── Reactor ───────────────────────────────────────────────────────────────────
export function getReactorMultiplier(block) {
  if (block.type !== 'reactor') return 1
  const age = block.reactorAge ?? 0
  return Math.min(2.0, 0.5 + (age / 150) * 1.5)
}

// ── Conductor (borrows best neighbor synergy bonus) ───────────────────────────
export function getConductorBonus(block, row, col, grid, bonusMap) {
  if (block.type !== 'conductor') return 1
  let best = 0
  for (const [dr, dc] of ALL8) {
    const nr = row + dr, nc = col + dc
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc]) {
      best = Math.max(best, bonusMap[nr]?.[nc] ?? 0)
    }
  }
  return 1 + best
}

// ── Prism (unique colors in fixed design) ─────────────────────────────────────
export function getPrismMultiplier(block) {
  if (block.type !== 'prism') return 1
  const NEUTRAL = new Set(['white', 'silver'])
  const colors = new Set()
  for (const row of block.pixelLayout) {
    for (const color of row) {
      if (color && !NEUTRAL.has(color)) colors.add(color)
    }
  }
  return 1 + Math.min(colors.size, 6) * 0.05
}

// ── Mirror ────────────────────────────────────────────────────────────────────
export function getMirrorRate(block, row, col, grid, rateMap) {
  if (block.type !== 'mirror') return null
  let best = 0
  for (const [dr, dc] of ORTHOGONAL) {
    const nr = row + dr, nc = col + dc
    const n = grid[nr]?.[nc]
    if (n && n.pauseTimer === 0) best = Math.max(best, rateMap[nr]?.[nc] ?? 0)
  }
  return best > 0 ? best : null
}

// ── Echo ──────────────────────────────────────────────────────────────────────
export function getEchoMultiplier(block) {
  if (block.type !== 'echo') return 1
  const stacks = Math.floor((block.echoAge ?? 0) / 100)
  return 1 + Math.min(stacks * 0.04, 0.80)
}

// ── Splitter ──────────────────────────────────────────────────────────────────
export function getSplitterBonus(row, col, grid, rateMap) {
  let bonus = 0
  for (const [dr, dc] of ORTHOGONAL) {
    const nr = row + dr, nc = col + dc
    const n = grid[nr]?.[nc]
    if (n && n.type === 'splitter' && n.pauseTimer === 0) {
      bonus += Math.floor((rateMap[nr]?.[nc] ?? 0) * 0.20)
    }
  }
  return bonus
}

// ── Focus — flat +50% output multiplier ───────────────────────────────────────
// Removed: dominantColor ratio calculation. Focus now provides a simple, reliable bonus.
export function getFocusMultiplier(block) {
  if (block.type !== 'focus') return 1
  return 1.5
}

// ── Cluster ───────────────────────────────────────────────────────────────────
export function getClusterMultiplier(block, row, col, grid) {
  if (block.type !== 'cluster') return 1
  let count = 0
  for (const [dr, dc] of ALL8) {
    const r = row + dr, c = col + dc
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      const n = grid[r][c]
      if (n && n.type !== 'void') count++
    }
  }
  return 1 + count * 0.12
}

// ── Color Checker (triggers on placement, no color check needed) ──────────────
export function getColorCheckerReduction(block) {
  if (block.type !== 'color_checker') return 0
  return block.colorCheckerTriggered ? 0 : 1
}

// ── Lattice grid-style helper ─────────────────────────────────────────────────
export function getLatticeBonus(row, col, grid) {
  let count = 0
  for (const [dr, dc] of ORTHOGONAL) {
    if (grid[row + dr]?.[col + dc]) count++
  }
  return count === 4 ? 1.35 : 1
}
