import { create } from 'zustand'
import { GRID_SIZE } from '../lib/constants'
import { getDesignById } from '../data/designLibrary'

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
}

let nextBlockId = 1

// Create a placeable block instance from a design object or id
export function createBlock(designOrId) {
  const design = typeof designOrId === 'string'
    ? getDesignById(designOrId)
    : designOrId
  if (!design) {
    console.error('createBlock: design not found', designOrId)
    return null
  }
  return {
    id:                    nextBlockId++,
    designId:              design.id,
    name:                  design.name,
    series:                design.series,
    type:                  design.blockType,
    pixelLayout:           design.pixelLayout,
    pixelCount:            design.pixelCount,
    dominantColor:         design.dominantColor,
    pauseTimer:            0,
    activeSynergy:         null,
    colorCheckerTriggered: false,
    reactorAge:            0,
    echoAge:               0,
    overflowTimer:         0,
    waveDir:               'up',
  }
}

function applyBlockUpdate(state, blockId, updater) {
  const newGrid = state.grid.map(row =>
    row.map(cell => (cell && cell.id === blockId ? updater(cell) : cell))
  )
  const newInventory = state.inventory.map(b =>
    b.id === blockId ? updater(b) : b
  )
  return { grid: newGrid, inventory: newInventory }
}

export const useGameStore = create((set, get) => ({
  grid:                emptyGrid(),
  inventory:           [],        // design block instances in hand
  deckSelection:       [],        // [designId × up to 10] chosen before each level
  selectedBlockId:     null,
  totalPixelsProduced: 0,
  pixelsSpentInShop:   0,
  currentPxPerSecond:  0,
  levelActive:         false,
  levelComplete:       false,
  gameSpeed:           1,
  gamePaused:          false,

  // ── Grid actions ────────────────────────────────────────────────────────────

  placeBlock(blockId, row, col) {
    const state = get()
    const block = state.inventory.find(b => b.id === blockId)
    if (!block || state.grid[row][col] !== null) return
    const newGrid = state.grid.map(r => [...r])
    newGrid[row][col] = { ...block, pauseTimer: 0 }
    set({ grid: newGrid, inventory: state.inventory.filter(b => b.id !== blockId) })
  },

  removeBlock(row, col) {
    const state = get()
    const block = state.grid[row][col]
    if (!block) return
    const newGrid = state.grid.map(r => [...r])
    newGrid[row][col] = null
    set({ grid: newGrid, inventory: [...state.inventory, block] })
  },

  moveBlock(fromRow, fromCol, toRow, toCol) {
    const state = get()
    if (state.grid[toRow][toCol] !== null) return
    const block = state.grid[fromRow][fromCol]
    if (!block) return
    const newGrid = state.grid.map(r => [...r])
    newGrid[fromRow][fromCol] = null
    newGrid[toRow][toCol] = { ...block, pauseTimer: 5000, reactorAge: 0, echoAge: 0 }
    set({ grid: newGrid })
  },

  replaceBlock(row, col, blockId) {
    const state = get()
    const incoming = state.inventory.find(b => b.id === blockId)
    if (!incoming) return
    const displaced = state.grid[row][col]
    const newGrid = state.grid.map(r => [...r])
    newGrid[row][col] = { ...incoming, pauseTimer: 0 }
    const newInventory = state.inventory.filter(b => b.id !== blockId)
    if (displaced) newInventory.push(displaced)
    set({ grid: newGrid, inventory: newInventory })
  },

  // ── In-level shop: buy design instance, deduct from pixel budget ─────────────

  buyDesignFromShop(designId, cost) {
    const state = get()
    const balance = state.totalPixelsProduced - state.pixelsSpentInShop
    if (balance < cost) return false
    const block = createBlock(designId)
    if (!block) return false
    set({
      pixelsSpentInShop: state.pixelsSpentInShop + cost,
      inventory: [...state.inventory, block],
    })
    return true
  },

  // Generic shop budget deduction (for other in-level purchases)
  buyShopItem(cost) {
    const s = get()
    const balance = s.totalPixelsProduced - s.pixelsSpentInShop
    if (balance < cost) return false
    set({ pixelsSpentInShop: s.pixelsSpentInShop + cost })
    return true
  },

  // ── Deck selection ──────────────────────────────────────────────────────────

  setDeckSelection(designIds) {
    set({ deckSelection: designIds.slice(0, 10) })
  },

  addToDeck(designId) {
    const { deckSelection } = get()
    if (deckSelection.length >= 10 || deckSelection.includes(designId)) return
    set({ deckSelection: [...deckSelection, designId] })
  },

  removeFromDeck(designId) {
    set(s => ({ deckSelection: s.deckSelection.filter(id => id !== designId) }))
  },

  // ── Wave direction ──────────────────────────────────────────────────────────

  setWaveDir(blockId, dir) {
    const { grid, inventory } = applyBlockUpdate(get(), blockId, b => ({ ...b, waveDir: dir }))
    set({ grid, inventory })
  },

  // ── Production ──────────────────────────────────────────────────────────────

  addPixels(amount) {
    set(state => ({ totalPixelsProduced: state.totalPixelsProduced + amount }))
  },

  setPxPerSecond(rate) { set({ currentPxPerSecond: rate }) },

  setGameSpeed(speed) { set({ gameSpeed: speed }) },
  setPaused(paused)   { set({ gamePaused: paused }) },

  // ── Block timers ────────────────────────────────────────────────────────────

  tickCooldowns(deltaMs) {
    const state = get()
    let changed = false
    const newGrid = state.grid.map(row =>
      row.map(cell => {
        if (!cell) return cell
        let updated = cell
        if (cell.pauseTimer > 0) {
          updated = { ...updated, pauseTimer: Math.max(0, cell.pauseTimer - deltaMs) }
          changed = true
        }
        if (cell.type === 'reactor' && cell.pauseTimer === 0) {
          updated = { ...updated, reactorAge: (cell.reactorAge ?? 0) + 1 }
          changed = true
        }
        if (cell.type === 'echo' && cell.pauseTimer === 0) {
          updated = { ...updated, echoAge: (cell.echoAge ?? 0) + 1 }
          changed = true
        }
        if (cell.type === 'overflow') {
          updated = { ...updated, overflowTimer: ((cell.overflowTimer ?? 0) + 1) % 150 }
          changed = true
        }
        return updated
      })
    )
    if (changed) set({ grid: newGrid })
  },

  // Update each block's activeSynergy field from the latest synergy map
  updateBlockSynergies(synergyMap) {
    const state = get()
    let changed = false
    const newGrid = state.grid.map((row, r) =>
      row.map((cell, c) => {
        if (!cell) return cell
        const newSynergy = synergyMap[r]?.[c] ?? null
        if (cell.activeSynergy !== newSynergy) {
          changed = true
          return { ...cell, activeSynergy: newSynergy }
        }
        return cell
      })
    )
    if (changed) set({ grid: newGrid })
  },

  // ── Level lifecycle ─────────────────────────────────────────────────────────

  // levelBlocks: array of block instances (already created via createBlock)
  startLevel(levelBlocks) {
    set({
      grid:                emptyGrid(),
      inventory:           levelBlocks ?? [],
      totalPixelsProduced: 0,
      pixelsSpentInShop:   0,
      currentPxPerSecond:  0,
      levelActive:         true,
      levelComplete:       false,
      selectedBlockId:     null,
      gameSpeed:           1,
      gamePaused:          false,
    })
  },

  completeLevel() { set({ levelActive: false, levelComplete: true }) },

  resetLevel() {
    set({
      grid:                emptyGrid(),
      inventory:           [],
      totalPixelsProduced: 0,
      pixelsSpentInShop:   0,
      currentPxPerSecond:  0,
      levelActive:         false,
      levelComplete:       false,
      selectedBlockId:     null,
      gameSpeed:           1,
      gamePaused:          false,
    })
  },

  setSelectedBlock(blockId) { set({ selectedBlockId: blockId }) },
}))
