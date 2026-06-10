// ── Design Synergy Engine ──────────────────────────────────────────────────────
// All synergies are spatially constrained (zone, row/col, adjacency, radius, distance).
// No synergy activates from arbitrary grid-wide counts alone.

import { GRID_SIZE } from '../lib/constants'

const ORTHO = [[-1,0],[1,0],[0,-1],[0,1]]
const DIAG  = [[-1,-1],[-1,1],[1,-1],[1,1]]
const ALL8  = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]

// ── Synergy definitions ───────────────────────────────────────────────────────
// type: 'series_count'    — N unique designs of same series within a maxSpan×maxSpan zone
//       'exact_count'     — N copies of same design id anywhere on grid
//       'adjacency_pair'  — two specific design ids placed orthogonally adjacent
//       'row_series'      — N designs of same series in the same row (duplicates count)
//       'column_series'   — N designs of same series in the same column (duplicates count)
//       'long_range'      — two designs at least minDist (Manhattan) cells apart (same design allowed)
//       'core_radius'     — coreDesignId/coreSeries as anchor + N satellites within radius cells
//       'block_type_count'— N blocks sharing the same blockType anywhere on grid
//       'cross_family'    — specific designs AND/OR series from DIFFERENT families all on grid
//       'meta_synergy'    — requires other synergy IDs to all be currently active (MUST be last)

export const SYNERGY_DEFS = {
  // ── Series count synergies — zone-constrained, unique designs required ─────────
  GARDEN: {
    name: 'Garden', type: 'series_count', series: 'flowers', required: 7, maxSpan: 7,
    own: 0.70, radiation: { type: 'ortho', amount: 0.20 },
    desc: '7 unique flower designs in a 7×7 zone → +70%; spreads +20% ortho',
  },
  FOREST: {
    name: 'Forest', type: 'series_count', series: 'trees', required: 7, maxSpan: 7,
    own: 0.65, radiation: { type: 'ortho', amount: 0.22 },
    desc: '7 unique tree designs in a 7×7 zone → +65%; spreads +22% ortho',
  },
  URBAN: {
    name: 'Urban Planning', type: 'series_count', series: 'buildings', required: 7, maxSpan: 7,
    own: 0.65, radiation: { type: 'diag', amount: 0.20 },
    desc: '7 unique building designs in a 7×7 zone → +65%; spreads +20% diagonally',
  },
  COSMOS: {
    name: 'Cosmos', type: 'series_count', series: 'celestial', required: 7, maxSpan: 7,
    own: 0.75, radiation: { type: 'all8', amount: 0.20 },
    desc: '7 unique celestial designs in a 7×7 zone → +75%; radiates +20% all 8 dirs',
  },
  MENAGERIE: {
    name: 'Menagerie', type: 'series_count', series: 'animals', required: 7, maxSpan: 7,
    own: 0.70, radiation: { type: 'ortho', amount: 0.20 },
    desc: '7 unique animal designs in a 7×7 zone → +70%; spreads +20% ortho',
  },
  GEOMETRY: {
    name: 'Geometry', type: 'series_count', series: 'shapes', required: 6, maxSpan: 6,
    own: 0.65, radiation: { type: 'diag', amount: 0.22 },
    desc: '6 unique shape designs in a 6×6 zone → +65%; spreads +22% diagonally',
  },
  FEAST: {
    name: 'Feast', type: 'series_count', series: 'food', required: 6, maxSpan: 6,
    own: 0.65, radiation: { type: 'ortho', amount: 0.18 },
    desc: '6 unique food designs in a 6×6 zone → +65%; spreads +18% ortho',
  },
  EMBLEMS: {
    name: 'Emblems', type: 'series_count', series: 'symbols', required: 6, maxSpan: 6,
    own: 0.68, radiation: { type: 'all8', amount: 0.18 },
    desc: '6 unique symbol designs in a 6×6 zone → +68%; radiates +18% all 8 dirs',
  },
  STORM_FRONT: {
    name: 'Storm Front', type: 'series_count', series: 'weather', required: 6, maxSpan: 6,
    own: 0.68, radiation: { type: 'ortho', amount: 0.20 },
    desc: '6 unique weather designs in a 6×6 zone → +68%; spreads +20% ortho',
  },
  EXPEDITION: {
    name: 'Expedition', type: 'series_count', series: 'landscapes', required: 6, maxSpan: 6,
    own: 0.65, radiation: { type: 'ortho', amount: 0.20 },
    desc: '6 unique landscape designs in a 6×6 zone → +65%; spreads +20% ortho',
  },
  STARFLEET: {
    name: 'Starfleet', type: 'series_count', series: 'space', required: 6, maxSpan: 6,
    own: 0.80, radiation: { type: 'all8', amount: 0.22 },
    desc: '6 unique space designs in a 6×6 zone → +80%; radiates +22% all 8 dirs',
  },
  ALGORITHM: {
    name: 'Algorithm', type: 'series_count', series: 'abstract', required: 5, maxSpan: 5,
    own: 0.90, radiation: { type: 'all8', amount: 0.22 },
    desc: '5 unique abstract designs in a 5×5 zone → +90%; radiates +22% all 8 dirs',
  },

  // ── Adjacency pair synergies — specific design IDs only ──────────────────────
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

  // ── Row synergies (N same-series in one row, duplicates count) ──────────────
  FLOWER_ROW: {
    name: 'Flower Row', type: 'row_series', series: 'flowers', required: 5,
    own: 0.80, radiation: null,
    desc: '5 flower designs in same row → +80% each in that row',
  },
  BUILDING_ROW: {
    name: 'City Block', type: 'row_series', series: 'buildings', required: 5,
    own: 0.90, radiation: null,
    desc: '5 building designs in same row → +90% each in that row',
  },
  ANIMAL_ROW: {
    name: 'Animal Kingdom', type: 'row_series', series: 'animals', required: 5,
    own: 0.75, radiation: { type: 'ortho', amount: 0.20 },
    desc: '5 animal designs in same row → +75% each; spreads +20% to cells above/below',
  },
  SPACE_ROW: {
    name: 'Orbital Array', type: 'row_series', series: 'space', required: 5,
    own: 1.00, radiation: { type: 'all8', amount: 0.20 },
    desc: '5 space designs in same row → +100% each; radiates +20% to adjacent cells',
  },
  SHAPE_ROW: {
    name: 'Pattern Matrix', type: 'row_series', series: 'shapes', required: 4,
    own: 0.70, radiation: null,
    desc: '4 shape designs in same row → +70% each in that row',
  },
  WEATHER_ROW: {
    name: 'Storm Line', type: 'row_series', series: 'weather', required: 4,
    own: 0.75, radiation: { type: 'ortho', amount: 0.18 },
    desc: '4 weather designs in same row → +75% each; spreads +18% to cells above/below',
  },
  TREE_ROW: {
    name: 'Tree Line', type: 'row_series', series: 'trees', required: 4,
    own: 0.70, radiation: { type: 'ortho', amount: 0.18 },
    desc: '4 tree designs in same row → +70% each; spreads +18% to cells above/below',
  },

  // ── Column synergies (N same-series in one column, duplicates count) ──────────
  FLOWER_COLUMN: {
    name: 'Flower Column', type: 'column_series', series: 'flowers', required: 5,
    own: 0.80, radiation: null,
    desc: '5 flower designs in same column → +80% each in that column',
  },
  BUILDING_COLUMN: {
    name: 'Skyscraper Row', type: 'column_series', series: 'buildings', required: 5,
    own: 0.90, radiation: null,
    desc: '5 building designs in same column → +90% each in that column',
  },
  SPACE_COLUMN: {
    name: 'Launch Pad', type: 'column_series', series: 'space', required: 5,
    own: 1.00, radiation: { type: 'all8', amount: 0.20 },
    desc: '5 space designs in same column → +100% each; radiates +20% to adjacent cells',
  },
  ANIMAL_COLUMN: {
    name: 'Migration Path', type: 'column_series', series: 'animals', required: 4,
    own: 0.75, radiation: { type: 'ortho', amount: 0.18 },
    desc: '4 animal designs in same column → +75% each; spreads +18% to cells left/right',
  },
  TREE_COLUMN: {
    name: 'Deep Forest', type: 'column_series', series: 'trees', required: 4,
    own: 0.70, radiation: { type: 'ortho', amount: 0.18 },
    desc: '4 tree designs in same column → +70% each; spreads +18% to cells left/right',
  },

  // ── Long-range synergies (blocks ≥ minDist Manhattan distance apart) ──────────
  DISTANT_STARS: {
    name: 'Distant Stars', type: 'long_range', series: 'space', minDist: 7,
    own: 0.90, radiation: { type: 'all8', amount: 0.20 },
    desc: '2 space designs ≥7 cells apart → both +90%; radiates +20% nearby',
  },
  ANTIPODES: {
    name: 'Antipodes', type: 'long_range', series: 'landscapes', minDist: 8,
    own: 0.85, radiation: { type: 'ortho', amount: 0.18 },
    desc: '2 landscape designs ≥8 cells apart → both +85%; spreads +18% ortho',
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
    desc: '2 building designs ≥7 cells apart → both +80%; spreads +18% ortho',
  },
  WILD_MIGRATION: {
    name: 'Wild Migration', type: 'long_range', series: 'animals', minDist: 6,
    own: 0.85, radiation: { type: 'ortho', amount: 0.18 },
    desc: '2 animal designs ≥6 cells apart → both +85%; spreads +18% ortho',
  },
  STAR_SCATTER: {
    name: 'Star Scatter', type: 'long_range', series: 'celestial', minDist: 8,
    own: 1.05, radiation: { type: 'all8', amount: 0.22 },
    desc: '2 celestial designs ≥8 cells apart → both +105%; radiates +22% all around',
  },
  ABSTRACT_SPREAD: {
    name: 'Abstract Spread', type: 'long_range', series: 'abstract', minDist: 6,
    own: 0.80, radiation: { type: 'all8', amount: 0.20 },
    desc: '2 abstract designs ≥6 cells apart → both +80%; radiates +20% nearby',
  },

  // ── Core-radius synergies (anchor block + N satellites within radius) ──────────
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

  // ── Block-type synergies (N blocks sharing the same blockType) ────────────────
  DOUBLE_DOWN: {
    name: 'Double Down', type: 'block_type_count', blockType: 'doubler', required: 3,
    own: 0.50, radiation: { type: 'ortho', amount: 0.16 },
    desc: '3 doubler blocks → +50% each; spreads +16% to ortho neighbors',
  },
  REACTOR_NETWORK: {
    name: 'Reactor Network', type: 'block_type_count', blockType: 'reactor', required: 2,
    own: 0.60, radiation: { type: 'all8', amount: 0.20 },
    desc: '2 reactor blocks → +60% each; radiates +20% in all 8 directions',
  },
  ECHO_CHAMBER: {
    name: 'Echo Chamber', type: 'block_type_count', blockType: 'echo', required: 3,
    own: 0.45, radiation: { type: 'ortho', amount: 0.15 },
    desc: '3 echo blocks → +45% each; spreads +15% to ortho neighbors',
  },
  SPECIALIST: {
    name: 'Specialist', type: 'block_type_count', required: 5,
    own: 0.90, radiation: { type: 'all8', amount: 0.20 },
    desc: '5 blocks of the same effect type → +90% each; radiates +20% in all directions',
  },

  // ── Cross-family synergies ─────────────────────────────────────────────────────
  ORCHARD: {
    name: 'Orchard', type: 'cross_family',
    requires: [{ designId: 'apple' }, { series: 'trees', count: 1 }],
    own: 0.80, radiation: { type: 'ortho', amount: 0.18 },
    reward: { type: 'gold', amount: 40 },
    desc: 'Apple + any tree design on grid → +80%; spreads +18% ortho. Reward: +40 gold',
  },
  CHRISTMAS_TREE: {
    name: 'Christmas Tree', type: 'cross_family',
    requires: [{ designId: 'star' }, { designId: 'snowflake' }, { series: 'trees', count: 1 }],
    own: 1.00, radiation: { type: 'all8', amount: 0.20 },
    reward: { type: 'random_block' },
    desc: 'Star + Snowflake + any tree → +100%; radiates +20%. Reward: bonus block',
  },
  SUNBLOSSOM: {
    name: 'Sunblossom', type: 'cross_family',
    requires: [{ designId: 'sun' }, { series: 'flowers', count: 3 }],
    own: 0.90, radiation: { type: 'ortho', amount: 0.20 },
    reward: { type: 'pixels', amount: 250 },
    desc: 'Sun + 3 unique flower designs on grid → +90%; spreads +20% ortho. Reward: +250px',
  },
  DUNGEON_KEEPER: {
    name: 'Dungeon Keeper', type: 'cross_family',
    requires: [{ designId: 'dragon' }, { series: 'buildings', count: 2 }],
    own: 0.95, radiation: { type: 'diag', amount: 0.20 },
    desc: 'Dragon + 2 building designs on grid → +95%; spreads +20% diagonally',
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
    name: 'Alien City', type: 'cross_family',
    requires: [{ series: 'space', count: 2 }, { series: 'buildings', count: 3 }],
    own: 0.85, radiation: { type: 'all8', amount: 0.18 },
    desc: '2 space + 3 building designs on grid → +85%; radiates +18% all around',
  },
  CELESTIAL_GARDEN: {
    name: 'Celestial Garden', type: 'cross_family',
    requires: [{ series: 'celestial', count: 2 }, { series: 'flowers', count: 2 }],
    own: 0.80, radiation: { type: 'all8', amount: 0.18 },
    reward: { type: 'gold', amount: 25 },
    desc: '2 celestial + 2 flower designs on grid → +80%; radiates +18%. Reward: +25 gold',
  },
  WINTER_PEAK: {
    name: 'Winter Peak', type: 'cross_family',
    requires: [{ designId: 'mountain' }, { series: 'weather', count: 2 }],
    own: 0.90, radiation: { type: 'ortho', amount: 0.18 },
    desc: 'Mountain + 2 weather designs on grid → +90%; spreads +18% ortho',
  },
  TIDE_POOL: {
    name: 'Tide Pool', type: 'cross_family',
    requires: [{ series: 'animals', count: 2 }, { series: 'landscapes', count: 2 }],
    own: 0.75, radiation: { type: 'ortho', amount: 0.18 },
    desc: '2 animal + 2 landscape designs on grid → +75%; spreads +18% ortho',
  },
  STORM_CASTLE: {
    name: 'Storm Castle', type: 'cross_family',
    requires: [{ series: 'weather', count: 2 }, { series: 'buildings', count: 2 }],
    own: 0.80, radiation: { type: 'diag', amount: 0.18 },
    desc: '2 weather + 2 building designs on grid → +80%; spreads +18% diagonally',
  },

  // ── Meta-synergies — MUST be defined last ─────────────────────────────────────
  PRIMORDIAL_GROVE: {
    name: 'Primordial Grove', type: 'meta_synergy',
    requires: ['GARDEN', 'FOREST'],
    own: 0.65, reward: { type: 'random_block' },
    desc: 'GARDEN + FOREST both active → +65% to all synergy-active cells. Reward: bonus block',
  },
  DEEP_SPACE: {
    name: 'Deep Space', type: 'meta_synergy',
    requires: ['COSMOS', 'STARFLEET'],
    own: 0.75,
    desc: 'COSMOS + STARFLEET both active → +75% to all synergy-active cells',
  },
  STORM_KINGDOM: {
    name: 'Storm Kingdom', type: 'meta_synergy',
    requires: ['STORM_FRONT', 'URBAN'],
    own: 0.65,
    desc: 'STORM_FRONT + URBAN both active → +65% to all synergy-active cells',
  },
  BEAST_EMPIRE: {
    name: 'Beast Empire', type: 'meta_synergy',
    requires: ['MENAGERIE', 'BUILDING_ROW'],
    own: 0.70, reward: { type: 'gold', amount: 60 },
    desc: 'MENAGERIE + BUILDING_ROW both active → +70% to all synergy-active cells. Reward: +60 gold',
  },
  COSMIC_NEXUS: {
    name: 'Cosmic Nexus', type: 'meta_synergy',
    requires: ['DEEP_SPACE', 'PRIMORDIAL_GROVE'],
    own: 0.50, reward: { type: 'pixels', amount: 1000 },
    desc: 'DEEP_SPACE + PRIMORDIAL_GROVE both active → +50% to ALL occupied cells. Reward: +1000px',
    affectsAll: true,
  },
}

// ── TYPE_LABELS ───────────────────────────────────────────────────────────────
export const TYPE_LABELS = {
  series_count:    'Zone Cluster',
  exact_count:     'Exact Match',
  adjacency_pair:  'Adjacency',
  row_series:      'Row',
  column_series:   'Column',
  long_range:      'Long Range',
  core_radius:     'Core / Ring',
  block_type_count:'Block Type',
  cross_family:    'Cross-Family',
  meta_synergy:    'Meta',
}

// ── Design synergy lookup (for tooltips) ──────────────────────────────────────
export function getDesignSynergies(design) {
  const names = []
  for (const def of Object.values(SYNERGY_DEFS)) {
    if (def.type === 'series_count' || def.type === 'row_series' || def.type === 'column_series') {
      if (def.series === design.series) names.push(def.name)
    } else if (def.type === 'exact_count') {
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
 * Main function. Returns:
 *   synergyMap[r][c] = id of highest-value active synergy affecting that cell (or null)
 *   activeList = all synergy states for the ActiveEffectsPanel
 *   bonusMap[r][c] = total additive output bonus for that cell (own + radiation received)
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

  function applyRadiation(r, c, def, excludeKeys = null) {
    if (!def.radiation) return
    const dirs = def.radiation.type === 'ortho' ? ORTHO
               : def.radiation.type === 'diag'  ? DIAG : ALL8
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE || !grid[nr][nc]) continue
      if (excludeKeys && excludeKeys.has(`${nr},${nc}`)) continue
      bonusMap[nr][nc] += def.radiation.amount
    }
  }

  function tryAssignMap(r, c, synergyId, def) {
    const priority = getDefPriority(def)
    const current  = synergyMap[r][c]
    if (!current || priority > getDefPriority(SYNERGY_DEFS[current])) {
      synergyMap[r][c] = synergyId
    }
  }

  for (const [synergyId, def] of Object.entries(SYNERGY_DEFS)) {
    const required = (def.required ?? 0) + threshold

    // ── Series count — zone-constrained sliding window, unique designs required ─
    if (def.type === 'series_count') {
      let bestCount = 0
      const activeCellKeys = new Set()

      if (def.maxSpan) {
        const span = def.maxSpan
        for (let r0 = 0; r0 + span <= GRID_SIZE; r0++) {
          for (let c0 = 0; c0 + span <= GRID_SIZE; c0++) {
            const inZone = blocks.filter(b =>
              b.series === def.series &&
              b.r >= r0 && b.r < r0 + span &&
              b.c >= c0 && b.c < c0 + span
            )
            const uniqueInZone = new Set(inZone.map(b => b.designId)).size
            bestCount = Math.max(bestCount, uniqueInZone)
            if (uniqueInZone >= required) {
              for (const { r, c } of inZone) activeCellKeys.add(`${r},${c}`)
            }
          }
        }
      } else {
        bestCount = uCount(def.series)
        if (bestCount >= required) {
          for (const { r, c, series } of blocks) {
            if (series === def.series) activeCellKeys.add(`${r},${c}`)
          }
        }
      }

      const active = activeCellKeys.size > 0
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: bestCount, required: def.required, reward: def.reward ?? null })
      if (!active) continue

      for (const key of activeCellKeys) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.own
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
    }

    // ── Exact count ───────────────────────────────────────────────────────────
    else if (def.type === 'exact_count') {
      const count = designCount[def.designId] ?? 0
      const active = count >= required
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: count, required: def.required, reward: def.reward ?? null })
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

      for (const a of blocks) {
        if (a.designId !== def.designA) continue
        for (const b of blocks) {
          if (b.designId !== def.designB) continue
          if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1) {
            qualifyingCells.add(`${a.r},${a.c}`)
            qualifyingCells.add(`${b.r},${b.c}`)
            anyFound = true
          }
        }
      }

      const aCount = Math.min(designCount[def.designA] ?? 0, 1)
      const bCount = Math.min(designCount[def.designB] ?? 0, 1)
      const progress = anyFound ? 2 : aCount + bCount

      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: anyFound, progress, required: 2, reward: def.reward ?? null })
      if (!anyFound) continue

      for (const key of qualifyingCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.own
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
    }

    // ── Row series — duplicates count, radiation stays outside qualifying row ──
    else if (def.type === 'row_series') {
      let totalActive = 0
      let maxCountInRow = 0
      for (let r = 0; r < GRID_SIZE; r++) {
        const rowCells = blocks.filter(b => b.r === r && b.series === def.series)
        const countInRow = rowCells.length
        maxCountInRow = Math.max(maxCountInRow, countInRow)
        if (countInRow >= required) {
          totalActive += countInRow
          const rowKeys = new Set(rowCells.map(({ r: cr, c: cc }) => `${cr},${cc}`))
          for (const { c } of rowCells) {
            bonusMap[r][c] += def.own
            tryAssignMap(r, c, synergyId, def)
            applyRadiation(r, c, def, rowKeys)
          }
        }
      }
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: totalActive > 0, progress: maxCountInRow, required: def.required, reward: def.reward ?? null })
    }

    // ── Column series — duplicates count, radiation stays outside qualifying col ─
    else if (def.type === 'column_series') {
      let totalActive = 0
      let maxCountInCol = 0
      for (let c = 0; c < GRID_SIZE; c++) {
        const colCells = blocks.filter(b => b.c === c && b.series === def.series)
        const countInCol = colCells.length
        maxCountInCol = Math.max(maxCountInCol, countInCol)
        if (countInCol >= required) {
          totalActive += countInCol
          const colKeys = new Set(colCells.map(({ r: cr, c: cc }) => `${cr},${cc}`))
          for (const { r } of colCells) {
            bonusMap[r][c] += def.own
            tryAssignMap(r, c, synergyId, def)
            applyRadiation(r, c, def, colKeys)
          }
        }
      }
      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: totalActive > 0, progress: maxCountInCol, required: def.required, reward: def.reward ?? null })
    }

    // ── Long-range (≥ minDist Manhattan distance apart, same design allowed) ──
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

      const qualifyingCount = def.series
        ? (seriesCount[def.series] ?? 0)
        : Math.min(blocks.filter(b => def.designA ? b.designId === def.designA : b.series === def.seriesA).length, 1)
          + Math.min(blocks.filter(b => def.designB ? b.designId === def.designB : b.series === def.seriesB).length, 1)

      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: anyFound, progress: anyFound ? 2 : Math.min(qualifyingCount, 1), required: 2, reward: def.reward ?? null })
      if (!anyFound) continue

      for (const key of qualifyingCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.own
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
    }

    // ── Core-radius (anchor + N satellites within radius, duplicates count) ────
    else if (def.type === 'core_radius') {
      const coreCells      = new Set()
      const satelliteCells = new Set()
      let anyFound     = false
      let bestProgress = 0

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
        bestProgress = Math.max(bestProgress, satCount)

        if (satCount >= satRequired) {
          anyFound = true
          coreCells.add(`${core.r},${core.c}`)
          for (const sat of nearSatellites) satelliteCells.add(`${sat.r},${sat.c}`)
        }
      }

      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: anyFound, progress: bestProgress, required: def.requiredSatellites, reward: def.reward ?? null })
      if (!anyFound) continue

      for (const key of coreCells) {
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.ownCore
        tryAssignMap(r, c, synergyId, def)
        applyRadiation(r, c, def)
      }
      for (const key of satelliteCells) {
        // Skip cells that are also cores — they already received ownCore
        if (coreCells.has(key)) continue
        const [r, c] = key.split(',').map(Number)
        bonusMap[r][c] += def.ownSatellite
        tryAssignMap(r, c, synergyId, def)
      }
    }

    // ── Block-type count ──────────────────────────────────────────────────────
    else if (def.type === 'block_type_count') {
      if (def.blockType) {
        const count  = typeCount[def.blockType] ?? 0
        const active = count >= required
        activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: count, required: def.required, reward: def.reward ?? null })
        if (!active) continue
        for (const { r, c, blockType } of blocks) {
          if (blockType !== def.blockType) continue
          bonusMap[r][c] += def.own
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def)
        }
      } else {
        // SPECIALIST: all block types that independently reach the threshold get the bonus
        let bestCount = 0
        const qualifyingTypes = []
        for (const [bt, cnt] of Object.entries(typeCount)) {
          if (cnt > bestCount) bestCount = cnt
          if (cnt >= required) qualifyingTypes.push(bt)
        }
        const active = qualifyingTypes.length > 0
        activeList.push({ id: synergyId, name: def.name, desc: def.desc, active, progress: bestCount, required: def.required, reward: def.reward ?? null })
        if (!active) continue
        for (const { r, c, blockType } of blocks) {
          if (!qualifyingTypes.includes(blockType)) continue
          bonusMap[r][c] += def.own
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def)
        }
      }
    }

    // ── Cross-family ──────────────────────────────────────────────────────────
    else if (def.type === 'cross_family') {
      const requireResults = def.requires.map(req => {
        if (req.designId) {
          return (designCount[req.designId] ?? 0) >= 1
        } else if (req.series) {
          return uCount(req.series) >= (req.count ?? 1)
        }
        return false
      })
      const progress   = requireResults.filter(Boolean).length
      const totalPieces = def.requires.length
      let allMet = requireResults.every(Boolean)

      if (allMet && def.requireAdjacent) {
        const designIdReqs = def.requires.filter(r => r.designId).map(r => r.designId)
        if (designIdReqs.length === 2) {
          const [dA, dB] = designIdReqs
          let adjacentFound = false
          outer: for (const a of blocks) {
            if (a.designId !== dA) continue
            for (const [dr, dc] of ORTHO) {
              const nr = a.r + dr, nc = a.c + dc
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                if (grid[nr][nc]?.designId === dB) { adjacentFound = true; break outer }
              }
            }
          }
          allMet = adjacentFound
        } else {
          allMet = false
        }
      }

      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: allMet, progress, required: totalPieces, reward: def.reward ?? null })
      if (!allMet) continue

      if (def.requireAdjacent) {
        const designIdReqs = def.requires.filter(r => r.designId).map(r => r.designId)
        const [dA, dB] = designIdReqs
        const qualifyingCells = new Set()
        for (const a of blocks) {
          if (a.designId !== dA) continue
          for (const [dr, dc] of ORTHO) {
            const nr = a.r + dr, nc = a.c + dc
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              if (grid[nr][nc]?.designId === dB) {
                qualifyingCells.add(`${a.r},${a.c}`)
                qualifyingCells.add(`${nr},${nc}`)
              }
            }
          }
        }
        for (const key of qualifyingCells) {
          const [r, c] = key.split(',').map(Number)
          bonusMap[r][c] += def.own
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def)
        }
      } else {
        for (const { r, c, designId, series } of blocks) {
          const qualifies = def.requires.some(req =>
            (req.designId && req.designId === designId) ||
            (req.series   && req.series   === series)
          )
          if (!qualifies) continue
          bonusMap[r][c] += def.own
          tryAssignMap(r, c, synergyId, def)
          applyRadiation(r, c, def)
        }
      }
    }

    // ── Meta-synergy ──────────────────────────────────────────────────────────
    else if (def.type === 'meta_synergy') {
      const requiredActiveIds = def.requires
      const progress = requiredActiveIds.filter(id => activeList.find(a => a.id === id)?.active).length
      const allActive = progress === requiredActiveIds.length

      activeList.push({ id: synergyId, name: def.name, desc: def.desc, active: allActive, progress, required: requiredActiveIds.length, reward: def.reward ?? null })
      if (!allActive) continue

      if (def.affectsAll) {
        for (const { r, c } of blocks) {
          bonusMap[r][c] += def.own
          tryAssignMap(r, c, synergyId, def)
        }
      } else {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (synergyMap[r][c] !== null) {
              bonusMap[r][c] += def.own
            }
          }
        }
      }
    }
  }

  return { synergyMap, bonusMap, activeList }
}

// Returns additive output multiplier for a cell (1 + bonus)
export function getSynergyMultiplier(r, c, bonusMap) {
  return 1 + (bonusMap[r]?.[c] ?? 0)
}

// Synergy bonus between two same-series adjacent blocks (+15% base)
export function getAdjacencySynergyBonus(r, c, grid) {
  const block = grid[r][c]
  if (!block?.series) return 1
  for (const [dr, dc] of ORTHO) {
    const n = grid[r + dr]?.[c + dc]
    if (n?.series === block.series) return 1.15
  }
  return 1
}

// Highest synergy bonus for Conductor block to borrow from any of its 8 neighbours
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
