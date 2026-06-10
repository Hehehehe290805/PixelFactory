import { create } from 'zustand'

function loadState() {
  try { return JSON.parse(localStorage.getItem('pf_shop') ?? '{}') } catch { return {} }
}

function persist(state) {
  try {
    localStorage.setItem('pf_shop', JSON.stringify({
      activeGridStyle:  state.activeGridStyle,
      unlockedPixels:   state.unlockedPixels,
      unlockedBlocks:   state.unlockedBlocks,
      purchasedSpeeds:  state.purchasedSpeeds,
    }))
  } catch {}
}

const saved = loadState()

export const useShopStore = create((set, get) => ({
  activeGridStyle: saved.activeGridStyle  ?? 'base',
  unlockedPixels:  saved.unlockedPixels   ?? [],
  unlockedBlocks:  saved.unlockedBlocks   ?? [],
  // Persistent speed unlocks — bought with gold in the permanent Shop
  purchasedSpeeds: saved.purchasedSpeeds  ?? [],

  setGridStyle(key) {
    set({ activeGridStyle: key })
    persist({ ...get(), activeGridStyle: key })
  },

  unlockPixel(key) {
    const state = get()
    if (state.unlockedPixels.includes(key)) return
    const next = [...state.unlockedPixels, key]
    set({ unlockedPixels: next })
    persist({ ...state, unlockedPixels: next })
  },

  unlockBlock(key) {
    const state = get()
    if (state.unlockedBlocks.includes(key)) return
    const next = [...state.unlockedBlocks, key]
    set({ unlockedBlocks: next })
    persist({ ...state, unlockedBlocks: next })
  },

  purchaseSpeed(speed) {
    const state = get()
    if (state.purchasedSpeeds.includes(speed)) return
    const next = [...state.purchasedSpeeds, speed]
    set({ purchasedSpeeds: next })
    persist({ ...state, purchasedSpeeds: next })
  },

  isPixelUnlocked(key) {
    const ALWAYS = ['white', 'red', 'orange', 'yellow', 'green', 'blue', 'violet']
    return ALWAYS.includes(key) || get().unlockedPixels.includes(key)
  },

  isBlockUnlocked(key) {
    const ALWAYS = ['base', 'doubler', 'cross_amp', 'color_checker', 'greedy']
    return ALWAYS.includes(key) || get().unlockedBlocks.includes(key)
  },
}))
