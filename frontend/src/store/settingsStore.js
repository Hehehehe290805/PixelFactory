import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  showTutorial: true,
  setShowTutorial: (v) => set({ showTutorial: v }),
}))
