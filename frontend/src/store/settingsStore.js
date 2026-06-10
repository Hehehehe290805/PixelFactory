import { create } from 'zustand'

const DEFAULTS = {
  showTutorial: true,
  showLearning: true,
  musicEnabled: true,
  sfxEnabled:   true,
  musicVolume:  0.55,
  sfxVolume:    0.70,
}

function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('pf_settings') ?? '{}') } }
  catch { return { ...DEFAULTS } }
}

function persist(s) {
  try {
    localStorage.setItem('pf_settings', JSON.stringify({
      showTutorial: s.showTutorial,
      showLearning: s.showLearning,
      musicEnabled: s.musicEnabled,
      sfxEnabled:   s.sfxEnabled,
      musicVolume:  s.musicVolume,
      sfxVolume:    s.sfxVolume,
    }))
  } catch {}
}

export const useSettingsStore = create((set, get) => ({
  ...loadSettings(),

  setShowTutorial: (v) => { const s = { ...get(), showTutorial: v }; set(s); persist(s) },
  setShowLearning: (v) => { const s = { ...get(), showLearning:  v }; set(s); persist(s) },
  setMusicEnabled: (v) => { const s = { ...get(), musicEnabled:  v }; set(s); persist(s) },
  setSfxEnabled:   (v) => { const s = { ...get(), sfxEnabled:    v }; set(s); persist(s) },
  setMusicVolume:  (v) => { const s = { ...get(), musicVolume:   v }; set(s); persist(s) },
  setSfxVolume:    (v) => { const s = { ...get(), sfxVolume:     v }; set(s); persist(s) },
}))
