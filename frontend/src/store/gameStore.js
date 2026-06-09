import { create } from 'zustand'
import { GRID_SIZE, BLOCK_CANVAS_SIZE } from '../lib/constants'

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
}

export function emptyPixelLayout() {
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
    reactorAge: 0,
    echoAge: 0,
    focusColor: null,
    overflowTimer: 0,
  }
}

const CHECKER_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'violet']
const FOCUS_COLORS   = ['red', 'orange', 'yellow', 'green', 'blue', 'violet']

function findBlockInState(state, blockId) {
  for (const row of state.grid) {
    for (const cell of row) {
      if (cell && cell.id === blockId) return cell
    }
  }
  return state.inventory.find(b => b.id === blockId) ?? null
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
  grid: emptyGrid(),
  inventory: [],
  pixelInventory: {},
  selectedBlockId: null,
  totalPixelsProduced: 0,
  pixelsSpent: 0,
  currentPxPerSecond: 0,
  levelActive: false,
  levelComplete: false,
  colorCheckerReductions: 0,

  placeBlock(blockId, row, col) {
    const state = get()
    const block = state.inventory.find(b => b.id === blockId)
    if (!block || state.grid[row][col] !== null) return

    let placed = { ...block, pauseTimer: 0 }
    if (placed.type === 'color_checker' && !placed.colorCheckerColor) {
      placed.colorCheckerColor = CHECKER_COLORS[Math.floor(Math.random() * CHECKER_COLORS.length)]
    }
    if (placed.type === 'focus' && !placed.focusColor) {
      placed.focusColor = FOCUS_COLORS[Math.floor(Math.random() * FOCUS_COLORS.length)]
    }

    const newGrid = state.grid.map(r => [...r])
    newGrid[row][col] = placed
    set({ grid: newGrid, inventory: state.inventory.filter(b => b.id !== blockId) })
  },

  removeBlock(row, col) {
    const state = get()
    const block = state.grid[row][col]
    if (!block) return

    const refunds = { ...state.pixelInventory }
    for (const r of block.pixelLayout) {
      for (const color of r) {
        if (color) refunds[color] = (refunds[color] ?? 0) + 1
      }
    }

    const newGrid = state.grid.map(r => [...r])
    newGrid[row][col] = null
    set({ grid: newGrid, inventory: [...state.inventory, block], pixelInventory: refunds })
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

  paintPixel(blockId, row, col, color) {
    const state = get()
    const block = findBlockInState(state, blockId)
    if (!block) return

    const oldColor = block.pixelLayout[row]?.[col] ?? null
    if (oldColor === color) return

    if (color !== null && (state.pixelInventory[color] ?? 0) <= 0) return

    const newInv = { ...state.pixelInventory }
    if (oldColor !== null) newInv[oldColor] = (newInv[oldColor] ?? 0) + 1
    if (color !== null) newInv[color] = (newInv[color] ?? 1) - 1

    const newLayout = block.pixelLayout.map(r => [...r])
    newLayout[row][col] = color
    const pixelCount = newLayout.flat().filter(c => c !== null).length

    let reductions = state.colorCheckerReductions
    let finalBlock = { ...block, pixelLayout: newLayout, pixelCount }

    if (finalBlock.type === 'color_checker' && !finalBlock.colorCheckerTriggered && finalBlock.colorCheckerColor && pixelCount > 0) {
      const match = newLayout.flat().filter(c => c === finalBlock.colorCheckerColor).length
      if (match / pixelCount >= 0.5) {
        finalBlock = { ...finalBlock, colorCheckerTriggered: true }
        reductions += 1
      }
    }

    const { grid, inventory } = applyBlockUpdate({ grid: state.grid, inventory: state.inventory }, blockId, () => finalBlock)
    set({ grid, inventory, pixelInventory: newInv, colorCheckerReductions: reductions })
  },

  clearBlock(blockId) {
    const state = get()
    const block = findBlockInState(state, blockId)
    if (!block) return

    const newInv = { ...state.pixelInventory }
    for (const r of block.pixelLayout) {
      for (const color of r) {
        if (color) newInv[color] = (newInv[color] ?? 0) + 1
      }
    }

    const { grid, inventory } = applyBlockUpdate({ grid: state.grid, inventory: state.inventory }, blockId, b => ({
      ...b, pixelLayout: emptyPixelLayout(), pixelCount: 0, colorCheckerTriggered: false,
    }))
    set({ grid, inventory, pixelInventory: newInv })
  },

  fillBlock(blockId, color) {
    const state = get()
    const block = findBlockInState(state, blockId)
    if (!block || !color) return

    const available = state.pixelInventory[color] ?? 0
    if (available <= 0) return

    const newLayout = block.pixelLayout.map(r => [...r])
    let used = 0
    outer: for (let r = 0; r < BLOCK_CANVAS_SIZE; r++) {
      for (let c = 0; c < BLOCK_CANVAS_SIZE; c++) {
        if (newLayout[r][c] === null && used < available) {
          newLayout[r][c] = color
          used++
        }
      }
    }
    if (used === 0) return

    const newInv = { ...state.pixelInventory, [color]: available - used }
    const pixelCount = newLayout.flat().filter(c => c !== null).length

    let reductions = state.colorCheckerReductions
    let finalBlock = { ...block, pixelLayout: newLayout, pixelCount }

    if (finalBlock.type === 'color_checker' && !finalBlock.colorCheckerTriggered && finalBlock.colorCheckerColor && pixelCount > 0) {
      const match = newLayout.flat().filter(c => c === finalBlock.colorCheckerColor).length
      if (match / pixelCount >= 0.5) {
        finalBlock = { ...finalBlock, colorCheckerTriggered: true }
        reductions += 1
      }
    }

    const { grid, inventory } = applyBlockUpdate({ grid: state.grid, inventory: state.inventory }, blockId, () => finalBlock)
    set({ grid, inventory, pixelInventory: newInv, colorCheckerReductions: reductions })
  },

  setSelectedBlock(blockId) { set({ selectedBlockId: blockId }) },

  addPixels(amount) {
    set(state => ({ totalPixelsProduced: state.totalPixelsProduced + amount }))
  },

  setPxPerSecond(rate) { set({ currentPxPerSecond: rate }) },

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
        // Increment reactor age while active (not on cooldown)
        if (cell.type === 'reactor' && cell.pauseTimer === 0) {
          updated = { ...updated, reactorAge: (cell.reactorAge ?? 0) + 1 }
          changed = true
        }
        // Increment echo age while active (not on cooldown)
        if (cell.type === 'echo' && cell.pauseTimer === 0) {
          updated = { ...updated, echoAge: (cell.echoAge ?? 0) + 1 }
          changed = true
        }
        // Overflow burst cycle (0–149: 0–99 charging, 100–149 burst)
        if (cell.type === 'overflow') {
          updated = { ...updated, overflowTimer: ((cell.overflowTimer ?? 0) + 1) % 150 }
          changed = true
        }
        return updated
      })
    )
    if (changed) set({ grid: newGrid })
  },

  updateBlockSets(setMap) {
    const state = get()
    let changed = false
    const newGrid = state.grid.map((row, r) =>
      row.map((cell, c) => {
        if (!cell) return cell
        const newSet = setMap[r]?.[c] ?? null
        if (cell.activeSet !== newSet) { changed = true; return { ...cell, activeSet: newSet } }
        return cell
      })
    )
    if (changed) set({ grid: newGrid })
  },

  startLevel(levelBlocks, startingPixels) {
    set({
      grid: emptyGrid(),
      inventory: levelBlocks,
      pixelInventory: { ...startingPixels },
      totalPixelsProduced: 0,
      pixelsSpent: 0,
      currentPxPerSecond: 0,
      levelActive: true,
      levelComplete: false,
      selectedBlockId: null,
      colorCheckerReductions: 0,
    })
  },

  completeLevel() { set({ levelActive: false, levelComplete: true }) },

  resetLevel() {
    set({
      grid: emptyGrid(),
      inventory: [],
      pixelInventory: {},
      totalPixelsProduced: 0,
      pixelsSpent: 0,
      currentPxPerSecond: 0,
      levelActive: false,
      levelComplete: false,
      selectedBlockId: null,
      colorCheckerReductions: 0,
    })
  },
}))
