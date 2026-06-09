import { create } from 'zustand'
import { GRID_SIZE, BLOCK_CANVAS_SIZE } from '../lib/constants'

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
}

function emptyPixelLayout() {
  return Array.from({ length: BLOCK_CANVAS_SIZE }, () =>
    Array(BLOCK_CANVAS_SIZE).fill(null)
  )
}

let nextBlockId = 1

export function createBlock(type = 'base') {
  return {
    id: nextBlockId++,
    type,
    pixelLayout: emptyPixelLayout(),
    pixelCount: 0,
    pauseTimer: 0,
    activeSet: null,
    colorCheckerColor: null,
    colorCheckerTriggered: false,
  }
}

export const useGameStore = create((set, get) => ({
  // 12x12 grid — each cell is null or a block object
  grid: emptyGrid(),

  // Blocks in inventory (not placed)
  inventory: [],

  // Currently selected block id for editing
  selectedBlockId: null,

  // Level runtime state
  totalPixelsProduced: 0,
  pixelsSpent: 0,
  currentPxPerSecond: 0,
  levelActive: false,
  levelComplete: false,

  // --- Grid actions ---
  placeBlock(blockId, row, col) {
    const state = get()
    const block = state.inventory.find(b => b.id === blockId)
    if (!block) return
    if (state.grid[row][col] !== null) return

    const newGrid = state.grid.map(r => [...r])
    newGrid[row][col] = { ...block, pauseTimer: 0 }
    set({
      grid: newGrid,
      inventory: state.inventory.filter(b => b.id !== blockId),
    })
  },

  removeBlock(row, col) {
    const state = get()
    const block = state.grid[row][col]
    if (!block) return
    const newGrid = state.grid.map(r => [...r])
    newGrid[row][col] = null
    set({
      grid: newGrid,
      inventory: [...state.inventory, block],
    })
  },

  moveBlock(fromRow, fromCol, toRow, toCol) {
    const state = get()
    if (state.grid[toRow][toCol] !== null) return
    const block = state.grid[fromRow][fromCol]
    if (!block) return
    const newGrid = state.grid.map(r => [...r])
    newGrid[fromRow][fromCol] = null
    newGrid[toRow][toCol] = { ...block, pauseTimer: 5000 }
    set({ grid: newGrid })
  },

  updateBlockPixels(blockId, pixelLayout) {
    const pixelCount = pixelLayout.flat().filter(c => c !== null).length
    // Update in grid
    const state = get()
    const newGrid = state.grid.map(row =>
      row.map(cell =>
        cell && cell.id === blockId
          ? { ...cell, pixelLayout, pixelCount }
          : cell
      )
    )
    // Update in inventory
    const newInventory = state.inventory.map(b =>
      b.id === blockId ? { ...b, pixelLayout, pixelCount } : b
    )
    set({ grid: newGrid, inventory: newInventory })
  },

  setSelectedBlock(blockId) {
    set({ selectedBlockId: blockId })
  },

  // --- Production state ---
  addPixels(amount) {
    set(state => ({ totalPixelsProduced: state.totalPixelsProduced + amount }))
  },

  setPxPerSecond(rate) {
    set({ currentPxPerSecond: rate })
  },

  tickCooldowns(deltaMs) {
    const state = get()
    const newGrid = state.grid.map(row =>
      row.map(cell =>
        cell && cell.pauseTimer > 0
          ? { ...cell, pauseTimer: Math.max(0, cell.pauseTimer - deltaMs) }
          : cell
      )
    )
    set({ grid: newGrid })
  },

  startLevel(levelBlocks) {
    set({
      grid: emptyGrid(),
      inventory: levelBlocks,
      totalPixelsProduced: 0,
      pixelsSpent: 0,
      currentPxPerSecond: 0,
      levelActive: true,
      levelComplete: false,
      selectedBlockId: null,
    })
  },

  completeLevel() {
    set({ levelActive: false, levelComplete: true })
  },

  resetLevel() {
    set({
      grid: emptyGrid(),
      inventory: [],
      totalPixelsProduced: 0,
      pixelsSpent: 0,
      currentPxPerSecond: 0,
      levelActive: false,
      levelComplete: false,
      selectedBlockId: null,
    })
  },
}))
