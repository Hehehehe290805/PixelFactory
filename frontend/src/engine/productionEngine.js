import { TICK_MS, GRID_SIZE } from '../lib/constants'
import { buildSynergyData, getSynergyMultiplier, getAdjacencySynergyBonus, getBestNeighborSynergyBonus } from './designSynergies'
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

// Grid-style modifiers
const GRID_MODS = {
  base:         { outputMult: 1.00, synergyMult: 1.00, neural: false, industrial: false, cascade: false, lattice: false, quantum: false },
  overclock:    { outputMult: 1.10, synergyMult: 1.00 },
  efficiency:   { outputMult: 1.00, synergyMult: 1.00 },
  gold_rush:    { outputMult: 1.00, synergyMult: 1.00 },
  bargain:      { outputMult: 1.00, synergyMult: 1.00 },
  quantum:      { outputMult: 1.00, synergyMult: 1.00, quantum: true },
  neural:       { outputMult: 1.00, synergyMult: 1.00, neural: true },
  industrial:   { outputMult: 1.00, synergyMult: 1.00, industrial: true },
  synergy_plus: { outputMult: 1.00, synergyMult: 1.25 },
  cascade:      { outputMult: 1.00, synergyMult: 1.00, cascade: true },
  overcharge:   { outputMult: 1.25, synergyMult: 1.00 },
  lattice:      { outputMult: 1.00, synergyMult: 1.00, lattice: true },
}

function getMods(style) {
  const base = { outputMult: 1.00, synergyMult: 1.00, neural: false, industrial: false, cascade: false, lattice: false, quantum: false }
  return { ...base, ...(GRID_MODS[style] ?? {}) }
}

function isQuantumBurst(gridTick) {
  return (gridTick % 300) < 50
}

function cascadeRowMult(row) {
  return row > 5 ? 1 + (row - 5) * 0.04 : 1
}

export function computeTick(grid, { activeGridStyle = 'base', gridTick = 0 } = {}) {
  const mods = getMods(activeGridStyle)

  // Build synergy data (replaces setMap + dominanceMap)
  const { synergyMap, bonusMap, activeList } = buildSynergyData(grid, mods.neural)

  const catalystRows   = buildCatalystRows(grid)
  const placedCount    = grid.flat().filter(Boolean).length
  const industrialMult = mods.industrial ? 1 + Math.floor(placedCount / 10) * 0.03 : 1
  const quantumMult    = mods.quantum && isQuantumBurst(gridTick) ? 2.0 : 1.0

  // First pass: base × synergy × adjacency synergy → rateMap
  const rateMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const block = grid[r][c]
      if (!block || block.pauseTimer > 0) continue
      if (block.type === 'void' || block.type === 'forge') continue

      let rate = baseRate(block)

      // Design series synergy (from buildSynergyData)
      rate *= getSynergyMultiplier(r, c, bonusMap)

      // Adjacency synergy: same-series adjacent blocks +15% (scaled by Synergy+ and Catalyst)
      const adjSynRaw  = getAdjacencySynergyBonus(r, c, grid)
      const catMult    = catalystRows.has(r) ? 1.5 : 1
      const adjBonus   = (adjSynRaw - 1) * mods.synergyMult * catMult
      rate *= (1 + adjBonus)

      rateMap[r][c] = rate
    }
  }

  // Second pass: block-type effects
  let totalThisTick = 0
  let totalPxPerSec = 0
  const finalRateMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const block = grid[r][c]
      if (!block || block.pauseTimer > 0) continue
      if (block.type === 'void' || block.type === 'forge') continue

      let rate = rateMap[r][c]

      // Flat additions
      rate += getCrossAmplifierBonus(r, c, grid)
      rate += getSplitterBonus(r, c, grid, rateMap)

      // Multipliers
      rate *= getDoublerMultiplier(block, r, c, grid)
      rate *= getAmplifierMultiplier(block, r, c, grid)
      rate *= getResonatorMultiplier(block, r, c, grid)
      rate *= getReactorMultiplier(block)
      rate *= getConductorBonus(block, r, c, grid, bonusMap)  // uses bonusMap, not old setMap
      rate *= getPrismMultiplier(block)
      rate *= getOverflowMultiplier(block)
      rate *= getEchoMultiplier(block)
      rate *= getFocusMultiplier(block)
      rate *= getClusterMultiplier(block, r, c, grid)
      rate *= getVoidBonus(r, c, grid)

      // Mirror: override with best neighbor first-pass rate
      if (block.type === 'mirror') {
        const mirrorRate = getMirrorRate(block, r, c, grid, rateMap)
        if (mirrorRate !== null) rate = mirrorRate
      }

      // Grid-style multipliers
      rate *= mods.outputMult
      rate *= industrialMult
      rate *= quantumMult
      if (mods.cascade) rate *= cascadeRowMult(r)
      if (mods.lattice) rate *= getLatticeBonus(r, c, grid)

      finalRateMap[r][c] = rate
      totalPxPerSec += rate
      totalThisTick += rate / (1000 / TICK_MS)
    }
  }

  return { totalThisTick, totalPxPerSec, synergyMap, bonusMap, activeList, finalRateMap }
}

// For Level.jsx — efficiency grid style reduces required output by 10%
export function getEfficiencyReduction(activeGridStyle) {
  return activeGridStyle === 'efficiency' ? 0.10 : 0
}
