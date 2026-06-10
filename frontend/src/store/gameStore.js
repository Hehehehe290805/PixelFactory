import { create } from 'zustand'
import { GRID_SIZE, BASIC_BLOCK_TYPES, RANDOM_BASE_COST, MAX_DECK } from '../lib/constants'
import { getDesignById } from '../data/designLibrary'

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null))
}

let nextBlockId = 1

// Pick a random block type from the available pool.
// shopUnlocked = array of shop-only block types the player has purchased.
function pickRandomType(shopUnlocked = []) {
  const pool = [...BASIC_BLOCK_TYPES, ...shopUnlocked]
  return pool[Math.floor(Math.random() * pool.length)]
}

// Create a block instance from a design id/object.
// typeOverride — if provided, forces that block type (used for tutorial, rewards, etc.)
// purchaseCost — pixels the player paid; used to calculate sell refund (20%)
export function createBlock(designOrId, typeOverride = null, purchaseCost = 0) {
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
    type:                  typeOverride ?? design.blockType,
    pixelLayout:           design.pixelLayout,
    pixelCount:            design.pixelCount,
    dominantColor:         design.dominantColor,
    purchaseCost,
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

// Compute current random-block shop cost: RANDOM_BASE_COST * 2^buyCount
export function getRandomBlockCost(buyCount) {
  return RANDOM_BASE_COST * Math.pow(2, buyCount)
}

export const useGameStore = create((set, get) => ({
  grid:                emptyGrid(),
  inventory:           [],
  deckSelection:       [],        // [designId × up to MAX_DECK]
  designBuyCounts:     {},        // { designId: totalBought } — capped at 2 per design
  randomBuyCount:      0,         // tracks how many randoms bought; cost = BASE * 2^count
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

  // ── Sell block (drag to shop sell zone) ─────────────────────────────────────
  // Returns the pixel refund amount (20% of purchaseCost). 0 if block not found.
  sellBlock(blockId) {
    const state = get()

    // Search inventory first
    const invIdx = state.inventory.findIndex(b => b.id === blockId)
    if (invIdx !== -1) {
      const block = state.inventory[invIdx]
      const refund = Math.floor((block.purchaseCost ?? 0) * 0.20)
      const newInventory = state.inventory.filter(b => b.id !== blockId)
      // Refund by reducing pixelsSpentInShop (increases effective balance)
      set({
        inventory: newInventory,
        pixelsSpentInShop: Math.max(0, state.pixelsSpentInShop - refund),
      })
      return refund
    }

    // Search grid
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = state.grid[r][c]
        if (cell?.id === blockId) {
          const refund = Math.floor((cell.purchaseCost ?? 0) * 0.20)
          const newGrid = state.grid.map(row => [...row])
          newGrid[r][c] = null
          set({
            grid: newGrid,
            pixelsSpentInShop: Math.max(0, state.pixelsSpentInShop - refund),
          })
          return refund
        }
      }
    }

    return 0
  },

  // ── In-level shop ────────────────────────────────────────────────────────────

  // Buy a design from the deck shop. Block type is randomly assigned at purchase.
  buyDesignFromShop(designId, cost, shopUnlocked = []) {
    const state = get()
    const balance = state.totalPixelsProduced - state.pixelsSpentInShop
    if (balance < cost) return false
    if ((state.designBuyCounts[designId] ?? 0) >= 2) return false
    const randomType = pickRandomType(shopUnlocked)
    const block = createBlock(designId, randomType, cost)
    if (!block) return false
    set({
      pixelsSpentInShop: state.pixelsSpentInShop + cost,
      inventory: [...state.inventory, block],
      designBuyCounts: { ...state.designBuyCounts, [designId]: (state.designBuyCounts[designId] ?? 0) + 1 },
    })
    return true
  },

  // Buy a random design. Cost doubles each purchase. Block type also randomised.
  buyRandomDesign(unlockedDesignIds = [], deckIds = [], shopUnlocked = []) {
    const state = get()
    const cost = getRandomBlockCost(state.randomBuyCount)
    const balance = state.totalPixelsProduced - state.pixelsSpentInShop
    if (balance < cost) return false
    const pool = unlockedDesignIds.filter(id => !deckIds.includes(id))
    const candidates = pool.length > 0 ? pool : unlockedDesignIds
    if (candidates.length === 0) return false
    const designId = candidates[Math.floor(Math.random() * candidates.length)]
    const randomType = pickRandomType(shopUnlocked)
    const block = createBlock(designId, randomType, cost)
    if (!block) return false
    set({
      pixelsSpentInShop: state.pixelsSpentInShop + cost,
      randomBuyCount: state.randomBuyCount + 1,
      inventory: [...state.inventory, block],
    })
    return block
  },

  // Grant a free random block (synergy reward — no pixel cost)
  grantRandomBlock(unlockedDesignIds = [], shopUnlocked = []) {
    if (!unlockedDesignIds.length) return
    const designId = unlockedDesignIds[Math.floor(Math.random() * unlockedDesignIds.length)]
    const randomType = pickRandomType(shopUnlocked)
    const block = createBlock(designId, randomType, 0)
    if (!block) return
    set(s => ({ inventory: [...s.inventory, block] }))
  },

  buyShopItem(cost) {
    const s = get()
    const balance = s.totalPixelsProduced - s.pixelsSpentInShop
    if (balance < cost) return false
    set({ pixelsSpentInShop: s.pixelsSpentInShop + cost })
    return true
  },

  // ── Deck selection ──────────────────────────────────────────────────────────

  setDeckSelection(designIds) {
    set({ deckSelection: designIds.slice(0, MAX_DECK) })
  },

  addToDeck(designId) {
    const { deckSelection } = get()
    if (deckSelection.length >= MAX_DECK) return
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
  setGameSpeed(speed)  { set({ gameSpeed: speed }) },
  setPaused(paused)    { set({ gamePaused: paused }) },

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

  startLevel(levelBlocks) {
    set({
      grid:                emptyGrid(),
      inventory:           levelBlocks ?? [],
      designBuyCounts:     {},
      randomBuyCount:      0,
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

  restoreGrid(savedGrid, savedInventory) {
    set({ grid: savedGrid, inventory: savedInventory ?? [], levelActive: true })
  },

  completeLevel() { set({ levelActive: false, levelComplete: true }) },

  resetLevel() {
    set({
      grid:                emptyGrid(),
      inventory:           [],
      designBuyCounts:     {},
      randomBuyCount:      0,
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
