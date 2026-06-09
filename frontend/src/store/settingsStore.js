import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  sfxVolume: 0.7,
  musicVolume: 0.5,
  showTutorial: true,
  setSfxVolume: (v) => set({ sfxVolume: v }),
  setMusicVolume: (v) => set({ musicVolume: v }),
  setShowTutorial: (v) => set({ showTutorial: v }),
}))
