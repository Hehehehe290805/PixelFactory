import { create } from 'zustand'

// Persists in localStorage so purchases survive page refresh without requiring Supabase.
function loadState() {
  try { return JSON.parse(localStorage.getItem('pf_shop') ?? '{}') } catch { return {} }
}

function saveState(state) {
  try { localStorage.setItem('pf_shop', JSON.stringify(state)) } catch {}
}

const defaults = {
  activeGridStyle: 'base',
  unlockedPixels:  [],   // e.g. ['rainbow', 'silver', 'gold', 'neon']
  unlockedBlocks:  [],   // e.g. ['overflow', 'mirror', 'amplifier', ...]
}

export const useShopStore = create((set, get) => ({
  ...defaults,
  ...loadState(),

  setGridStyle(key) {
    const next = { ...get(), activeGridStyle: key }
    saveState({ activeGridStyle: key, unlockedPixels: next.unlockedPixels, unlockedBlocks: next.unlockedBlocks })
    set({ activeGridStyle: key })
  },

  unlockPixel(key) {
    const state = get()
    if (state.unlockedPixels.includes(key)) return
    const next = [...state.unlockedPixels, key]
    saveState({ activeGridStyle: state.activeGridStyle, unlockedPixels: next, unlockedBlocks: state.unlockedBlocks })
    set({ unlockedPixels: next })
  },

  unlockBlock(key) {
    const state = get()
    if (state.unlockedBlocks.includes(key)) return
    const next = [...state.unlockedBlocks, key]
    saveState({ activeGridStyle: state.activeGridStyle, unlockedPixels: state.unlockedPixels, unlockedBlocks: next })
    set({ unlockedBlocks: next })
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
