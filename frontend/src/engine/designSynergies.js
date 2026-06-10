// ── Design Synergy Engine ──────────────────────────────────────────────────────
// Replaces setDetector.js + synergyEngine.js.
// Synergies are based on design series groupings rather than pixel colors.

import { GRID_SIZE } from '../lib/constants'

const ORTHO = [[-1,0],[1,0],[0,-1],[0,1]]
const DIAG  = [[-1,-1],[-1,1],[1,-1],[1,1]]
const ALL8  = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]

// ── Synergy definitions ───────────────────────────────────────────────────────
// type: 'series_count'   — N designs of same series anywhere on grid
//       'exact_count'    — N copies of same design id anywhere on grid
//       'adjacency_pair' — two specific series/design types placed orthogonally adjacent
//       'row_series'     — N designs of same series in the same row
// radiation: bonus spread from qualifying blocks to their neighbors

export const SYNERGY_DEFS = {
  // ── Series count synergies ────────────────────────────────────────────────
  GARDEN: {
    name: 'Garden', type: 'series_count', series: 'flowers', required: 5,
    own: 0.20, radiation: { type: 'ortho', amount: 0.08 },
    desc: '5 flower designs → +20% output; spreads +8% to ortho neighbors',
  },
  FOREST: {
    name: 'Forest', type: 'series_count', series: 'trees', required: 5,
    own: 0.15, radiation: { type: 'ortho', amount: 0.10 },
    desc: '5 tree designs → +15% output; spreads +10% to ortho neighbors',
  },
  URBAN: {
    name: 'Urban Planning', type: 'series_count', series: 'buildings', required: 5,
    own: 0.18, radiation: { type: 'diag', amount: 0.08 },
    desc: '5 building designs → +18% output; spreads +8% to diagonal neighbors',
  },
  COSMOS: {
    name: 'Cosmos', type: 'series_count', series: 'celestial', required: 5,
    own: 0.22, radiation: { type: 'all8', amount: 0.07 },
    desc: '5 celestial designs → +22% output; radiates +7% in all 8 directions',
  },
  MENAGERIE: {
    name: 'Menagerie', type: 'series_count', series: 'animals', required: 5,
    own: 0.20, radiation: { type: 'ortho', amount: 0.08 },
    desc: '5 animal designs → +20% output; spreads +8% to ortho neighbors',
  },
  GEOMETRY: {
    name: 'Geometry', type: 'series_count', series: 'shapes', required: 4,
    own: 0.18, radiation: { type: 'diag', amount: 0.10 },
    desc: '4 shape designs → +18% output; spreads +10% to diagonal neighbors',
  },
  FEAST: {
    name: 'Feast', type: 'series_count', series: 'food', required: 4,
    own: 0.16, radiation: { type: 'ortho', amount: 0.06 },
    desc: '4 food designs → +16% output; spreads +6% to ortho neighbors',
  },
  EMBLEMS: {
    name: 'Emblems', type: 'series_count', series: 'symbols', required: 4,
    own: 0.20, radiation: { type: 'all8', amount: 0.06 },
    desc: '4 symbol designs → +20% output; radiates +6% in all 8 directions',
  },
  STORM_FRONT: {
    name: 'Storm Front', type: 'series_count', series: 'weather', required: 4,
    own: 0.18, radiation: { type: 'ortho', amount: 0.08 },
    desc: '4 weather designs → +18% output; spreads +8% to ortho neighbors',
  },
  EXPEDITION: {
    name: 'Expedition', type: 'series_count', series: 'landscapes', required: 4,
    own: 0.16, radiation: { type: 'ortho', amount: 0.08 },
    desc: '4 landscape designs → +16% output; spreads +8% to ortho neighbors',
  },
  STARFLEET: {
    name: 'Starfleet', type: 'series_count', series: 'space', required: 5,
    own: 0.24, radiation: { type: 'all8', amount: 0.09 },
    desc: '5 space designs → +24% output; radiates +9% in all 8 directions',
  },
  ALGORITHM: {
    name: 'Algorithm', type: 'series_count', series: 'abstract', required: 3,
    own: 0.15, radiation: { type: 'all8', amount: 0.07 },
    desc: '3 abstract designs → +15% output; radiates +7% in all 8 directions',
  },

  // ── Exact design count synergies ──────────────────────────────────────────
  ROSE_PARADE: {
    name: 'Rose Parade', type: 'exact_count', designId: 'rose', required: 3,
    own: 0.25, radiation: { type: 'ortho', amount: 0.10 },
    desc: '3 Rose designs → +25% each; spreads +10% to ortho neighbors',
  },
  SUNFLOWER_FIELD: {
    name: 'Sunflower Field', type: 'exact_count', designId: 'sunflower', required: 3,
    own: 0.22, radiation: { type: 'all8', amount: 0.08 },
    desc: '3 Sunflower designs → +22% each; radiates +8% to all 8 neighbors',
  },
  OAK_GROVE: {
    name: 'Oak Grove', type: 'exact_count', designId: 'oak', required: 3,
    own: 0.20, radiation: { type: 'ortho', amount: 0.10 },
    desc: '3 Oak designs → +20% each; spreads +10% to ortho neighbors',
  },
  MOUNTAIN_RANGE: {
    name: 'Mountain Range', type: 'exact_count', designId: 'mountain', required: 3,
    own: 0.22, radiation: { type: 'diag', amount: 0.10 },
    desc: '3 Mountain designs → +22% each; spreads +10% to diagonal neighbors',
  },
  STAR_CLUSTER: {
    name: 'Star Cluster', type: 'exact_count', designId: 'star', required: 4,
    own: 0.28, radiation: { type: 'all8', amount: 0.10 },
    desc: '4 Star designs → +28% each; radiates +10% in all 8 directions',
  },
  HEART_ARRAY: {
    name: 'Heart Array', type: 'exact_count', designId: 'heart', required: 3,
    own: 0.20, radiation: { type: 'all8', amount: 0.08 },
    desc: '3 Heart designs → +20% each; radiates +8% in all 8 directions',
  },
  SNOWFIELD: {
    name: 'Snowfield', type: 'exact_count', designId: 'snowflake', required: 3,
    own: 0.22, radiation: { type: 'ortho', amount: 0.10 },
    desc: '3 Snowflake designs → +22% each; spreads +10% to ortho neighbors',
  },
  REEF: {
    name: 'Reef', type: 'exact_count', designId: 'fish', required: 3,
    own: 0.24, radiation: { type: 'ortho', amount: 0.08 },
    desc: '3 Fish designs → +24% each; spreads +8% to ortho neighbors',
  },

  // ── Adjacency pair synergies ──────────────────────────────────────────────
  SUN_AND_MOON: {
    name: 'Sun & Moon', type: 'adjacency_pair',
    seriesA: 'celestial', seriesB: 'celestial',
    designA: 'sun', designB: 'moon',
    own: 0.30, radiation: null,
    desc: 'Sun adjacent to Moon → both get +30% output',
  },
  SEA_AND_SKY: {
    name: 'Sea & Sky', type: 'adjacency_pair',
    seriesA: 'weather', seriesB: 'landscapes',
    designA: null, designB: null,
    own: 0.15, radiation: { type: 'all8', amount: 0.05 },
    desc: 'Any weather adjacent to any landscape → both +15%; radiates +5%',
  },
  HUNTER_AND_PREY: {
    name: 'Hunter & Prey', type: 'adjacency_pair',
    seriesA: 'animals', seriesB: 'animals',
    designA: 'fox', designB: 'rabbit',
    own: 0.35, radiation: null,
    desc: 'Fox adjacent to Rabbit → both get +35% output',
  },
  FIRE_AND_ICE: {
    name: 'Fire & Ice', type: 'adjacency_pair',
    seriesA: 'symbols', seriesB: 'weather',
    designA: 'flame_sym', designB: 'ice_crystal',
    own: 0.40, radiation: null,
    desc: 'Flame adjacent to Ice Crystal → both get +40% output',
  },
  BLOOM_AND_TREE: {
    name: 'Bloom & Tree', type: 'adjacency_pair',
    seriesA: 'flowers', seriesB: 'trees',
    designA: null, designB: null,
    own: 0.12, radiation: { type: 'ortho', amount: 0.06 },
    desc: 'Any flower adjacent to any tree → both +12%; spreads +6% to ortho neighbors',
  },
  EARTH_AND_SPACE: {
    name: 'Earth & Space', type: 'adjacency_pair',
    seriesA: 'landscapes', seriesB: 'space',
    designA: null, designB: null,
    own: 0.18, radiation: { type: 'all8', amount: 0.06 },
    desc: 'Any landscape adjacent to any space design → both +18%',
  },
  CROWN_AND_SWORD: {
    name: 'Crown & Sword', type: 'adjacency_pair',
    seriesA: 'symbols', seriesB: 'symbols',
    designA: 'crown', designB: 'sword',
    own: 0.35, radiation: null,
    desc: 'Crown adjacent to Sword → both get +35% output',
  },

  // ── Row synergies (N same-series in one row) ──────────────────────────────
  FLOWER_ROW: {
    name: 'Flower Row', type: 'row_series', series: 'flowers', required: 4,
    own: 0.25, radiation: null,
    desc: '4 flower designs in same row → +25% each in that row',
  },
  BUILDING_ROW: {
    name: 'City Block', type: 'row_series', series: 'buildings', required: 4,
    own: 0.28, radiation: null,
    desc: '4 building designs in same row → +28% each in that row',
  },
  ANIMAL_ROW: {
    name: 'Animal Kingdom', type: 'row_series', series: 'animals', required: 4,
    own: 0.22, radiation: { type: 'ortho', amount: 0.08 },
    desc: '4 animal designs in same row → +22% each; spreads +8% to row neighbors',
  },
  SPACE_ROW: {
    name: 'Orbital Array', type: 'row_series', series: 'space', required: 4,
    own: 0.30, radiation: { type: 'all8', amount: 0.08 },
    desc: '4 space designs in same row → +30% each in that row',
  },
  SHAPE_ROW: {
    name: 'Pattern Matrix', type: 'row_series', series: 'shapes', required: 3,
    own: 0.20, radiation: null,
    desc: '3 shape designs in same row → +20% each in that row',
  },
}

// ── Design synergy lookup (for tooltips) ──────────────────────────────────────
// Returns array of synergy names that this design can participate in.
export function getDesignSynergies(design) {
  const names = []
  for (const def of Object.values(SYNERGY_DEFS)) {
    if (def.type === 'series_count' || def.type === 'row_series') {
      if (def.series === design.series) names.push(def.name)
    } else if (def.type === 'exact_count') {
      if (def.designId === design.id) names.push(def.name)
    } else if (def.type === 'adjacency_pair') {
      if (def.seriesA === design.series || def.seriesB === design.series ||
          def.designA === design.id    || def.designB === design.id) {
        names.push(def.name)
      }
    }
  }
  return names
}

// ── Detection ─────────────────────────────────────────────────────────────────

function getBlockSeries(block) {
  return block?.designId ? block.series ?? null : null
}

function getBlockDesignId(block) {
  return block?.designId ?? null
}

function isOrthoAdjacent(r1, c1, r2, c2) {
  return (Math.abs(r1-r2) + Math.abs(c1-c2)) === 1
}

/**
 * Main function. Returns:
 *   synergyMap[r][c] = id of highest-value active synergy affecting that cell (or null)
 *   activeList = all synergy states for the ActiveEffectsPanel
 *   synergyBonusMap[r][c] = total additive output bonus for that cell (own + radiation received)
 */
export function buildSynergyData(grid, neuralGridStyle = false) {
  const threshold = neuralGridStyle ? -1 : 0  // Neural: thresholds -1

  // Collect all block positions and their metadata
  const blocks = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const b = grid[r][c]
      if (b) blocks.push({ r, c, b, series: b.series ?? null, designId: b.designId ?? null })
    }
  }

  // Count series and exact designs
  const seriesCount = {}
  const designCount = {}
  for (const { series, designId } of blocks) {
    if (series) seriesCount[series] = (seriesCount[series] ?? 0) + 1
    if (designId) designCount[designId] = (designCount[designId] ?? 0) + 1
  }

  // For each cell, accumulate bonuses
  const bonusMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
  const synergyMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
  const activeList = []

  for (const [synergyId, def] of Object.entries(SYNERGY_DEFS)) {
    const required = def.required + threshold

    if (def.type === 'series_count') {
      const count = seriesCount[def.series] ?? 0
      const active = count >= required
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: count, required: def.required })
      if (!active) continue

      for (const { r, c, series } of blocks) {
        if (series !== def.series) continue
        bonusMap[r][c] += def.own
        if (!synergyMap[r][c] || def.own > (SYNERGY_DEFS[synergyMap[r][c]]?.own ?? 0)) {
          synergyMap[r][c] = synergyId
        }
        // Radiation
        if (def.radiation) {
          const dirs = def.radiation.type === 'ortho' ? ORTHO
                     : def.radiation.type === 'diag' ? DIAG : ALL8
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc]) {
              bonusMap[nr][nc] += def.radiation.amount
            }
          }
        }
      }
    }

    else if (def.type === 'exact_count') {
      const count = designCount[def.designId] ?? 0
      const active = count >= required
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: count, required: def.required })
      if (!active) continue

      for (const { r, c, designId } of blocks) {
        if (designId !== def.designId) continue
        bonusMap[r][c] += def.own
        if (!synergyMap[r][c] || def.own > (SYNERGY_DEFS[synergyMap[r][c]]?.own ?? 0)) {
          synergyMap[r][c] = synergyId
        }
        if (def.radiation) {
          const dirs = def.radiation.type === 'ortho' ? ORTHO
                     : def.radiation.type === 'diag' ? DIAG : ALL8
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc]) {
              bonusMap[nr][nc] += def.radiation.amount
            }
          }
        }
      }
    }

    else if (def.type === 'adjacency_pair') {
      // Find qualifying adjacent pairs
      const qualifyingCells = new Set()
      let anyFound = false

      for (let i = 0; i < blocks.length; i++) {
        const a = blocks[i]
        const aMatch = (def.designA ? a.designId === def.designA : a.series === def.seriesA)
        if (!aMatch) continue
        for (let j = i + 1; j < blocks.length; j++) {
          const b = blocks[j]
          const bMatch = (def.designB ? b.designId === def.designB : b.series === def.seriesB)
          if (!bMatch) continue
          if (isOrthoAdjacent(a.r, a.c, b.r, b.c)) {
            qualifyingCells.add(`${a.r},${a.c}`)
            qualifyingCells.add(`${b.r},${b.c}`)
            anyFound = true
          }
        }
      }

      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: anyFound, progress: anyFound ? 1 : 0, required: 1 })
      if (!anyFound) continue

      for (const key of qualifyingCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.own
        if (!synergyMap[r][c] || def.own > (SYNERGY_DEFS[synergyMap[r][c]]?.own ?? 0)) {
          synergyMap[r][c] = synergyId
        }
        if (def.radiation) {
          const dirs = def.radiation.type === 'ortho' ? ORTHO
                     : def.radiation.type === 'diag' ? DIAG : ALL8
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc]) {
              bonusMap[nr][nc] += def.radiation.amount
            }
          }
        }
      }
    }

    else if (def.type === 'row_series') {
      // Check each row independently
      let totalActive = 0
      for (let r = 0; r < GRID_SIZE; r++) {
        const rowCells = blocks.filter(b => b.r === r && b.series === def.series)
        if (rowCells.length >= required) {
          totalActive += rowCells.length
          for (const { c } of rowCells) {
            bonusMap[r][c] += def.own
            if (!synergyMap[r][c] || def.own > (SYNERGY_DEFS[synergyMap[r][c]]?.own ?? 0)) {
              synergyMap[r][c] = synergyId
            }
            if (def.radiation) {
              const dirs = def.radiation.type === 'ortho' ? ORTHO
                         : def.radiation.type === 'diag' ? DIAG : ALL8
              for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc]) {
                  bonusMap[nr][nc] += def.radiation.amount
                }
              }
            }
          }
        }
      }
      const totalInSeries = seriesCount[def.series] ?? 0
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: totalActive > 0, progress: totalInSeries, required: def.required })
    }
  }

  return { synergyMap, bonusMap, activeList }
}

// Returns additive output multiplier for a cell (1 + bonus)
export function getSynergyMultiplier(r, c, bonusMap) {
  return 1 + (bonusMap[r]?.[c] ?? 0)
}

// Synergy bonus between two same-series adjacent blocks (+15% base; adjustable by Synergy+ or Catalyst)
export function getAdjacencySynergyBonus(r, c, grid, synergyPlusMult = 1) {
  const block = grid[r][c]
  if (!block?.series) return 1
  for (const [dr, dc] of ORTHO) {
    const n = grid[r + dr]?.[c + dc]
    if (n?.series === block.series) {
      return 1 + 0.15 * synergyPlusMult
    }
  }
  return 1
}

// Highest synergy own-bonus for Conductor block to borrow
export function getBestNeighborSynergyBonus(r, c, grid, bonusMap) {
  let best = 0
  for (const [dr, dc] of ALL8) {
    const nr = r + dr, nc = c + dc
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc]) {
      best = Math.max(best, bonusMap[nr]?.[nc] ?? 0)
    }
  }
  return 1 + best
}
