import { GRID_SIZE } from '../lib/constants'

// A block is dominant when one non-white color exceeds 50% of its total filled pixels.
function isDominant(block) {
  const counts = {}
  let total = 0

  for (const row of block.pixelLayout) {
    for (const color of row) {
      if (color) {
        if (color !== 'white') counts[color] = (counts[color] ?? 0) + 1
        total++
      }
    }
  }

  if (total === 0) return false
  return Object.values(counts).some(n => n / total > 0.5)
}

// Returns a Set of "row,col" strings that receive the +25% dominance boost.
export function buildDominanceMap(grid) {
  const boosted = new Set()

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const block = grid[r][c]
      if (!block || block.pixelCount === 0) continue
      if (!isDominant(block)) continue

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            boosted.add(`${nr},${nc}`)
          }
        }
      }
    }
  }

  return boosted
}
