// ── PixelFactory Audio — pure Web Audio API, no external files ────────────────
// AudioContext created lazily on first call to satisfy browser autoplay policy.
// All errors are silently swallowed; bad audio state never breaks gameplay.

// ── Context & master gains ────────────────────────────────────────────────────

let ctx          = null
let _sfxGain     = null
let _musicGain   = null

function getCtx() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch { return null }
}

function getSfxGain() {
  const c = getCtx()
  if (!c) return null
  if (!_sfxGain) {
    _sfxGain = c.createGain()
    _sfxGain.gain.value = 0.70
    _sfxGain.connect(c.destination)
  }
  return _sfxGain
}

function getMusicGain() {
  const c = getCtx()
  if (!c) return null
  if (!_musicGain) {
    // chain: music master → lowpass → compressor → destination
    const comp = c.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.knee.value       = 10
    comp.ratio.value      = 4
    comp.attack.value     = 0.05
    comp.release.value    = 0.25
    comp.connect(c.destination)

    const filter = c.createBiquadFilter()
    filter.type            = 'lowpass'
    filter.frequency.value = 1800
    filter.Q.value         = 0.5
    filter.connect(comp)

    _musicGain = c.createGain()
    _musicGain.gain.value = 0.55
    _musicGain.connect(filter)
  }
  return _musicGain
}

// ── Volume control (called from Settings & AudioSettingsSync) ─────────────────

export function setMusicVolume(vol) {
  const g = getMusicGain()
  if (g) g.gain.value = Math.max(0, Math.min(1, vol))
}

export function setSfxVolume(vol) {
  const g = getSfxGain()
  if (g) g.gain.value = Math.max(0, Math.min(1, vol))
}

// ── SFX low-level helper ──────────────────────────────────────────────────────

function sfxTone(freq, type, startTime, duration, peakGain = 0.25) {
  const c = getCtx()
  const dest = getSfxGain()
  if (!c || !dest) return
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  osc.connect(env)
  env.connect(dest)
  env.gain.setValueAtTime(0, startTime)
  env.gain.linearRampToValueAtTime(peakGain, startTime + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
}

// ── Sound effects ─────────────────────────────────────────────────────────────

// Synergy activate — distinct arpeggio per type so the player learns each pattern
const SYNERGY_SOUNDS = {
  series_count:     { notes: [523, 659, 784, 1047], gap: 0.08, gain: 0.20, type: 'sine' },
  exact_count:      { notes: [659, 988, 1319],       gap: 0.09, gain: 0.20, type: 'sine' },
  adjacency_pair:   { notes: [880, 1109],             gap: 0.11, gain: 0.22, type: 'sine' },
  row_series:       { notes: [440, 554, 659, 784],    gap: 0.07, gain: 0.18, type: 'triangle' },
  long_range:       { notes: [330, 494, 740, 1109],   gap: 0.13, gain: 0.20, type: 'sine' },
  core_radius:      { notes: [392, 494, 587, 784, 988], gap: 0.09, gain: 0.18, type: 'sine' },
  block_type_count: { notes: [440, 660, 880],          gap: 0.07, gain: 0.16, type: 'square' },
}

export function playSynergyActivate(synergyType) {
  try {
    const c = getCtx(); if (!c) return
    const now = c.currentTime
    const p = SYNERGY_SOUNDS[synergyType] ?? SYNERGY_SOUNDS.series_count
    p.notes.forEach((freq, i) => sfxTone(freq, p.type, now + i * p.gap, 0.32, p.gain))
  } catch {}
}

export function playBlockPlace() {
  try {
    const c = getCtx(); if (!c) return
    const now = c.currentTime
    sfxTone(160, 'sine', now,        0.10, 0.13)
    sfxTone(110, 'sine', now + 0.03, 0.09, 0.09)
  } catch {}
}

export function playPurchase() {
  try {
    const c = getCtx(); if (!c) return
    const now = c.currentTime
    sfxTone(880,  'sine', now,        0.09, 0.16)
    sfxTone(1175, 'sine', now + 0.07, 0.09, 0.13)
  } catch {}
}

// Level complete — grand ascending fanfare + final chord resolution
export function playLevelComplete() {
  try {
    const c = getCtx(); if (!c) return
    const now = c.currentTime
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => sfxTone(f, 'sine', now + i * 0.10, 0.50, 0.20))
    // Chord resolution at the end
    ;[523, 659, 784, 1047].forEach(f => sfxTone(f, 'sine', now + 0.58, 0.90, 0.13))
  } catch {}
}

// Achievement unlocked — triumphant rising chime, shorter than level complete
export function playAchievementUnlock() {
  try {
    const c = getCtx(); if (!c) return
    const now = c.currentTime
    ;[659, 784, 988, 1319].forEach((f, i) => sfxTone(f, 'sine', now + i * 0.07, 0.35, 0.18))
  } catch {}
}

// Design / unlock discovery — magical shimmer
export function playDesignUnlock() {
  try {
    const c = getCtx(); if (!c) return
    const now = c.currentTime
    ;[523, 659, 784, 988, 1175, 988, 1319].forEach((f, i) => sfxTone(f, 'sine', now + i * 0.06, 0.30, 0.15))
  } catch {}
}

// ── Ambient music engine ──────────────────────────────────────────────────────
// Each track has a drone layer (sustained oscillators) + an arpeggio layer
// (sequenced short notes). Both route through the track's own gain node so
// that tracks can fade in/out cleanly when switching.

// Note frequencies
const N = {
  F2:87.31, A2:110.00, Bb2:116.54, B2:123.47,
  C3:130.81, Db3:138.59, D3:146.83, Eb3:155.56, E3:164.81, F3:174.61, Fs3:185.00, G3:196.00, Ab3:207.65, A3:220.00, Bb3:233.08, B3:246.94,
  C4:261.63, Cs4:277.18, D4:293.66, Eb4:311.13, E4:329.63, F4:349.23, Fs4:369.99, G4:392.00, Ab4:415.30, A4:440.00, Bb4:466.16, B4:493.88,
  C5:523.25, Cs5:554.37, D5:587.33, Eb5:622.25, E5:659.25, F5:698.46, Fs5:739.99, G5:783.99, Ab5:830.61, A5:880.00,
}

const TRACKS = {
  // ── Level 1-10: C major, 72 BPM, sine — calm, tutorial feel ────────────────
  intro: {
    drones: [
      { freq: N.C3, gain: 0.048, type: 'sine' },
      { freq: N.G3, gain: 0.038, type: 'sine' },
      { freq: N.C4, gain: 0.028, type: 'sine' },
    ],
    arpNotes: [N.C4, N.E4, N.G4, N.C5, N.G4, N.E4, N.C4, N.G3],
    noteDur:  0.833,   // 72 BPM
    arpType:  'sine',
    arpGain:  0.065,
  },
  // ── Level 11-30: G major, 88 BPM, triangle — warm, hopeful ─────────────────
  apprentice: {
    drones: [
      { freq: N.G3, gain: 0.048, type: 'sine' },
      { freq: N.B3, gain: 0.038, type: 'sine' },
      { freq: N.D4, gain: 0.030, type: 'sine' },
    ],
    arpNotes: [N.G4, N.B4, N.D5, N.G5, N.D5, N.B4, N.G4, N.A4],
    noteDur:  0.682,   // 88 BPM
    arpType:  'triangle',
    arpGain:  0.058,
  },
  // ── Level 31-60: D minor, 96 BPM, triangle — focused, rhythmic ─────────────
  craftsman: {
    drones: [
      { freq: N.D3, gain: 0.048, type: 'sine' },
      { freq: N.F3, gain: 0.038, type: 'sine' },
      { freq: N.A3, gain: 0.030, type: 'sine' },
    ],
    arpNotes: [N.D4, N.F4, N.A4, N.C5, N.A4, N.F4, N.D4, N.E4],
    noteDur:  0.625,   // 96 BPM
    arpType:  'triangle',
    arpGain:  0.055,
  },
  // ── Level 61-100: A minor, 108 BPM, triangle — energetic, driving ───────────
  expert: {
    drones: [
      { freq: N.A2, gain: 0.050, type: 'sine' },
      { freq: N.E3, gain: 0.040, type: 'sine' },
      { freq: N.C3, gain: 0.030, type: 'sine' },
    ],
    arpNotes: [N.A4, N.C5, N.E5, N.G5, N.E5, N.C5, N.A4, N.B4],
    noteDur:  0.556,   // 108 BPM
    arpType:  'triangle',
    arpGain:  0.055,
  },
  // ── Level 101-150: E minor, 118 BPM, triangle — intense, tense ──────────────
  master: {
    drones: [
      { freq: N.E3, gain: 0.050, type: 'sine' },
      { freq: N.G3, gain: 0.040, type: 'sine' },
      { freq: N.B3, gain: 0.032, type: 'sine' },
    ],
    arpNotes: [N.E4, N.G4, N.B4, N.D5, N.B4, N.G4, N.E4, N.Fs4],
    noteDur:  0.508,   // 118 BPM
    arpType:  'triangle',
    arpGain:  0.052,
  },
  // ── Level 151-200: B minor, 132 BPM, sawtooth — epic, driving ───────────────
  grandmaster: {
    drones: [
      { freq: N.B2,  gain: 0.050, type: 'sine' },
      { freq: N.Fs3, gain: 0.038, type: 'sine' },
      { freq: N.D3,  gain: 0.032, type: 'sine' },
    ],
    arpNotes: [N.B4, N.D5, N.Fs5, N.A5, N.Fs5, N.D5, N.B4, N.Cs5],
    noteDur:  0.454,   // 132 BPM
    arpType:  'sawtooth',
    arpGain:  0.042,
  },
  // ── Menu / lobby: A major, 68 BPM, sine — bright, inviting ─────────────────
  menu: {
    drones: [
      { freq: N.A2,  gain: 0.040, type: 'sine' },
      { freq: N.E3,  gain: 0.038, type: 'sine' },
      { freq: N.A3,  gain: 0.030, type: 'sine' },
    ],
    arpNotes: [N.A4, N.Cs5, N.E5, N.A5, N.E5, N.Cs5, N.A4, N.B4],
    noteDur:  0.882,   // 68 BPM
    arpType:  'sine',
    arpGain:  0.052,
  },
  // ── Endless: F lydian, 76 BPM, sine — meditative, flowing ──────────────────
  endless: {
    drones: [
      { freq: N.F2,  gain: 0.038, type: 'sine' },
      { freq: N.C3,  gain: 0.048, type: 'sine' },
      { freq: N.F3,  gain: 0.040, type: 'sine' },
      { freq: N.C4,  gain: 0.028, type: 'sine' },
    ],
    arpNotes: [N.F4, N.G4, N.A4, N.B4, N.C5, N.B4, N.A4, N.G4],
    noteDur:  0.789,   // 76 BPM (B4 = lydian #4)
    arpType:  'sine',
    arpGain:  0.055,
  },
}

class MusicPlayer {
  constructor(def) {
    this.def        = def
    this.masterGain = null
    this.droneNodes = []   // oscillators that must be explicitly stopped
    this.arpIndex   = 0
    this.nextNote   = 0
    this.schedTimer = null
    this.active     = false
  }

  start() {
    if (this.active) return
    const c = getCtx()
    const mg = getMusicGain()
    if (!c || !mg) return
    this.active = true
    const now = c.currentTime

    // Per-player gain (allows independent fade)
    this.masterGain = c.createGain()
    this.masterGain.gain.setValueAtTime(0, now)
    this.masterGain.gain.linearRampToValueAtTime(1.0, now + 2.5)
    this.masterGain.connect(mg)

    // Drone oscillators — run indefinitely
    for (const d of this.def.drones) {
      const osc  = c.createOscillator()
      const gn   = c.createGain()
      gn.gain.value = d.gain

      // Subtle LFO vibrato
      const lfo  = c.createOscillator()
      const lfoG = c.createGain()
      lfo.type = 'sine'
      lfo.frequency.value = 0.05 + Math.random() * 0.07
      lfoG.gain.value = d.freq * 0.0025
      lfo.connect(lfoG)
      lfoG.connect(osc.frequency)

      osc.type = d.type ?? 'sine'
      osc.frequency.value = d.freq
      osc.detune.value = (Math.random() - 0.5) * 3
      osc.connect(gn)
      gn.connect(this.masterGain)

      lfo.start(now)
      osc.start(now)
      this.droneNodes.push(osc, lfo)
    }

    // Start arpeggio scheduler
    this.nextNote = now + 0.6
    this.arpIndex = 0
    this._sched()
  }

  _sched() {
    if (!this.active) return
    const c = getCtx()
    if (!c) return
    const lookAhead = 0.28

    while (this.nextNote < c.currentTime + lookAhead) {
      const notes = this.def.arpNotes
      const freq  = notes[this.arpIndex % notes.length]
      const dur   = this.def.noteDur
      const t     = this.nextNote

      const osc = c.createOscillator()
      const env = c.createGain()
      osc.type = this.def.arpType ?? 'sine'
      osc.frequency.value = freq
      osc.detune.value = (Math.random() - 0.5) * 5  // tiny random detune for organic feel
      osc.connect(env)
      env.connect(this.masterGain)

      const peak = this.def.arpGain ?? 0.06
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(peak, t + 0.018)
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.7)
      osc.start(t)
      osc.stop(t + dur * 1.7 + 0.05)

      this.nextNote += dur
      this.arpIndex++
    }

    this.schedTimer = setTimeout(() => this._sched(), 100)
  }

  stop(fadeTime = 2.0) {
    this.active = false
    clearTimeout(this.schedTimer)
    if (!this.masterGain) return

    const c = getCtx()
    if (!c) return
    const now = c.currentTime

    try {
      this.masterGain.gain.cancelScheduledValues(now)
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
      this.masterGain.gain.linearRampToValueAtTime(0, now + fadeTime)
    } catch {}

    const stopAt = now + fadeTime + 0.05
    for (const n of this.droneNodes) { try { n.stop(stopAt) } catch {} }
    this.droneNodes = []

    setTimeout(() => { try { this.masterGain?.disconnect(); this.masterGain = null } catch {} },
      (fadeTime + 0.15) * 1000)
  }
}

// ── Public music API ──────────────────────────────────────────────────────────

let _activeTrackId  = null
let _musicEnabled   = true
let _currentPlayer  = null

export function startMusic(trackId) {
  _activeTrackId = trackId
  if (_currentPlayer) { _currentPlayer.stop(1.2); _currentPlayer = null }
  if (!_musicEnabled) return
  const def = TRACKS[trackId]
  if (!def) return
  _currentPlayer = new MusicPlayer(def)
  _currentPlayer.start()
}

export function stopMusic(fade = 2.0) {
  _activeTrackId = null
  if (_currentPlayer) { _currentPlayer.stop(fade); _currentPlayer = null }
}

// Called when musicEnabled toggle changes in Settings
export function applyMusicEnabled(enabled) {
  _musicEnabled = enabled
  if (!enabled) {
    if (_currentPlayer) { _currentPlayer.stop(0.6); _currentPlayer = null }
  } else if (_activeTrackId) {
    // Restart the track that should have been playing
    const def = TRACKS[_activeTrackId]
    if (!def) return
    _currentPlayer = new MusicPlayer(def)
    _currentPlayer.start()
  }
}

// Maps campaign level number to a track id
export function getLevelTrack(levelNum) {
  if (levelNum <= 10)  return 'intro'
  if (levelNum <= 30)  return 'apprentice'
  if (levelNum <= 60)  return 'craftsman'
  if (levelNum <= 100) return 'expert'
  if (levelNum <= 150) return 'master'
  return 'grandmaster'
}
