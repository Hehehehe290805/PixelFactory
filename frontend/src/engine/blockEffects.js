import { GRID_SIZE } from '../lib/constants'

const ORTHOGONAL = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const ALL8       = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
const DIAGONAL   = [[-1,-1],[-1,1],[1,-1],[1,1]]

function nbOrtho(r, c, grid) {
  return ORTHOGONAL.map(([dr, dc]) => grid[r + dr]?.[c + dc]).filter(Boolean)
}

// ── Base output ───────────────────────────────────────────────────────────────
// pixelCount is fixed per design; no color multipliers needed (removed with painting)
export function baseRate(block) {
  if (!block.pixelCount) return 0
  return block.pixelCount / 75
}

// ── Doubler ───────────────────────────────────────────────────────────────────
export function getDoublerMultiplier(block, row, col, grid) {
  if (block.type !== 'doubler' || !block.pixelCount) return 1
  const threshold = block.pixelCount / 2
  for (const [dr, dc] of ORTHOGONAL) {
    const n = grid[row + dr]?.[col + dc]
    if ((n?.pixelCount ?? 0) >= threshold) return 1
  }
  return 2
}

// ── Cross Amp ─────────────────────────────────────────────────────────────────
export function getCrossAmplifierBonus(row, col, grid) {
  let bonus = 0
  for (const [dr, dc] of DIAGONAL) {
    const n = grid[row + dr]?.[col + dc]
    if (n && n.type === 'cross_amp' && n.pauseTimer === 0 && n.pixelCount > 0) {
      bonus += Math.floor(n.pixelCount / 10)
    }
  }
  return bonus
}

// ── Greedy (on-complete gold) ─────────────────────────────────────────────────
export function calculateGreedyBonus(row, col, grid) {
  const block = grid[row][col]
  if (!block || block.type !== 'greedy') return 0
  let neighborTotal = 0
  for (const [dr, dc] of ALL8) {
    const n = grid[row + dr]?.[col + dc]
    if (n) neighborTotal += n.pixelCount
  }
  return Math.max(0, (block.pixelCount - neighborTotal) * 10)
}

export function totalGreedyBonus(grid) {
  let total = 0
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) total += calculateGreedyBonus(r, c, grid)
  return total
}

// ── Forge (on-complete gold) ──────────────────────────────────────────────────
export function calculateForgeBonus(row, col, grid) {
  const block = grid[row][col]
  if (!block || block.type !== 'forge') return 0
  return block.pixelCount * 3
}

export function totalForgeBonus(grid) {
  let total = 0
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) total += calculateForgeBonus(r, c, grid)
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
      if (b && b.type === 'catalyst' && b.pauseTimer === 0 && b.pixelCount > 0) rows.add(r)
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
// bonusMap comes from buildSynergyData — additive bonuses per cell
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
// Colors come from the fixed pixelLayout of the design — no painting involved
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
    if (n && n.type === 'splitter' && n.pauseTimer === 0 && n.pixelCount > 0) {
      bonus += Math.floor((rateMap[nr]?.[nc] ?? 0) * 0.20)
    }
  }
  return bonus
}

// ── Focus (deterministic: uses design's dominantColor ratio) ──────────────────
// dominantColor is precomputed in the design; ratio is fixed art.
// Multiplier = 1 + (dominant color count / pixelCount)
export function getFocusMultiplier(block) {
  if (block.type !== 'focus' || !block.dominantColor || !block.pixelCount) return 1
  let match = 0
  for (const row of block.pixelLayout) {
    for (const color of row) {
      if (color === block.dominantColor) match++
    }
  }
  return 1 + match / block.pixelCount
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

// ── Color Checker (triggers on placement since dominantColor ≥50% is guaranteed) ──
// Returns 1 always (the reduction is applied once at placement via gameStore).
// The multiplier itself is not needed at tick time.
export function getColorCheckerReduction(block) {
  if (block.type !== 'color_checker') return 0
  return block.colorCheckerTriggered ? 0 : 1  // 1 = needs triggering
}

// ── Lattice grid-style helper ─────────────────────────────────────────────────
export function getLatticeBonus(row, col, grid) {
  let count = 0
  for (const [dr, dc] of ORTHOGONAL) {
    if (grid[row + dr]?.[col + dc]) count++
  }
  return count === 4 ? 1.35 : 1
}
