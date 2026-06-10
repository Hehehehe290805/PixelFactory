import { create } from 'zustand'

function loadState() {
  try { return JSON.parse(localStorage.getItem('pf_shop') ?? '{}') } catch { return {} }
}

function persist(state) {
  try {
    localStorage.setItem('pf_shop', JSON.stringify({
      activeGridStyle:  state.activeGridStyle,
      unlockedBlocks:   state.unlockedBlocks,   // shop block-type unlocks (overflow, mirror, catalyst, void)
      purchasedSpeeds:  state.purchasedSpeeds,
    }))
  } catch {}
}

const saved = loadState()

export const useShopStore = create((set, get) => ({
  activeGridStyle: saved.activeGridStyle ?? 'base',

  // Block types bought in the permanent shop (gates shop-only designs of those types)
  // e.g. ['overflow', 'mirror', 'catalyst', 'void']
  unlockedBlocks:  saved.unlockedBlocks  ?? [],

  // Persistent speed unlocks — bought with gold in the permanent Shop
  purchasedSpeeds: saved.purchasedSpeeds ?? [],

  setGridStyle(key) {
    set({ activeGridStyle: key })
    persist({ ...get(), activeGridStyle: key })
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

  isBlockTypeUnlocked(key) {
    const ALWAYS = ['base', 'doubler', 'cross_amp', 'color_checker', 'greedy',
                    'amplifier', 'resonator', 'reactor', 'echo', 'prism',
                    'conductor', 'splitter', 'focus', 'cluster', 'forge']
    return ALWAYS.includes(key) || get().unlockedBlocks.includes(key)
  },
}))
