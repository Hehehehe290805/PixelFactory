// ── PixelFactory Audio — pure Web Audio API synthesis, no external files ──────
// AudioContext is created lazily on the first call to respect browser autoplay policy.
// All functions are fire-and-forget; errors are silently swallowed so bad audio
// state never breaks gameplay.

let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  // Resume if the context was suspended by the browser before the first user gesture.
  // The current call may still be silent; the next one will succeed.
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Low-level: schedule one synthesized tone
function tone(freq, type, startTime, duration, peakGain = 0.25) {
  const c = getCtx()
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.connect(env)
  env.connect(c.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)
  env.gain.setValueAtTime(0, startTime)
  env.gain.linearRampToValueAtTime(peakGain, startTime + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
}

// ── Synergy activate ──────────────────────────────────────────────────────────
// Each synergy type has a distinct arpeggio pattern so the player
// learns to recognise which kind just triggered.
const SYNERGY_SOUNDS = {
  series_count: {
    // Warm ascending major arpeggio — the "classic" synergy chime
    notes: [523, 659, 784, 1047], gap: 0.08, gain: 0.22, type: 'sine',
  },
  exact_count: {
    // Bright bell tones — rare/specific design match
    notes: [659, 988, 1319], gap: 0.09, gain: 0.22, type: 'sine',
  },
  adjacency_pair: {
    // Two-tone ping — two things touching
    notes: [880, 1109], gap: 0.11, gain: 0.24, type: 'sine',
  },
  row_series: {
    // Four rising notes, triangle wave — linear/row feel
    notes: [440, 554, 659, 784], gap: 0.07, gain: 0.20, type: 'triangle',
  },
  long_range: {
    // Wide interval sweep — sense of distance
    notes: [330, 494, 740, 1109], gap: 0.13, gain: 0.22, type: 'sine',
  },
  core_radius: {
    // Five-note orbital resonance — layered, surrounding
    notes: [392, 494, 587, 784, 988], gap: 0.09, gain: 0.20, type: 'sine',
  },
  block_type_count: {
    // Short digital pulse sequence — mechanical/type-based
    notes: [440, 660, 880], gap: 0.07, gain: 0.18, type: 'square',
  },
}

export function playSynergyActivate(synergyType) {
  try {
    const c = getCtx()
    const now = c.currentTime
    const p = SYNERGY_SOUNDS[synergyType] ?? SYNERGY_SOUNDS.series_count
    p.notes.forEach((freq, i) => tone(freq, p.type, now + i * p.gap, 0.35, p.gain))
  } catch {}
}

// ── Block placed on grid ──────────────────────────────────────────────────────
// Soft double-thud — satisfying but unobtrusive
export function playBlockPlace() {
  try {
    const c = getCtx()
    const now = c.currentTime
    tone(160, 'sine', now,        0.10, 0.14)
    tone(110, 'sine', now + 0.03, 0.09, 0.10)
  } catch {}
}

// ── Design purchased (pre-buy or in-level shop) ───────────────────────────────
// Quick two-note "coin" — distinct from block place
export function playPurchase() {
  try {
    const c = getCtx()
    const now = c.currentTime
    tone(880,  'sine', now,        0.09, 0.18)
    tone(1175, 'sine', now + 0.07, 0.09, 0.15)
  } catch {}
}

// ── Level complete ────────────────────────────────────────────────────────────
// Short ascending fanfare
export function playLevelComplete() {
  try {
    const c = getCtx()
    const now = c.currentTime
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((freq, i) => tone(freq, 'sine', now + i * 0.10, 0.45, 0.20))
  } catch {}
}
