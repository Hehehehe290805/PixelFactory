import { PIXEL_SETS } from '../lib/constants'

// Special pixel behaviour during set detection:
// - 'silver'  → treated as 'white' (neutral, ignored by allowed-color check)
// - 'rainbow' → wildcard: counts as any color
// - 'gold'    → wildcard: counts as any color (like rainbow)
// - 'neon'    → real color for set matching purposes

const NEUTRAL_PIXELS  = new Set(['silver', 'white'])
const WILDCARD_PIXELS = new Set(['rainbow', 'gold'])

export function detectSet(pixelLayout) {
  const counts = {}  // real color counts (neutrals excluded, wildcards tracked separately)
  let wildcards = 0
  let total     = 0

  for (const row of pixelLayout) {
    for (const color of row) {
      if (!color) continue
      total++
      if (NEUTRAL_PIXELS.has(color)) continue  // white/silver don't count toward set composition
      if (WILDCARD_PIXELS.has(color)) { wildcards++; continue }
      counts[color] = (counts[color] ?? 0) + 1
    }
  }

  if (total === 0) return null

  for (const [setName, def] of Object.entries(PIXEL_SETS)) {
    if (total < def.minPixels) continue

    const allowed = new Set(def.colors)
    const used    = Object.keys(counts)

    // All real colors used must be in the allowed set
    // (neutral pixels and wildcards never violate the "only" constraint)
    if (!used.every(c => allowed.has(c))) continue

    // Every required color must be satisfied by real counts + wildcards
    let remaining = wildcards
    let allSatisfied = true
    for (const req of def.colors) {
      if (NEUTRAL_PIXELS.has(req)) continue // 'white' in PHILIPPINES — satisfied by presence
      if (!counts[req]) {
        if (remaining > 0) { remaining--; continue }
        allSatisfied = false; break
      }
    }
    if (!allSatisfied) continue

    return setName
  }

  return null
}

export function buildSetMap(grid) {
  return grid.map(row =>
    row.map(cell => (cell ? detectSet(cell.pixelLayout) : null))
  )
}
