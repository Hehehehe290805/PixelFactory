// Pre-designed 16x16 pixel layouts for each set.
// Each layout is a 16x16 array of color keys (matching PIXEL_COLORS) or null.

function grid(fn) {
  return Array.from({ length: 16 }, (_, r) => Array.from({ length: 16 }, (_, c) => fn(r, c)))
}

// ── MIDNIGHT (blue + violet) — spiral galaxy ──────────────────────────────────
const MIDNIGHT_LAYOUT = grid((r, c) => {
  const dr = r - 7.5, dc = c - 7.5
  const d = Math.sqrt(dr * dr + dc * dc)
  const a = Math.atan2(dc, dr)
  if (d > 7.5) return null
  if (d < 1.5) return 'violet'
  // Two-arm spiral: spiral value cycles with angle + distance
  const spiral = ((a / Math.PI + d / 4) * 2 + 4) % 2
  if (spiral < 0.8) return 'blue'
  if (spiral < 1.0) return 'violet'
  if (spiral < 1.8) return 'blue'
  return 'violet'
})

// ── PRIMARY (red + blue + yellow) — color wheel ───────────────────────────────
const PRIMARY_LAYOUT = grid((r, c) => {
  const dr = r - 7.5, dc = c - 7.5
  const d = Math.sqrt(dr * dr + dc * dc)
  if (d > 7.4) return null
  const angle = ((Math.atan2(dc, dr) * 180 / Math.PI) + 360) % 360
  if (angle < 120) return 'red'
  if (angle < 240) return 'yellow'
  return 'blue'
})

// ── GRASS (yellow + green) — rolling meadow with dithered hills ───────────────
const GRASS_LAYOUT = grid((r, c) => {
  const hillLine = 8 + Math.round(2.5 * Math.sin(c * Math.PI / 7))
  if (r > hillLine + 1) return 'green'
  if (r === hillLine + 1) return c % 3 === 0 ? 'yellow' : 'green'
  if (r === hillLine)     return c % 2 === 0 ? 'green'  : 'yellow'
  if (r < hillLine - 1 && r > 2) return 'yellow'
  return null
})

// ── SUNSET (red + orange + yellow) — gradient sky with sun ───────────────────
const SUNSET_LAYOUT = grid((r, c) => {
  // Sun disk at bottom center
  const dy = r - 13, dx = c - 7.5
  if (Math.sqrt(dy * dy + dx * dx) < 3.2) return 'yellow'
  if (r < 5) return 'red'
  if (r < 9) return 'orange'
  return 'orange'
})

// ── OCEAN (blue + green) — ocean waves crashing on shore ─────────────────────
const OCEAN_LAYOUT = grid((r, c) => {
  const wave = 7 + Math.round(2.5 * Math.sin(c * Math.PI / 4.5))
  if (r < wave - 1) return null
  if (r === wave - 1) return c % 4 < 2 ? 'blue' : null   // foam caps
  if (r <= wave + 1) return 'blue'                         // wave body
  if (r <= wave + 4) return (r + c) % 2 === 0 ? 'blue' : 'green'  // shallow water
  return 'green'                                            // seabed
})

// ── FIRE (red + orange) — flame rising from base ─────────────────────────────
const FIRE_LAYOUT = grid((r, c) => {
  // Flame: wide at bottom (r=15), narrow tip at top (r=0)
  const height   = r
  const maxHalf  = height * 0.48 + 0.4
  const dx       = Math.abs(c - 7.5)
  if (dx > maxHalf) return null
  // Inner core (orange) vs outer edge (red)
  return (dx < maxHalf * 0.5 || height < 4) ? 'orange' : 'red'
})

// ── ROYAL (violet + blue + red) — diagonal plaid ─────────────────────────────
const ROYAL_LAYOUT = grid((r, c) => {
  const d = (r * 2 + c) % 9
  if (d < 3) return 'violet'
  if (d < 6) return 'blue'
  return 'red'
})

// ── EMBER (red + orange + violet) — radial glow with spokes ──────────────────
const EMBER_LAYOUT = grid((r, c) => {
  const dr = r - 7.5, dc = c - 7.5
  const d = Math.sqrt(dr * dr + dc * dc)
  const a = Math.atan2(dc, dr)
  const spoke = Math.abs(Math.cos(a * 6))   // 12-spoke starburst
  if (d < 1.5) return 'orange'              // hot core
  if (d < 3.5) return d < 2.5 ? 'orange' : 'red'
  if (d < 7 && spoke > 0.3) return d < 5.5 ? 'red' : 'violet'
  if (d < 8.5 && spoke > 0.7) return 'violet'  // far tips
  return null
})

// ── TROPICS (orange + green + blue) — sky · jungle · beach ───────────────────
const TROPICS_LAYOUT = grid((r, c) => {
  if (r < 5) return (r + c) % 4 === 0 ? null : 'blue'      // sky (slight texture)
  if (r > 11) return (r + c) % 3 === 0 ? 'green' : 'orange' // beach
  // Jungle middle: wavy canopy dithering
  const wave = Math.round(Math.sin(c * Math.PI / 4) * 1.5)
  return (r + wave) % 3 === 0 ? 'blue' : 'green'
})

// ── CORAL (red + orange + green) — reef stalks with branches ─────────────────
const CORAL_LAYOUT = grid((r, c) => {
  const stalks = [3, 8, 12]
  // Sandy/grassy seabed at bottom
  if (r > 13) return 'green'
  if (r > 11) return c % 4 < 2 ? 'green' : null
  // Coral stalks: 3 wide columns
  if (stalks.some(s => Math.abs(c - s) <= 1 && r > 1)) {
    return r < 5 ? 'red' : 'orange'
  }
  // Branch nodes: horizontal arms every 4 rows
  if (r % 4 === 0 && r < 12 && stalks.some(s => Math.abs(c - s) >= 2 && Math.abs(c - s) <= 3)) {
    return 'red'
  }
  return null
})

// ── AURORA (green + blue + violet) — northern lights ─────────────────────────
const AURORA_LAYOUT = grid((r, c) => {
  // Wave offsets shift the color bands left/right as rows progress downward
  const shift = Math.round(2 * Math.sin(r * Math.PI / 6) + 1.5 * Math.sin(r * Math.PI / 10))
  const waveC = ((c + shift + 16) % 16)
  if (waveC < 5)  return 'green'
  if (waveC < 10) return r % 3 === 2 ? 'violet' : 'blue'
  if (waveC < 14) return 'violet'
  return 'green'  // right edge back to green
})

// ── SUNRISE (orange + yellow) — dawn layers with radiant core ─────────────────
const SUNRISE_LAYOUT = grid((r, c) => {
  const dy = r - 15   // negative above row 15, most negative at top
  const dx = c - 7.5
  const distFromBase = Math.sqrt(dy * dy * 0.6 + dx * dx)
  // Core sunrise glow at bottom center
  if (distFromBase < 3)  return 'yellow'
  if (distFromBase < 6)  return 'orange'
  if (distFromBase < 10) return 'yellow'
  if (distFromBase < 13) return 'orange'
  return null
})

// ── Export ────────────────────────────────────────────────────────────────────

export const OFFICIAL_TEMPLATES = [
  // Original sets
  { id: 'official_midnight', name: 'Midnight',    set_type: 'MIDNIGHT', is_official: true, pixel_layout: MIDNIGHT_LAYOUT },
  { id: 'official_primary',  name: 'Primary',     set_type: 'PRIMARY',  is_official: true, pixel_layout: PRIMARY_LAYOUT  },
  { id: 'official_grass',    name: 'Meadow',      set_type: 'GRASS',    is_official: true, pixel_layout: GRASS_LAYOUT    },
  { id: 'official_sunset',   name: 'Sunset',      set_type: 'SUNSET',   is_official: true, pixel_layout: SUNSET_LAYOUT   },

  // Standard-color sets
  { id: 'official_ocean',    name: 'Ocean',       set_type: 'OCEAN',    is_official: true, pixel_layout: OCEAN_LAYOUT    },
  { id: 'official_fire',     name: 'Flame',       set_type: 'FIRE',     is_official: true, pixel_layout: FIRE_LAYOUT     },
  { id: 'official_royal',    name: 'Royal Plaid', set_type: 'ROYAL',    is_official: true, pixel_layout: ROYAL_LAYOUT    },
  { id: 'official_ember',    name: 'Ember',       set_type: 'EMBER',    is_official: true, pixel_layout: EMBER_LAYOUT    },
  { id: 'official_tropics',  name: 'Tropics',     set_type: 'TROPICS',  is_official: true, pixel_layout: TROPICS_LAYOUT  },
  { id: 'official_coral',    name: 'Coral Reef',  set_type: 'CORAL',    is_official: true, pixel_layout: CORAL_LAYOUT    },

  // Special-color sets
  { id: 'official_aurora',   name: 'Aurora',      set_type: 'AURORA',   is_official: true, pixel_layout: AURORA_LAYOUT   },
  { id: 'official_sunrise',  name: 'Sunrise',     set_type: 'SUNRISE',  is_official: true, pixel_layout: SUNRISE_LAYOUT  },
]
