import { create } from 'zustand'

function loadState() {
  try { return JSON.parse(localStorage.getItem('pf_shop') ?? '{}') } catch { return {} }
}

function persist(state) {
  try {
    localStorage.setItem('pf_shop', JSON.stringify({
      activeGridStyle:     state.activeGridStyle,
      unlockedBlocks:      state.unlockedBlocks,
      purchasedSpeeds:     state.purchasedSpeeds,
      purchasedGridStyles: state.purchasedGridStyles,
      designRollCount:     state.designRollCount,
    }))
  } catch {}
}

const saved = loadState()

// Migrate: if there's already an active non-base style, treat it as purchased
const _savedGridStyles = saved.purchasedGridStyles ?? ['base']
const _activeStyle     = saved.activeGridStyle ?? 'base'
const _purchasedGridStyles = _activeStyle && !_savedGridStyles.includes(_activeStyle)
  ? [..._savedGridStyles, _activeStyle]
  : _savedGridStyles

export const useShopStore = create((set, get) => ({
  activeGridStyle: _activeStyle,

  // Block types bought in the permanent shop (gates shop-only designs of those types)
  // e.g. ['overflow', 'mirror', 'catalyst', 'void']
  unlockedBlocks:  saved.unlockedBlocks  ?? [],

  // Persistent speed unlocks — bought with gold in the permanent Shop
  purchasedSpeeds: saved.purchasedSpeeds ?? [],

  // Grid styles the player has purchased (base is always included)
  purchasedGridStyles: _purchasedGridStyles,

  // How many gold design rolls have been done (cost = min(100*(n+1), 1000))
  designRollCount: saved.designRollCount ?? 0,

  setGridStyle(key) {
    set({ activeGridStyle: key })
    persist({ ...get(), activeGridStyle: key })
  },

  ownGridStyle(key) {
    const state = get()
    if (state.purchasedGridStyles.includes(key)) return
    const next = [...state.purchasedGridStyles, key]
    set({ purchasedGridStyles: next })
    persist({ ...state, purchasedGridStyles: next })
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

  incrementDesignRollCount() {
    const state = get()
    const next = state.designRollCount + 1
    set({ designRollCount: next })
    persist({ ...state, designRollCount: next })
  },

  isBlockTypeUnlocked(key) {
    const ALWAYS = ['base', 'doubler', 'cross_amp', 'color_checker', 'greedy',
                    'amplifier', 'resonator', 'reactor', 'echo', 'prism',
                    'conductor', 'splitter', 'focus', 'cluster', 'forge']
    return ALWAYS.includes(key) || get().unlockedBlocks.includes(key)
  },
}))
