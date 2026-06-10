// ── Design Synergy Engine ──────────────────────────────────────────────────────
// Replaces setDetector.js + synergyEngine.js.
// Synergies are based on design series groupings rather than pixel colors.

import { GRID_SIZE } from '../lib/constants'

const ORTHO = [[-1,0],[1,0],[0,-1],[0,1]]
const DIAG  = [[-1,-1],[-1,1],[1,-1],[1,1]]
const ALL8  = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]

// ── Synergy definitions ───────────────────────────────────────────────────────
// type: 'series_count'    — N designs of same series anywhere on grid
//       'exact_count'     — N copies of same design id anywhere on grid
//       'adjacency_pair'  — two specific series/design types placed orthogonally adjacent
//       'row_series'      — N designs of same series in the same row
//       'long_range'      — two designs at least minDist (Manhattan) cells apart
//       'core_radius'     — coreDesignId/coreSeries as anchor + N satellites within radius cells
//       'block_type_count'— N blocks sharing the same blockType anywhere on grid
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

  // ── Mini-tier series synergies (2 designs → small bonus) ──────────────────
  BLOOM: {
    name: 'Bloom', type: 'series_count', series: 'flowers', required: 2,
    own: 0.08, radiation: { type: 'ortho', amount: 0.04 },
    desc: '2 flower designs → +8% each; spreads +4% to ortho neighbors',
  },
  GROVE: {
    name: 'Grove', type: 'series_count', series: 'trees', required: 2,
    own: 0.08, radiation: { type: 'ortho', amount: 0.04 },
    desc: '2 tree designs → +8% each; spreads +4% to ortho neighbors',
  },
  DISTRICT: {
    name: 'District', type: 'series_count', series: 'buildings', required: 2,
    own: 0.08, radiation: { type: 'diag', amount: 0.04 },
    desc: '2 building designs → +8% each; spreads +4% to diagonal neighbors',
  },
  CONSTELLATION: {
    name: 'Constellation', type: 'series_count', series: 'celestial', required: 2,
    own: 0.10, radiation: { type: 'all8', amount: 0.04 },
    desc: '2 celestial designs → +10% each; radiates +4% in all directions',
  },
  DUO: {
    name: 'Duo', type: 'series_count', series: 'animals', required: 2,
    own: 0.08, radiation: { type: 'ortho', amount: 0.04 },
    desc: '2 animal designs → +8% each; spreads +4% to ortho neighbors',
  },
  FORM: {
    name: 'Form', type: 'series_count', series: 'shapes', required: 2,
    own: 0.10, radiation: { type: 'diag', amount: 0.04 },
    desc: '2 shape designs → +10% each; spreads +4% to diagonal neighbors',
  },
  PAIR: {
    name: 'Pair', type: 'series_count', series: 'food', required: 2,
    own: 0.08, radiation: { type: 'ortho', amount: 0.03 },
    desc: '2 food designs → +8% each; spreads +3% to ortho neighbors',
  },
  SIGIL: {
    name: 'Sigil', type: 'series_count', series: 'symbols', required: 2,
    own: 0.10, radiation: { type: 'all8', amount: 0.04 },
    desc: '2 symbol designs → +10% each; radiates +4% in all directions',
  },
  GUST: {
    name: 'Gust', type: 'series_count', series: 'weather', required: 2,
    own: 0.08, radiation: { type: 'ortho', amount: 0.04 },
    desc: '2 weather designs → +8% each; spreads +4% to ortho neighbors',
  },
  TERRAIN: {
    name: 'Terrain', type: 'series_count', series: 'landscapes', required: 2,
    own: 0.08, radiation: { type: 'ortho', amount: 0.04 },
    desc: '2 landscape designs → +8% each; spreads +4% to ortho neighbors',
  },
  ORBIT: {
    name: 'Orbit', type: 'series_count', series: 'space', required: 2,
    own: 0.12, radiation: { type: 'all8', amount: 0.05 },
    desc: '2 space designs → +12% each; radiates +5% in all directions',
  },
  SEQUENCE: {
    name: 'Sequence', type: 'series_count', series: 'abstract', required: 2,
    own: 0.08, radiation: { type: 'all8', amount: 0.04 },
    desc: '2 abstract designs → +8% each; radiates +4% in all directions',
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

  // ── Long-range synergies (blocks ≥ minDist Manhattan distance apart) ───────
  // Rewards spreading designs across the full grid rather than clustering.
  DISTANT_STARS: {
    name: 'Distant Stars', type: 'long_range', series: 'space', minDist: 5,
    own: 0.25, radiation: { type: 'all8', amount: 0.08 },
    desc: '2 space designs ≥5 cells apart → both +25%; radiates +8% nearby',
  },
  ANTIPODES: {
    name: 'Antipodes', type: 'long_range', series: 'landscapes', minDist: 6,
    own: 0.22, radiation: { type: 'ortho', amount: 0.06 },
    desc: '2 landscape designs ≥6 cells apart → both +22%; spreads +6% ortho',
  },
  POLAR_WINDS: {
    name: 'Polar Winds', type: 'long_range',
    seriesA: 'weather', seriesB: 'landscapes', minDist: 5,
    own: 0.28, radiation: null,
    desc: 'Any weather + any landscape ≥5 cells apart → both +28%',
  },
  TRANSCONTINENTAL: {
    name: 'Transcontinental', type: 'long_range', series: 'buildings', minDist: 5,
    own: 0.20, radiation: { type: 'ortho', amount: 0.07 },
    desc: '2 building designs ≥5 cells apart → both +20%; spreads +7% ortho',
  },
  WILD_MIGRATION: {
    name: 'Wild Migration', type: 'long_range', series: 'animals', minDist: 5,
    own: 0.22, radiation: { type: 'ortho', amount: 0.06 },
    desc: '2 animal designs ≥5 cells apart → both +22%; spreads +6% ortho',
  },

  // ── Core-radius synergies (anchor block + N satellites within radius) ──────
  // The core block gets ownCore bonus; each qualifying satellite gets ownSatellite.
  SOLAR_SYSTEM: {
    name: 'Solar System', type: 'core_radius',
    coreDesignId: 'sun', satelliteSeries: 'space',
    requiredSatellites: 3, radius: 3,
    own: 0.35, ownCore: 0.40, ownSatellite: 0.20,
    desc: 'Sun as core + 3 space designs within 3 cells → Sun +40%, satellites +20%',
  },
  ROYAL_COURT: {
    name: 'Royal Court', type: 'core_radius',
    coreDesignId: 'crown', satelliteSeries: 'symbols',
    requiredSatellites: 3, radius: 2,
    own: 0.30, ownCore: 0.35, ownSatellite: 0.20,
    desc: 'Crown as core + 3 symbol designs within 2 cells → Crown +35%, others +20%',
  },
  ECOSYSTEM: {
    name: 'Ecosystem', type: 'core_radius',
    coreSeries: 'trees', satelliteSeries: 'animals',
    requiredSatellites: 3, radius: 2,
    own: 0.22, ownCore: 0.25, ownSatellite: 0.18,
    desc: 'Any tree as core + 3 animal designs within 2 cells → tree +25%, animals +18%',
  },
  MOUNTAIN_KINGDOM: {
    name: 'Mountain Kingdom', type: 'core_radius',
    coreDesignId: 'mountain', satelliteSeries: 'landscapes',
    requiredSatellites: 3, radius: 2,
    own: 0.24, ownCore: 0.30, ownSatellite: 0.18,
    desc: 'Mountain as core + 3 landscape designs within 2 cells → Mountain +30%, others +18%',
  },
  BLOOMING_CORE: {
    name: 'Blooming Core', type: 'core_radius',
    coreSeries: 'flowers', satelliteSeries: 'flowers',
    requiredSatellites: 4, radius: 3,
    own: 0.25, ownCore: 0.35, ownSatellite: 0.15,
    desc: 'Any flower as core + 4 other flowers within 3 cells → core +35%, ring +15%',
  },

  // ── Block-type synergies (N blocks sharing the same blockType) ────────────
  // Works regardless of series — purely based on effect type.
  DOUBLE_DOWN: {
    name: 'Double Down', type: 'block_type_count', blockType: 'doubler', required: 3,
    own: 0.25, radiation: { type: 'ortho', amount: 0.08 },
    desc: '3 doubler blocks → +25% each; spreads +8% to ortho neighbors',
  },
  REACTOR_NETWORK: {
    name: 'Reactor Network', type: 'block_type_count', blockType: 'reactor', required: 2,
    own: 0.30, radiation: { type: 'all8', amount: 0.10 },
    desc: '2 reactor blocks → +30% each; radiates +10% in all directions',
  },
  ECHO_CHAMBER: {
    name: 'Echo Chamber', type: 'block_type_count', blockType: 'echo', required: 3,
    own: 0.20, radiation: { type: 'ortho', amount: 0.07 },
    desc: '3 echo blocks → +20% each; spreads +7% to ortho neighbors',
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
    } else if (def.type === 'long_range') {
      if ((def.series && def.series === design.series) ||
          def.seriesA === design.series || def.seriesB === design.series ||
          def.designA === design.id    || def.designB === design.id) {
        names.push(def.name)
      }
    } else if (def.type === 'core_radius') {
      if ((def.coreDesignId && def.coreDesignId === design.id) ||
          (def.coreSeries && def.coreSeries === design.series) ||
          (def.satelliteSeries && def.satelliteSeries === design.series)) {
        names.push(def.name)
      }
    } else if (def.type === 'block_type_count') {
      if (def.blockType === design.blockType) names.push(def.name)
    }
  }
  return names
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDefPriority(def) {
  // Used to decide which synergy "wins" a cell when multiple overlap.
  return def.ownCore ?? def.own ?? 0
}

// ── Detection ─────────────────────────────────────────────────────────────────

/**
 * Main function. Returns:
 *   synergyMap[r][c] = id of highest-value active synergy affecting that cell (or null)
 *   activeList = all synergy states for the ActiveEffectsPanel
 *   bonusMap[r][c] = total additive output bonus for that cell (own + radiation received)
 */
export function buildSynergyData(grid, neuralGridStyle = false) {
  const threshold = neuralGridStyle ? -1 : 0  // Neural: thresholds -1

  // Collect all block positions and their metadata
  const blocks = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const b = grid[r][c]
      if (b) blocks.push({ r, c, b, series: b.series ?? null, designId: b.designId ?? null, blockType: b.type ?? null })
    }
  }

  // Count series, exact designs, and block types
  const seriesCount = {}
  const designCount = {}
  const typeCount   = {}
  for (const { series, designId, blockType } of blocks) {
    if (series)    seriesCount[series]     = (seriesCount[series]     ?? 0) + 1
    if (designId)  designCount[designId]   = (designCount[designId]   ?? 0) + 1
    if (blockType) typeCount[blockType]    = (typeCount[blockType]    ?? 0) + 1
  }

  // Per-cell bonus and winning-synergy maps
  const bonusMap   = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
  const synergyMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
  const activeList = []

  // Helper: apply radiation from (r,c) using a synergy def
  function applyRadiation(r, c, def) {
    if (!def.radiation) return
    const dirs = def.radiation.type === 'ortho' ? ORTHO
               : def.radiation.type === 'diag'  ? DIAG : ALL8
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc]) {
        bonusMap[nr][nc] += def.radiation.amount
      }
    }
  }

  // Helper: assign synergyMap cell if this def wins
  function tryAssignMap(r, c, synergyId, def) {
    const priority = getDefPriority(def)
    const current  = synergyMap[r][c]
    if (!current || priority > getDefPriority(SYNERGY_DEFS[current])) {
      synergyMap[r][c] = synergyId
    }
  }

  for (const [synergyId, def] of Object.entries(SYNERGY_DEFS)) {
    const required = (def.required ?? 0) + threshold

    // ── Series count ─────────────────────────────────────────────────────────
    if (def.type === 'series_count') {
      const count = seriesCount[def.series] ?? 0
      const active = count >= required
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: count, required: def.required })
      if (!active) continue

      for (const { r, c, series } of blocks) {
        if (series !== def.series) continue
        bonusMap[r][c] += def.own
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
    }

    // ── Exact count ───────────────────────────────────────────────────────────
    else if (def.type === 'exact_count') {
      const count = designCount[def.designId] ?? 0
      const active = count >= required
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: count, required: def.required })
      if (!active) continue

      for (const { r, c, designId } of blocks) {
        if (designId !== def.designId) continue
        bonusMap[r][c] += def.own
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
    }

    // ── Adjacency pair ────────────────────────────────────────────────────────
    else if (def.type === 'adjacency_pair') {
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
          const dist = Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
          if (dist === 1) {
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
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
    }

    // ── Row series ────────────────────────────────────────────────────────────
    else if (def.type === 'row_series') {
      let totalActive = 0
      for (let r = 0; r < GRID_SIZE; r++) {
        const rowCells = blocks.filter(b => b.r === r && b.series === def.series)
        if (rowCells.length >= required) {
          totalActive += rowCells.length
          for (const { c } of rowCells) {
            bonusMap[r][c] += def.own
            tryAssignMap(r, c, synergyId, def)
            applyRadiation(r, c, def)
          }
        }
      }
      const totalInSeries = seriesCount[def.series] ?? 0
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: totalActive > 0, progress: totalInSeries, required: def.required })
    }

    // ── Long-range (≥ minDist Manhattan distance apart) ───────────────────────
    else if (def.type === 'long_range') {
      const qualifyingCells = new Set()
      let anyFound = false

      if (def.series) {
        // Same-series: any two blocks of this series at least minDist apart
        const pool = blocks.filter(b => b.series === def.series)
        for (let i = 0; i < pool.length; i++) {
          for (let j = i + 1; j < pool.length; j++) {
            const a = pool[i], b = pool[j]
            if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) >= def.minDist) {
              qualifyingCells.add(`${a.r},${a.c}`)
              qualifyingCells.add(`${b.r},${b.c}`)
              anyFound = true
            }
          }
        }
      } else {
        // Cross-series/design: A matches seriesA/designA, B matches seriesB/designB
        for (const a of blocks) {
          const aMatch = def.designA ? a.designId === def.designA : a.series === def.seriesA
          if (!aMatch) continue
          for (const b of blocks) {
            if (b.r === a.r && b.c === a.c) continue
            const bMatch = def.designB ? b.designId === def.designB : b.series === def.seriesB
            if (!bMatch) continue
            if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) >= def.minDist) {
              qualifyingCells.add(`${a.r},${a.c}`)
              qualifyingCells.add(`${b.r},${b.c}`)
              anyFound = true
            }
          }
        }
      }

      // Progress: number of qualifying designs on grid (helps player see they're close)
      const qualifyingCount = def.series
        ? (seriesCount[def.series] ?? 0)
        : Math.min(
            blocks.filter(b => def.designA ? b.designId === def.designA : b.series === def.seriesA).length,
            1
          ) + Math.min(
            blocks.filter(b => def.designB ? b.designId === def.designB : b.series === def.seriesB).length,
            1
          )

      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: anyFound, progress: anyFound ? 2 : qualifyingCount, required: 2 })
      if (!anyFound) continue

      for (const key of qualifyingCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.own
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
    }

    // ── Core-radius (anchor + N satellites within radius cells) ──────────────
    else if (def.type === 'core_radius') {
      const coreCells      = new Set()
      const satelliteCells = new Set()
      let anyFound     = false
      let bestProgress = 0

      for (const core of blocks) {
        const coreMatch = def.coreDesignId
          ? core.designId === def.coreDesignId
          : (def.coreSeries ? core.series === def.coreSeries : false)
        if (!coreMatch) continue

        const nearSatellites = blocks.filter(sat => {
          if (sat.r === core.r && sat.c === core.c) return false
          const satMatch = def.satelliteSeries
            ? sat.series === def.satelliteSeries
            : false
          return satMatch && Math.abs(sat.r - core.r) + Math.abs(sat.c - core.c) <= def.radius
        })

        bestProgress = Math.max(bestProgress, nearSatellites.length)

        if (nearSatellites.length >= def.requiredSatellites) {
          anyFound = true
          coreCells.add(`${core.r},${core.c}`)
          for (const sat of nearSatellites) satelliteCells.add(`${sat.r},${sat.c}`)
        }
      }

      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: anyFound, progress: bestProgress, required: def.requiredSatellites })
      if (!anyFound) continue

      for (const key of coreCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.ownCore
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
      for (const key of satelliteCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.ownSatellite
        tryAssignMap(r, c, synergyId, def)
      }
    }

    // ── Block-type count (N blocks of same blockType anywhere) ────────────────
    else if (def.type === 'block_type_count') {
      const count  = typeCount[def.blockType] ?? 0
      const active = count >= required
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: count, required: def.required })
      if (!active) continue

      for (const { r, c, blockType } of blocks) {
        if (blockType !== def.blockType) continue
        bonusMap[r][c] += def.own
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
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
