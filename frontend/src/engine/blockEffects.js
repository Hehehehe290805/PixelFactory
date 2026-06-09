import { GRID_SIZE, PIXEL_COLORS, PIXEL_SETS } from '../lib/constants'

const ORTHOGONAL = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const ALL8       = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
const DIAGONAL   = [[-1,-1],[-1,1],[1,-1],[1,1]]

// ── Helpers ──────────────────────────────────────────────────────────────────

function nbOrtho(r, c, grid) {
  return ORTHOGONAL.map(([dr, dc]) => grid[r + dr]?.[c + dc]).filter(Boolean)
}

// ── Base output ───────────────────────────────────────────────────────────────
// 25 white pixels → ~0.667 px/s (1 per 1.5s); 20 white pixels → ~0.533 px/s.
// Uses effectivePixels to account for special pixel multipliers (silver 2×, neon 1.5×, etc.)
export function baseRate(block) {
  if (block.pixelCount === 0) return 0
  let effectivePixels = 0
  for (const row of block.pixelLayout) {
    for (const color of row) {
      if (!color) continue
      effectivePixels += PIXEL_COLORS[color]?.outputMult ?? 1
    }
  }
  return effectivePixels / 37.5
}

// ── Original block effects ────────────────────────────────────────────────────

export function getDoublerMultiplier(block, row, col, grid) {
  if (block.type !== 'doubler' || block.pixelCount === 0) return 1
  const threshold = block.pixelCount / 2
  for (const [dr, dc] of ORTHOGONAL) {
    const n = grid[row + dr]?.[col + dc]
    if ((n?.pixelCount ?? 0) >= threshold) return 1
  }
  return 2
}

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
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) total += calculateGreedyBonus(r, c, grid)
  }
  return total
}

// Gold pixel bonus: sum gold pixels on all placed blocks × 5 gold per pixel
export function totalGoldPixelBonus(grid) {
  let bonus = 0
  for (const row of grid) {
    for (const block of row) {
      if (!block) continue
      for (const r of block.pixelLayout) {
        for (const color of r) {
          if (color === 'gold') bonus += PIXEL_COLORS.gold.goldPerPixel ?? 5
        }
      }
    }
  }
  return bonus
}

// ── Overflow (burst 3× for 5s every 10s) ─────────────────────────────────────
// overflowTimer cycles 0–149: 0–99 charging, 100–149 burst
export function getOverflowMultiplier(block) {
  if (block.type !== 'overflow') return 1
  return (block.overflowTimer ?? 0) >= 100 ? 3.0 : 1.0
}

// ── Catalyst (synergy bonuses in same row ×1.5) ───────────────────────────────
// Returns a Set of row indices that contain an active catalyst
export function buildCatalystRows(grid) {
  const rows = new Set()
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const b = grid[r][c]
      if (b && b.type === 'catalyst' && b.pauseTimer === 0 && b.pixelCount > 0) {
        rows.add(r)
      }
    }
  }
  return rows
}

// ── Void (+15% to each of its 8 neighbors, produces 0 itself) ────────────────
export function getVoidBonus(row, col, grid) {
  let bonus = 1
  for (const [dr, dc] of ALL8) {
    const n = grid[row + dr]?.[col + dc]
    if (n && n.type === 'void' && n.pauseTimer === 0) bonus += 0.15
  }
  return bonus
}

// ── Phase-2 block effects ─────────────────────────────────────────────────────

// Amplifier: +8% per occupied neighbor (max 8 neighbors = +64%)
export function getAmplifierMultiplier(block, row, col, grid) {
  if (block.type !== 'amplifier') return 1
  let count = 0
  for (const [dr, dc] of ALL8) {
    const r = row + dr, c = col + dc
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && grid[r][c]) count++
  }
  return 1 + count * 0.08
}

// Resonator: +50% if any orthogonal neighbor is the same type
export function getResonatorMultiplier(block, row, col, grid) {
  if (block.type !== 'resonator') return 1
  for (const n of nbOrtho(row, col, grid)) {
    if (n.type === 'resonator') return 1.5
  }
  return 1
}

// Reactor: ramps from 0.5× to 2.0× based on reactorAge (ticks since placed/moved)
export function getReactorMultiplier(block) {
  if (block.type !== 'reactor') return 1
  const age = block.reactorAge ?? 0
  return Math.min(2.0, 0.5 + (age / 150) * 1.5)
}

// Conductor: borrows the highest outputBonus from adjacent blocks' active sets
export function getConductorBonus(block, row, col, grid, setMap) {
  if (block.type !== 'conductor') return 1
  let best = 0
  for (const [dr, dc] of ALL8) {
    const neighborSet = setMap[row + dr]?.[col + dc]
    if (neighborSet && PIXEL_SETS[neighborSet]) {
      best = Math.max(best, PIXEL_SETS[neighborSet].outputBonus)
    }
  }
  return 1 + best
}

// Prism: +5% per unique non-white/silver color in its pixels (max 6 colors = +30%)
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

// Mirror: copy output rate of highest-producing orthogonal neighbor
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

// ── Phase-3 block effects ─────────────────────────────────────────────────────

// Echo: +4% per 10s stationary (100 ticks), max +80% at 200s (2000 ticks)
export function getEchoMultiplier(block) {
  if (block.type !== 'echo') return 1
  const stacks = Math.floor((block.echoAge ?? 0) / 100)
  return 1 + Math.min(stacks * 0.04, 0.80)
}

// Splitter: each orthogonal neighbor receives a flat +20% of the splitter's base rate
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

// Focus: assigned a random color at placement; output scales with pixel match ratio
// Base ×1 at 0% match, ×2 at 100% match (1 + matchRatio)
export function getFocusMultiplier(block) {
  if (block.type !== 'focus' || !block.focusColor || block.pixelCount === 0) return 1
  let match = 0
  for (const row of block.pixelLayout) {
    for (const color of row) {
      if (color === block.focusColor) match++
    }
  }
  return 1 + match / block.pixelCount
}

// Cluster: +12% per occupied neighbor (all 8), void blocks excluded
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

// Forge: on level complete, earns +3 gold per pixel held (no production bonus)
export function calculateForgeBonus(row, col, grid) {
  const block = grid[row][col]
  if (!block || block.type !== 'forge') return 0
  return block.pixelCount * 3
}

export function totalForgeBonus(grid) {
  let total = 0
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) total += calculateForgeBonus(r, c, grid)
  }
  return total
}

// ── Lattice grid-style helper ────────────────────────────────────────────────
// +35% to blocks with exactly 4 occupied orthogonal neighbors
export function getLatticeBonus(row, col, grid) {
  let count = 0
  for (const [dr, dc] of ORTHOGONAL) {
    if (grid[row + dr]?.[col + dc]) count++
  }
  return count === 4 ? 1.35 : 1
}
