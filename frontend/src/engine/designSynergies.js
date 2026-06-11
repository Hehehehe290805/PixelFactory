// ── Design Synergy Engine ──────────────────────────────────────────────────────
// All synergies require spatial proximity — none activate from arbitrary grid-wide counts.
// Each synergy has 3 levels; bonuses scale at L1×1.0, L2×1.6, L3×2.2.

import { GRID_SIZE } from '../lib/constants'

const ORTHO = [[-1,0],[1,0],[0,-1],[0,1]]
const DIAG  = [[-1,-1],[-1,1],[1,-1],[1,1]]
const ALL8  = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]

// Level bonus multipliers indexed by level (0=inactive)
const LEVEL_MULTS = [0, 1.0, 1.6, 2.2]

// ── Synergy definitions ───────────────────────────────────────────────────────
// Removed: series_count, row_series, column_series (boring number-counting synergies).
// Kept and expanded: adjacency_pair, long_range, core_radius, block_type_count, cross_family.
// Added: meta_synergy (requires other synergies), mega cross_family (8-10 designs, full grid).

export const SYNERGY_DEFS = {

  // ── Adjacency pair synergies ──────────────────────────────────────────────────
  SUN_AND_MOON: {
    name: 'Sun & Moon', type: 'adjacency_pair',
    designA: 'sun', designB: 'moon',
    own: 1.00, radiation: null,
    desc: 'Sun adjacent to Moon → both get +100% output',
  },
  HUNTER_AND_PREY: {
    name: 'Hunter & Prey', type: 'adjacency_pair',
    designA: 'fox', designB: 'rabbit',
    own: 0.95, radiation: null,
    desc: 'Fox adjacent to Rabbit → both get +95% output',
  },
  FIRE_AND_ICE: {
    name: 'Fire & Ice', type: 'adjacency_pair',
    designA: 'flame_sym', designB: 'ice_crystal',
    own: 1.10, radiation: null,
    desc: 'Flame adjacent to Ice Crystal → both get +110% output',
  },
  CROWN_AND_SWORD: {
    name: 'Crown & Sword', type: 'adjacency_pair',
    designA: 'crown', designB: 'sword',
    own: 1.00, radiation: null,
    desc: 'Crown adjacent to Sword → both get +100% output',
  },
  OWL_AND_MOON: {
    name: 'Night Watch', type: 'adjacency_pair',
    designA: 'owl', designB: 'moon',
    own: 0.95, radiation: { type: 'all8', amount: 0.18 },
    desc: 'Owl adjacent to Moon → both +95%; radiates +18% all around',
  },
  ROSE_AND_HEART: {
    name: 'Rose & Heart', type: 'adjacency_pair',
    designA: 'rose', designB: 'heart',
    own: 1.05, radiation: null,
    desc: 'Rose adjacent to Heart → both get +105% output',
  },
  ANCHOR_AND_WAVE: {
    name: 'Anchor & Wave', type: 'adjacency_pair',
    designA: 'anchor', designB: 'ocean_wave',
    own: 1.00, radiation: { type: 'ortho', amount: 0.18 },
    desc: 'Anchor adjacent to Ocean Wave → both +100%; spreads +18% ortho',
  },
  KEY_AND_LOCK: {
    name: 'Key & Lock', type: 'adjacency_pair',
    designA: 'key', designB: 'lock',
    own: 1.20, radiation: null,
    desc: 'Key adjacent to Lock → both get +120% output',
  },
  ROCKET_AND_STAR: {
    name: 'Rocket & Star', type: 'adjacency_pair',
    designA: 'rocket', designB: 'star',
    own: 0.95, radiation: { type: 'all8', amount: 0.18 },
    desc: 'Rocket adjacent to Star → both +95%; radiates +18% all around',
  },
  BEE_AND_FLOWER: {
    name: 'Bee & Flower', type: 'adjacency_pair',
    designA: 'bee', designB: 'daisy',
    own: 1.00, radiation: { type: 'ortho', amount: 0.16 },
    desc: 'Bee adjacent to Daisy → both +100%; spreads +16% ortho',
  },

  // ── Long-range (same design allowed) ─────────────────────────────────────────
  DISTANT_STARS: {
    name: 'Distant Stars', type: 'long_range', series: 'space', minDist: 7,
    own: 0.90, radiation: { type: 'all8', amount: 0.20 },
    desc: '2 space designs ≥7 cells apart → both +90%; radiates +20%',
  },
  ANTIPODES: {
    name: 'Antipodes', type: 'long_range', series: 'landscapes', minDist: 8,
    own: 0.85, radiation: { type: 'ortho', amount: 0.18 },
    desc: '2 landscape designs ≥8 cells apart → both +85%; spreads +18%',
  },
  POLAR_WINDS: {
    name: 'Polar Winds', type: 'long_range',
    seriesA: 'weather', seriesB: 'landscapes', minDist: 6,
    own: 1.00, radiation: null,
    desc: 'Any weather + any landscape ≥6 cells apart → both +100%',
  },
  TRANSCONTINENTAL: {
    name: 'Transcontinental', type: 'long_range', series: 'buildings', minDist: 7,
    own: 0.80, radiation: { type: 'ortho', amount: 0.18 },
    desc: '2 building designs ≥7 cells apart → both +80%; spreads +18%',
  },
  WILD_MIGRATION: {
    name: 'Wild Migration', type: 'long_range', series: 'animals', minDist: 6,
    own: 0.85, radiation: { type: 'ortho', amount: 0.18 },
    desc: '2 animal designs ≥6 cells apart → both +85%; spreads +18%',
  },
  STAR_SCATTER: {
    name: 'Star Scatter', type: 'long_range', series: 'celestial', minDist: 8,
    own: 1.05, radiation: { type: 'all8', amount: 0.22 },
    desc: '2 celestial designs ≥8 cells apart → both +105%; radiates +22%',
  },
  ABSTRACT_SPREAD: {
    name: 'Abstract Spread', type: 'long_range', series: 'abstract', minDist: 6,
    own: 0.80, radiation: { type: 'all8', amount: 0.20 },
    desc: '2 abstract designs ≥6 cells apart → both +80%; radiates +20%',
  },

  // ── Core-radius (satellites can repeat) ──────────────────────────────────────
  SOLAR_SYSTEM: {
    name: 'Solar System', type: 'core_radius',
    coreDesignId: 'sun', satelliteSeries: 'space',
    requiredSatellites: 3, radius: 2,
    own: 0.90, ownCore: 1.20, ownSatellite: 0.75,
    desc: 'Sun as core + 3 space designs within 2 cells → Sun +120%, satellites +75%',
  },
  ROYAL_COURT: {
    name: 'Royal Court', type: 'core_radius',
    coreDesignId: 'crown', satelliteSeries: 'symbols',
    requiredSatellites: 3, radius: 2,
    own: 0.90, ownCore: 1.10, ownSatellite: 0.70,
    desc: 'Crown as core + 3 symbol designs within 2 cells → Crown +110%, others +70%',
  },
  ECOSYSTEM: {
    name: 'Ecosystem', type: 'core_radius',
    coreSeries: 'trees', satelliteSeries: 'animals',
    requiredSatellites: 3, radius: 2,
    own: 0.80, ownCore: 1.05, ownSatellite: 0.65,
    desc: 'Any tree as core + 3 animal designs within 2 cells → tree +105%, animals +65%',
  },
  MOUNTAIN_KINGDOM: {
    name: 'Mountain Kingdom', type: 'core_radius',
    coreDesignId: 'mountain', satelliteSeries: 'landscapes',
    requiredSatellites: 3, radius: 2,
    own: 0.85, ownCore: 1.10, ownSatellite: 0.70,
    desc: 'Mountain as core + 3 landscape designs within 2 cells → Mountain +110%, others +70%',
  },
  BLOOMING_CORE: {
    name: 'Blooming Core', type: 'core_radius',
    coreSeries: 'flowers', satelliteSeries: 'flowers',
    requiredSatellites: 4, radius: 2,
    own: 0.85, ownCore: 1.20, ownSatellite: 0.70,
    desc: 'Any flower as core + 4 other flowers within 2 cells → core +120%, ring +70%',
  },

  // ── Block-type synergies ──────────────────────────────────────────────────────
  DOUBLE_DOWN: {
    name: 'Double Down', type: 'block_type_count', blockType: 'doubler', required: 3,
    own: 0.50, radiation: { type: 'ortho', amount: 0.16 },
    desc: '3 doubler blocks → +50% each; spreads +16% ortho',
  },
  REACTOR_NETWORK: {
    name: 'Reactor Network', type: 'block_type_count', blockType: 'reactor', required: 2,
    own: 0.60, radiation: { type: 'all8', amount: 0.20 },
    desc: '2 reactor blocks → +60% each; radiates +20% all 8 dirs',
  },
  ECHO_CHAMBER: {
    name: 'Echo Chamber', type: 'block_type_count', blockType: 'echo', required: 3,
    own: 0.45, radiation: { type: 'ortho', amount: 0.15 },
    desc: '3 echo blocks → +45% each; spreads +15% ortho',
  },
  SPECIALIST: {
    name: 'Specialist', type: 'block_type_count', required: 5,
    own: 0.90, radiation: { type: 'all8', amount: 0.20 },
    desc: '5 blocks of same effect type → +90% each; radiates +20%',
  },

  // ── Cross-family — all pieces must be within maxSpan×maxSpan zone ─────────────
  ORCHARD: {
    name: 'Orchard', type: 'cross_family', maxSpan: 5,
    requires: [{ designId: 'apple' }, { series: 'trees', count: 1 }],
    own: 0.80, radiation: { type: 'ortho', amount: 0.18 },
    reward: { type: 'gold', amount: 40 },
    desc: 'Apple + any tree in a 5×5 zone → +80%; spreads +18% ortho. Reward: +40 gold',
  },
  CHRISTMAS_TREE: {
    name: 'Christmas Tree', type: 'cross_family', maxSpan: 4,
    requires: [{ designId: 'star' }, { designId: 'snowflake' }, { series: 'trees', count: 1 }],
    own: 1.00, radiation: { type: 'all8', amount: 0.20 },
    reward: { type: 'random_block' },
    desc: 'Star + Snowflake + any tree in a 4×4 zone → +100%; radiates +20%. Reward: bonus block',
  },
  SUNBLOSSOM: {
    name: 'Sunblossom', type: 'cross_family', maxSpan: 5,
    requires: [{ designId: 'sun' }, { series: 'flowers', count: 3 }],
    own: 0.90, radiation: { type: 'ortho', amount: 0.20 },
    reward: { type: 'pixels', amount: 250 },
    desc: 'Sun + 3 unique flowers in a 5×5 zone → +90%; spreads +20% ortho. Reward: +250px',
  },
  DUNGEON_KEEPER: {
    name: 'Dungeon Keeper', type: 'cross_family', maxSpan: 5,
    requires: [{ designId: 'dragon' }, { series: 'buildings', count: 2 }],
    own: 0.95, radiation: { type: 'diag', amount: 0.20 },
    desc: 'Dragon + 2 buildings in a 5×5 zone → +95%; spreads +20% diagonally',
  },
  HOWLING_MOON: {
    name: 'Howling Moon', type: 'cross_family',
    requires: [{ designId: 'moon' }, { designId: 'wolf' }],
    requireAdjacent: true,
    own: 1.10, radiation: null,
    desc: 'Moon adjacent to Wolf → both get +110% output',
  },
  PHOENIX_RISE: {
    name: 'Phoenix Rise', type: 'cross_family',
    requires: [{ designId: 'phoenix' }, { designId: 'volcano' }],
    requireAdjacent: true,
    own: 1.20, radiation: { type: 'all8', amount: 0.22 },
    reward: { type: 'pixels', amount: 500 },
    desc: 'Phoenix adjacent to Volcano → both +120%; radiates +22%. Reward: +500px',
  },
  ALIEN_CITY: {
    name: 'Alien City', type: 'cross_family', maxSpan: 6,
    requires: [{ series: 'space', count: 2 }, { series: 'buildings', count: 3 }],
    own: 0.85, radiation: { type: 'all8', amount: 0.18 },
    desc: '2 space + 3 buildings in a 6×6 zone → +85%; radiates +18%',
  },
  CELESTIAL_GARDEN: {
    name: 'Celestial Garden', type: 'cross_family', maxSpan: 5,
    requires: [{ series: 'celestial', count: 2 }, { series: 'flowers', count: 2 }],
    own: 0.80, radiation: { type: 'all8', amount: 0.18 },
    reward: { type: 'gold', amount: 25 },
    desc: '2 celestial + 2 flowers in a 5×5 zone → +80%; radiates +18%. Reward: +25 gold',
  },
  WINTER_PEAK: {
    name: 'Winter Peak', type: 'cross_family', maxSpan: 5,
    requires: [{ designId: 'mountain' }, { series: 'weather', count: 2 }],
    own: 0.90, radiation: { type: 'ortho', amount: 0.18 },
    desc: 'Mountain + 2 weather designs in a 5×5 zone → +90%; spreads +18% ortho',
  },
  TIDE_POOL: {
    name: 'Tide Pool', type: 'cross_family', maxSpan: 6,
    requires: [{ series: 'animals', count: 2 }, { series: 'landscapes', count: 2 }],
    own: 0.75, radiation: { type: 'ortho', amount: 0.18 },
    desc: '2 animals + 2 landscapes in a 6×6 zone → +75%; spreads +18% ortho',
  },
  STORM_CASTLE: {
    name: 'Storm Castle', type: 'cross_family', maxSpan: 5,
    requires: [{ series: 'weather', count: 2 }, { series: 'buildings', count: 2 }],
    own: 0.80, radiation: { type: 'diag', amount: 0.18 },
    desc: '2 weather + 2 buildings in a 5×5 zone → +80%; spreads +18% diagonally',
  },

  // ── Mega synergies — full-grid, cross-family, 8-10 designs required ──────────
  // maxSpan: 12 = entire grid (no zone constraint)
  GRAND_TAPESTRY: {
    name: 'Grand Tapestry', type: 'cross_family', maxSpan: 12,
    requires: [
      { series: 'flowers', count: 3 },
      { series: 'trees', count: 2 },
      { series: 'animals', count: 2 },
      { series: 'buildings', count: 2 },
      { series: 'landscapes', count: 1 },
    ],
    own: 1.40, radiation: { type: 'all8', amount: 0.40 },
    reward: { type: 'pixels', amount: 2000 },
    desc: '3 flowers + 2 trees + 2 animals + 2 buildings + 1 landscape anywhere → +140%; radiates +40%. Reward: +2000px',
  },
  COSMIC_BLOOM: {
    name: 'Cosmic Bloom', type: 'cross_family', maxSpan: 12,
    requires: [
      { series: 'flowers', count: 4 },
      { series: 'celestial', count: 3 },
      { series: 'space', count: 2 },
      { designId: 'sun' },
    ],
    own: 1.60, radiation: { type: 'ortho', amount: 0.50 },
    reward: { type: 'random_block' },
    desc: '4 flowers + 3 celestial + 2 space + Sun anywhere → +160%; spreads +50% ortho. Reward: bonus block',
  },
  PRIMAL_MACHINE: {
    name: 'Primal Machine', type: 'cross_family', maxSpan: 12,
    requires: [
      { series: 'abstract', count: 3 },
      { series: 'symbols', count: 3 },
      { series: 'buildings', count: 2 },
      { series: 'space', count: 2 },
    ],
    own: 1.50, radiation: { type: 'all8', amount: 0.45 },
    reward: { type: 'gold', amount: 300 },
    desc: '3 abstract + 3 symbols + 2 buildings + 2 space anywhere → +150%; radiates +45%. Reward: +300 gold',
  },
  WORLD_SPIRIT: {
    name: 'World Spirit', type: 'cross_family', maxSpan: 12,
    requires: [
      { series: 'animals', count: 3 },
      { series: 'landscapes', count: 3 },
      { series: 'weather', count: 3 },
      { designId: 'mountain' },
    ],
    own: 1.45, radiation: { type: 'ortho', amount: 0.45 },
    reward: { type: 'pixels', amount: 2500 },
    desc: '3 animals + 3 landscapes + 3 weather + Mountain anywhere → +145%; spreads +45%. Reward: +2500px',
  },

  // ── Meta-synergies — MUST be defined last, reference only existing synergy IDs ─
  PRIMORDIAL_GROVE: {
    name: 'Primordial Grove', type: 'meta_synergy',
    requires: ['BLOOMING_CORE', 'ECOSYSTEM'],
    own: 0.75, reward: { type: 'random_block' },
    desc: 'BLOOMING_CORE + ECOSYSTEM both active → +75% to all synergy-active cells. Reward: bonus block',
  },
  DEEP_SPACE: {
    name: 'Deep Space', type: 'meta_synergy',
    requires: ['SOLAR_SYSTEM', 'DISTANT_STARS'],
    own: 0.80,
    desc: 'SOLAR_SYSTEM + DISTANT_STARS both active → +80% to all synergy-active cells',
  },
  STORM_KINGDOM: {
    name: 'Storm Kingdom', type: 'meta_synergy',
    requires: ['WINTER_PEAK', 'POLAR_WINDS'],
    own: 0.70,
    desc: 'WINTER_PEAK + POLAR_WINDS both active → +70% to all synergy-active cells',
  },
  BEAST_EMPIRE: {
    name: 'Beast Empire', type: 'meta_synergy',
    requires: ['ECOSYSTEM', 'WILD_MIGRATION'],
    own: 0.75, reward: { type: 'gold', amount: 80 },
    desc: 'ECOSYSTEM + WILD_MIGRATION both active → +75% to all synergy-active cells. Reward: +80 gold',
  },
  BATTLE_COURT: {
    name: 'Battle Court', type: 'meta_synergy',
    requires: ['ROYAL_COURT', 'CROWN_AND_SWORD'],
    own: 0.80, reward: { type: 'pixels', amount: 800 },
    desc: 'ROYAL_COURT + CROWN_AND_SWORD both active → +80% to all synergy-active cells. Reward: +800px',
  },
  BLOOD_MOON: {
    name: 'Blood Moon', type: 'meta_synergy',
    requires: ['OWL_AND_MOON', 'HOWLING_MOON'],
    own: 0.90,
    desc: 'NIGHT_WATCH + HOWLING_MOON both active → +90% to all synergy-active cells',
    affectsAll: false,
  },
  COSMIC_NEXUS: {
    name: 'Cosmic Nexus', type: 'meta_synergy',
    requires: ['DEEP_SPACE', 'PRIMORDIAL_GROVE', 'BEAST_EMPIRE'],
    own: 0.60, reward: { type: 'pixels', amount: 1500 },
    desc: 'DEEP_SPACE + PRIMORDIAL_GROVE + BEAST_EMPIRE all active → +60% to ALL occupied cells. Reward: +1500px',
    affectsAll: true,
  },
}

// ── TYPE_LABELS ───────────────────────────────────────────────────────────────
export const TYPE_LABELS = {
  exact_count:     'Exact Match',
  adjacency_pair:  'Adjacency',
  long_range:      'Long Range',
  core_radius:     'Core / Ring',
  block_type_count:'Block Type',
  cross_family:    'Cross-Family',
  meta_synergy:    'Meta',
}

// ── Level threshold helpers ───────────────────────────────────────────────────
// levelProgress is the metric used to determine which level is achieved.

function getL2(def) {
  switch (def.type) {
    case 'adjacency_pair':   return 2
    case 'long_range':       return 4
    case 'core_radius':      return (def.requiredSatellites ?? 1) + 1
    case 'block_type_count': return (def.required ?? 1) + 2
    case 'cross_family': {
      const total = (def.requires ?? []).reduce((s, r) => s + (r.count ?? 1), 0)
      return total <= 4 ? 3 : total <= 7 ? 2 : Infinity  // mega synergies don't level up
    }
    default: return Infinity
  }
}

function getL3(def) {
  switch (def.type) {
    case 'adjacency_pair':   return 3
    case 'long_range':       return 6
    case 'core_radius':      return (def.requiredSatellites ?? 1) + 2
    case 'block_type_count': return (def.required ?? 1) + 4
    case 'cross_family': {
      const total = (def.requires ?? []).reduce((s, r) => s + (r.count ?? 1), 0)
      return total <= 4 ? 5 : Infinity  // mega synergies: only Lv.1
    }
    default: return Infinity
  }
}

function computeLevel(levelProgress, l2, l3) {
  if (levelProgress >= l3) return 3
  if (levelProgress >= l2) return 2
  return 1
}

// ── Design synergy lookup (for tooltips) ──────────────────────────────────────
export function getDesignSynergies(design) {
  const names = []
  for (const def of Object.values(SYNERGY_DEFS)) {
    if (def.type === 'exact_count') {
      if (def.designId === design.id) names.push(def.name)
    } else if (def.type === 'adjacency_pair') {
      if (def.designA === design.id || def.designB === design.id) names.push(def.name)
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
    } else if (def.type === 'cross_family') {
      const matches = def.requires.some(req =>
        (req.designId && req.designId === design.id) ||
        (req.series   && req.series   === design.series)
      )
      if (matches) names.push(def.name)
    }
  }
  return names
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDefPriority(def) {
  return def.ownCore ?? def.own ?? 0
}

// ── Detection ─────────────────────────────────────────────────────────────────

/**
 * Returns:
 *   synergyMap[r][c]  — id of highest-value active synergy for that cell (or null)
 *   bonusMap[r][c]    — total additive output bonus for that cell
 *   activeList        — synergy states for ActiveEffectsPanel, each with { level, l2, l3 }
 */
export function buildSynergyData(grid, neuralGridStyle = false) {
  const threshold = neuralGridStyle ? -1 : 0

  const blocks = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const b = grid[r][c]
      if (b) blocks.push({ r, c, b, series: b.series ?? null, designId: b.designId ?? null, blockType: b.type ?? null })
    }
  }

  const seriesCount     = {}
  const designCount     = {}
  const typeCount       = {}
  const uniqueSeriesIds = {}
  for (const { series, designId, blockType } of blocks) {
    if (series)    seriesCount[series]   = (seriesCount[series]   ?? 0) + 1
    if (designId)  designCount[designId] = (designCount[designId] ?? 0) + 1
    if (blockType) typeCount[blockType]  = (typeCount[blockType]  ?? 0) + 1
    if (series && designId) {
      if (!uniqueSeriesIds[series]) uniqueSeriesIds[series] = new Set()
      uniqueSeriesIds[series].add(designId)
    }
  }
  function uCount(series) { return uniqueSeriesIds[series]?.size ?? 0 }

  const bonusMap   = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
  const synergyMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
  const activeList = []

  function applyRadiation(r, c, def, mult, excludeKeys = null) {
    if (!def.radiation) return
    const dirs = def.radiation.type === 'ortho' ? ORTHO
               : def.radiation.type === 'diag'  ? DIAG : ALL8
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || !grid[nr][nc]) continue
      if (excludeKeys && excludeKeys.has(`${nr},${nc}`)) continue
      bonusMap[nr][nc] += def.radiation.amount * mult
    }
  }

  function tryAssignMap(r, c, synergyId, def) {
    const priority = getDefPriority(def)
    const current  = synergyMap[r][c]
    if (!current || priority > getDefPriority(SYNERGY_DEFS[current])) {
      synergyMap[r][c] = synergyId
    }
  }

  function pushEntry(synergyId, def, active, progress, levelProgress, required) {
    const l2 = getL2(def)
    const l3 = getL3(def)
    const level = active ? computeLevel(levelProgress, l2, l3) : 0
    activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress, required, level, l2, l3, reward: def.reward ?? null })
    return level
  }

  for (const [synergyId, def] of Object.entries(SYNERGY_DEFS)) {
    const required = (def.required ?? 0) + threshold

    // ── Exact count ───────────────────────────────────────────────────────────
    if (def.type === 'exact_count') {
      const count  = designCount[def.designId] ?? 0
      const active = count >= required
      const level  = pushEntry(synergyId, def, active, count, count, def.required)
      if (!active) continue
      const mult = LEVEL_MULTS[level]

      for (const { r, c, designId } of blocks) {
        if (designId !== def.designId) continue
        bonusMap[r][c] += def.own * mult
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def, mult)
      }
    }

    // ── Adjacency pair — levelProgress = number of valid adjacent pairs ────────
    else if (def.type === 'adjacency_pair') {
      const qualifyingCells = new Set()
      let pairCount = 0

      for (const a of blocks) {
        if (a.designId !== def.designA) continue
        for (const b of blocks) {
          if (b.designId !== def.designB) continue
          if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1) {
            qualifyingCells.add(`${a.r},${a.c}`)
            qualifyingCells.add(`${b.r},${b.c}`)
            pairCount++
          }
        }
      }

      const anyFound = pairCount > 0
      const aCount   = Math.min(designCount[def.designA] ?? 0, 1)
      const bCount   = Math.min(designCount[def.designB] ?? 0, 1)
      const progress = anyFound ? pairCount + 1 : aCount + bCount  // offset so 1 pair shows as 2/2

      const level = pushEntry(synergyId, def, anyFound, anyFound ? 2 : progress, pairCount, 1)
      if (!anyFound) continue
      const mult = LEVEL_MULTS[level]

      for (const key of qualifyingCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.own * mult
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def, mult)
      }
    }

    // ── Long-range — same design allowed; levelProgress = qualifying blocks count
    else if (def.type === 'long_range') {
      const qualifyingCells = new Set()
      let anyFound = false

      if (def.series) {
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

      const qualCount    = def.series
        ? (seriesCount[def.series] ?? 0)
        : Math.min(blocks.filter(b => def.designA ? b.designId === def.designA : b.series === def.seriesA).length, 1)
          + Math.min(blocks.filter(b => def.designB ? b.designId === def.designB : b.series === def.seriesB).length, 1)
      const levelProgress = anyFound ? qualifyingCells.size : 0
      const progress      = anyFound ? 2 : Math.min(qualCount, 1)

      const level = pushEntry(synergyId, def, anyFound, progress, levelProgress, 2)
      if (!anyFound) continue
      const mult = LEVEL_MULTS[level]

      for (const key of qualifyingCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.own * mult
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def, mult)
      }
    }

    // ── Core-radius — satellites can repeat; levelProgress = satCount ──────────
    else if (def.type === 'core_radius') {
      const coreCells      = new Set()
      const satelliteCells = new Set()
      let anyFound     = false
      let bestSatCount = 0

      const satRequired = def.requiredSatellites + threshold

      for (const core of blocks) {
        const coreMatch = def.coreDesignId
          ? core.designId === def.coreDesignId
          : (def.coreSeries ? core.series === def.coreSeries : false)
        if (!coreMatch) continue

        const nearSatellites = blocks.filter(sat => {
          if (sat.r === core.r && sat.c === core.c) return false
          const satMatch = def.satelliteSeries ? sat.series === def.satelliteSeries : false
          return satMatch && Math.abs(sat.r - core.r) + Math.abs(sat.c - core.c) <= def.radius
        })

        const satCount = nearSatellites.length
        if (satCount > bestSatCount) bestSatCount = satCount
        if (satCount >= satRequired) {
          anyFound = true
          coreCells.add(`${core.r},${core.c}`)
          for (const sat of nearSatellites) satelliteCells.add(`${sat.r},${sat.c}`)
        }
      }

      const level = pushEntry(synergyId, def, anyFound, bestSatCount, bestSatCount, def.requiredSatellites)
      if (!anyFound) continue
      const mult = LEVEL_MULTS[level]

      for (const key of coreCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.ownCore * mult
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def, mult)
      }
      for (const key of satelliteCells) {
        if (coreCells.has(key)) continue
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.ownSatellite * mult
        tryAssignMap(r, c, synergyId, def)
      }
    }

    // ── Block-type count ──────────────────────────────────────────────────────
    else if (def.type === 'block_type_count') {
      if (def.blockType) {
        const count  = typeCount[def.blockType] ?? 0
        const active = count >= required
        const level  = pushEntry(synergyId, def, active, count, count, def.required)
        if (!active) continue
        const mult = LEVEL_MULTS[level]
        for (const { r, c, blockType } of blocks) {
          if (blockType !== def.blockType) continue
          bonusMap[r][c] += def.own * mult
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def, mult)
        }
      } else {
        // SPECIALIST
        let bestCount = 0
        const qualifyingTypes = []
        for (const [bt, cnt] of Object.entries(typeCount)) {
          if (cnt > bestCount) bestCount = cnt
          if (cnt >= required) qualifyingTypes.push(bt)
        }
        const active = qualifyingTypes.length > 0
        const level  = pushEntry(synergyId, def, active, bestCount, bestCount, def.required)
        if (!active) continue
        const mult = LEVEL_MULTS[level]
        for (const { r, c, blockType } of blocks) {
          if (!qualifyingTypes.includes(blockType)) continue
          bonusMap[r][c] += def.own * mult
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def, mult)
        }
      }
    }

    // ── Cross-family — zone-based when maxSpan present ────────────────────────
    else if (def.type === 'cross_family') {
      if (def.requireAdjacent) {
        // Adjacency-constrained cross_family — existing logic
        const designIdReqs = def.requires.filter(r => r.designId).map(r => r.designId)
        let allMet = def.requires.every(req => req.designId ? (designCount[req.designId] ?? 0) >= 1 : uCount(req.series) >= (req.count ?? 1))
        let adjacentFound = false
        const qualifyingCells = new Set()

        if (allMet && designIdReqs.length === 2) {
          const [dA, dB] = designIdReqs
          outer: for (const a of blocks) {
            if (a.designId !== dA) continue
            for (const [dr, dc] of ORTHO) {
              const nr = a.r + dr, nc = a.c + dc
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                if (grid[nr][nc]?.designId === dB) {
                  adjacentFound = true
                  qualifyingCells.add(`${a.r},${a.c}`)
                  qualifyingCells.add(`${nr},${nc}`)
                }
              }
            }
          }
          allMet = adjacentFound
        } else {
          allMet = false
        }

        const aCount    = Math.min(designCount[designIdReqs[0]] ?? 0, 1)
        const bCount    = Math.min(designCount[designIdReqs[1]] ?? 0, 1)
        const pairCount = qualifyingCells.size / 2
        const progress  = allMet ? 2 : aCount + bCount

        const level = pushEntry(synergyId, def, allMet, progress, pairCount, 2)
        if (!allMet) continue
        const mult = LEVEL_MULTS[level]

        for (const key of qualifyingCells) {
          const [r, c] = key.split(',').map(Number)
          bonusMap[r][c] += def.own * mult
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def, mult)
        }
      } else if (def.maxSpan) {
        // Zone-constrained cross_family
        // levelCount in a zone = min over all requirements of floor(zoneCount / baseCount)
        const l2 = getL2(def)
        const l3 = getL3(def)
        let bestLevelCount = 0
        let bestZoneKeys   = null

        const span = def.maxSpan
        for (let r0 = 0; r0 + span <= GRID_SIZE; r0++) {
          for (let c0 = 0; c0 + span <= GRID_SIZE; c0++) {
            const zoneBlocks = blocks.filter(b =>
              b.r >= r0 && b.r < r0 + span &&
              b.c >= c0 && b.c < c0 + span
            )

            // Compute min scaled count for each requirement
            let minScaled = Infinity
            for (const req of def.requires) {
              let zoneCount = 0
              if (req.designId) {
                zoneCount = zoneBlocks.filter(b => b.designId === req.designId).length
              } else if (req.series) {
                zoneCount = zoneBlocks.filter(b => b.series === req.series).length
              }
              const baseCount = req.count ?? 1
              minScaled = Math.min(minScaled, Math.floor(zoneCount / baseCount))
            }
            if (minScaled === Infinity) minScaled = 0

            if (minScaled > bestLevelCount) {
              bestLevelCount = minScaled
              // Collect qualifying cells for this zone
              const keys = new Set()
              for (const req of def.requires) {
                const matching = req.designId
                  ? zoneBlocks.filter(b => b.designId === req.designId)
                  : zoneBlocks.filter(b => b.series === req.series)
                for (const { r, c } of matching) keys.add(`${r},${c}`)
              }
              bestZoneKeys = keys
            }
          }
        }

        const active = bestLevelCount >= 1
        // Display progress: count of requirement pieces satisfied (0..totalPieces)
        const requireResults = def.requires.map(req =>
          req.designId ? (designCount[req.designId] ?? 0) >= 1 : uCount(req.series) >= (req.count ?? 1)
        )
        const displayProgress = active ? def.requires.length : requireResults.filter(Boolean).length

        const level = pushEntry(synergyId, def, active, displayProgress, bestLevelCount, def.requires.length)
        if (!active) continue
        const mult = LEVEL_MULTS[level]

        for (const key of (bestZoneKeys ?? new Set())) {
          const [r, c] = key.split(',').map(Number)
          bonusMap[r][c] += def.own * mult
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def, mult)
        }
      } else {
        // No zone constraint, no adjacency — fall back to grid-wide (legacy)
        const requireResults = def.requires.map(req =>
          req.designId ? (designCount[req.designId] ?? 0) >= 1 : uCount(req.series) >= (req.count ?? 1)
        )
        const progress    = requireResults.filter(Boolean).length
        const totalPieces = def.requires.length
        const allMet      = requireResults.every(Boolean)

        const level = pushEntry(synergyId, def, allMet, progress, allMet ? 1 : 0, totalPieces)
        if (!allMet) continue
        const mult = LEVEL_MULTS[level]

        for (const { r, c, designId, series } of blocks) {
          const qualifies = def.requires.some(req =>
            (req.designId && req.designId === designId) ||
            (req.series   && req.series   === series)
          )
          if (!qualifies) continue
          bonusMap[r][c] += def.own * mult
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def, mult)
        }
      }
    }

    // ── Meta-synergy ──────────────────────────────────────────────────────────
    else if (def.type === 'meta_synergy') {
      const requiredIds = def.requires
      const progress    = requiredIds.filter(id => activeList.find(a => a.id === id)?.active).length
      const allActive   = progress === requiredIds.length

      pushEntry(synergyId, def, allActive, progress, allActive ? 1 : 0, requiredIds.length)
      if (!allActive) continue

      if (def.affectsAll) {
        for (const { r, c } of blocks) {
          bonusMap[r][c] += def.own
          tryAssignMap(r, c, synergyId, def)
        }
      } else {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (synergyMap[r][c] !== null) bonusMap[r][c] += def.own
          }
        }
      }
    }
  }

  return { synergyMap, bonusMap, activeList }
}

export function getSynergyMultiplier(r, c, bonusMap) {
  return 1 + (bonusMap[r]?.[c] ?? 0)
}

export function getAdjacencySynergyBonus(r, c, grid) {
  const block = grid[r][c]
  if (!block?.series) return 1
  for (const [dr, dc] of ORTHO) {
    const n = grid[r + dr]?.[c + dc]
    if (n?.series === block.series) return 1.15
  }
  return 1
}

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
