import { TICK_MS, GRID_SIZE } from '../lib/constants'
import { buildSetMap } from './setDetector'
import { buildDominanceMap } from './dominanceChecker'
import { getSetBonusMultiplier, getSynergyMultiplier } from './synergyEngine'
import {
  baseRate,
  getDoublerMultiplier,
  getCrossAmplifierBonus,
  getAmplifierMultiplier,
  getResonatorMultiplier,
  getReactorMultiplier,
  getConductorBonus,
  getPrismMultiplier,
  getMirrorRate,
  getOverflowMultiplier,
  buildCatalystRows,
  getVoidBonus,
  getEchoMultiplier,
  getSplitterBonus,
  getFocusMultiplier,
  getClusterMultiplier,
  getLatticeBonus,
} from './blockEffects'

// Grid-style modifiers keyed by activeGridStyle from shopStore
const GRID_MODS = {
  base:         { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.05 },
  overclock:    { outputMult: 1.10, synergyMult: 1.00, ccReduction: 0.05 },
  efficiency:   { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.05 },
  gold_rush:    { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.05 },
  bargain:      { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.05 },
  quantum:      { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.05 },
  neural:       { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.08 },
  industrial:   { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.05, industrialBonus: true },
  synergy_plus: { outputMult: 1.00, synergyMult: 1.25, ccReduction: 0.05 },
  cascade:      { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.05, cascade: true },
  overcharge:   { outputMult: 1.25, synergyMult: 1.00, ccReduction: 0.05 },
  lattice:      { outputMult: 1.00, synergyMult: 1.00, ccReduction: 0.05, lattice: true },
}

function getMods(style) {
  return GRID_MODS[style] ?? GRID_MODS.base
}

// Quantum burst: every 300 ticks (30s), burst for 50 ticks (5s)
function isQuantumBurst(gridTick) {
  return (gridTick % 300) < 50
}

// Cascade: each row below row 5 produces +4% more (row 6 = +4%, row 11 = +24%)
function cascadeRowMult(row) {
  return row > 5 ? 1 + (row - 5) * 0.04 : 1
}

export function computeTick(grid, { activeGridStyle = 'base', gridTick = 0 } = {}) {
  const mods         = getMods(activeGridStyle)
  const setMap       = buildSetMap(grid)
  const dominanceMap = buildDominanceMap(grid)
  const catalystRows = buildCatalystRows(grid)

  // Industrial: +3% per 10 placed blocks
  const placedCount    = grid.flat().filter(Boolean).length
  const industrialMult = mods.industrialBonus ? 1 + Math.floor(placedCount / 10) * 0.03 : 1

  // Quantum burst multiplier
  const quantumMult = activeGridStyle === 'quantum' && isQuantumBurst(gridTick) ? 2.0 : 1.0

  // First pass: compute base × set × synergy rates for Mirror/Splitter resolution
  const rateMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const block = grid[r][c]
      if (!block || block.pauseTimer > 0 || block.pixelCount === 0) continue
      if (block.type === 'void' || block.type === 'forge') continue

      let rate = baseRate(block)
      rate *= getSetBonusMultiplier(r, c, setMap)

      // Synergy with optional catalyst and synergy_plus grid amplifiers
      const synergyRaw   = getSynergyMultiplier(r, c, setMap)
      const catMult      = catalystRows.has(r) ? 1.5 : 1
      const synergyBonus = (synergyRaw - 1) * mods.synergyMult * catMult
      rate *= (1 + synergyBonus)

      rateMap[r][c] = rate
    }
  }

  // Second pass: full calculation including neighbor-dependent effects
  let totalThisTick = 0
  let totalPxPerSec = 0

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const block = grid[r][c]
      if (!block || block.pauseTimer > 0 || block.pixelCount === 0) continue
      // Void and Forge produce no output themselves
      if (block.type === 'void' || block.type === 'forge') continue

      let rate = rateMap[r][c]

      // Flat additions
      rate += getCrossAmplifierBonus(r, c, grid)           // flat px/s from diagonal CA blocks
      rate += getSplitterBonus(r, c, grid, rateMap)        // flat px/s from adjacent splitters

      // Multipliers
      rate *= getDoublerMultiplier(block, r, c, grid)      // ×2 if isolation condition met
      rate *= getAmplifierMultiplier(block, r, c, grid)    // +8% per occupied neighbor
      rate *= getResonatorMultiplier(block, r, c, grid)    // +50% if same-type neighbor
      rate *= getReactorMultiplier(block)                  // ramp 0.5–2.0×
      rate *= getConductorBonus(block, r, c, grid, setMap) // borrow neighbor's set bonus
      rate *= getPrismMultiplier(block)                    // +5% per unique color
      rate *= getOverflowMultiplier(block)                 // 3× burst every 10s
      rate *= getEchoMultiplier(block)                     // +4% per 10s stationary
      rate *= getFocusMultiplier(block)                    // up to ×2 based on color match
      rate *= getClusterMultiplier(block, r, c, grid)      // +12% per occupied neighbor
      rate *= getVoidBonus(r, c, grid)                     // +15% per adjacent void block

      // Dominance boost from a neighbor's color majority
      if (dominanceMap.has(`${r},${c}`)) rate *= 1.25

      // Mirror: override with best neighbor's first-pass rate
      if (block.type === 'mirror') {
        const mirrorRate = getMirrorRate(block, r, c, grid, rateMap)
        if (mirrorRate !== null) rate = mirrorRate
      }

      // Grid-style global multipliers
      rate *= mods.outputMult
      rate *= industrialMult
      rate *= quantumMult
      if (mods.cascade) rate *= cascadeRowMult(r)
      if (mods.lattice) rate *= getLatticeBonus(r, c, grid)

      totalPxPerSec += rate
      totalThisTick += rate / (1000 / TICK_MS)
    }
  }

  return { totalThisTick, totalPxPerSec, setMap }
}

// Exposed so gameStore / Level.jsx can use the CC reduction from the active grid style
export function getCCReduction(activeGridStyle) {
  return getMods(activeGridStyle).ccReduction
}
