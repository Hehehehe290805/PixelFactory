# CLAUDE.md — PixelFactory

## Project Overview

**PixelFactory** is a browser-based idle/strategy game themed around parallel programming. Each block on the grid is an independent process producing pixels per second simultaneously — like parallel threads. Players design blocks (16×16 pixel canvases), place them on a 12×12 grid, and optimize their layout using synergies, set bonuses, block interactions, and wave-direction animations to hit pixel output targets.

Live at: **https://Hehehehe290805.github.io/PixelFactory/**  
GitHub: **https://github.com/Hehehehe290805/PixelFactory**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite — lives in `frontend/` |
| Styling | Tailwind CSS + custom classes in `index.css` |
| Backend / Auth / DB | Supabase (Auth, PostgreSQL) — Edge Functions in `backend/` |
| State Management | Zustand (`gameStore`, `userStore`, `shopStore`, `settingsStore`) |
| Animation | Framer Motion + CSS keyframes (`pixelWaveV/H/D`, `blockFillUp`) |
| Routing | React Router v6 |
| Deployment | GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`) |

---

## Repository Structure

```
PixelFactory/
├── .github/workflows/deploy.yml  ← Auto-deploys main → GitHub Pages
├── frontend/
│   ├── public/
│   │   ├── 404.html              # SPA redirect fix for GitHub Pages
│   │   └── favicon.svg           # 4-color pixel icon (red/blue/yellow/green)
│   ├── index.html                # Entry point; favicon href="/favicon.svg"
│   ├── vite.config.js            # base: '/PixelFactory/' (must match repo name)
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── Block.jsx              # Canvas render + 8-dir wave animation
│   │   │   │   ├── BlockEditor.jsx        # 16×16 painter, campaign-unlock-aware palette
│   │   │   │   ├── BlockSlot.jsx          # Grid cell; drag-drop + onCellClick
│   │   │   │   ├── Grid.jsx               # Radial wheel, move mode, wave dir picker
│   │   │   │   ├── InventoryPanel.jsx     # Bottom bar: horizontal block strip + pixels
│   │   │   │   ├── LevelHUD.jsx           # Progress bar, timer, star preview
│   │   │   │   ├── PixelCounter.jsx       # px/s, total, remaining stats
│   │   │   │   ├── ProductionEngine.jsx   # 100ms tick; calls computeTick
│   │   │   │   ├── RadialWheel.jsx        # Animated radial context menu
│   │   │   │   └── ShopSidebar.jsx        # Left sidebar pixel shop (Level + Endless)
│   │   │   ├── ui/
│   │   │   │   ├── AchievementToast.jsx
│   │   │   │   ├── InLevelShop.jsx        # (legacy popup — replaced by ShopSidebar)
│   │   │   │   ├── StarResult.jsx
│   │   │   │   ├── TemplatePicker.jsx     # Shown before editor when block is empty
│   │   │   │   ├── TemplateSaveModal.jsx
│   │   │   │   └── TutorialOverlay.jsx    # Top-right overlay, Level 1 only
│   │   │   └── auth/
│   │   │       ├── LoginModal.jsx
│   │   │       └── RegisterModal.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Main menu
│   │   │   ├── Campaign.jsx      # Level select with tier accordions
│   │   │   ├── Level.jsx         # Core gameplay (shop sidebar + grid + inventory)
│   │   │   ├── Endless.jsx       # Endless wave mode (same layout as Level)
│   │   │   ├── Profile.jsx       # Templates: official (locked until discovered) + player
│   │   │   ├── Shop.jsx          # Permanent shop: block unlocks, grid styles, pixels
│   │   │   └── Settings.jsx      # Volume, tutorial toggle, achievement list
│   │   ├── store/
│   │   │   ├── gameStore.js      # Grid, pixel inventory, blocks, cooldowns, waveDir
│   │   │   ├── userStore.js      # Auth, gold, campaign progress, achievements, templates
│   │   │   ├── shopStore.js      # Persistent shop unlocks (localStorage)
│   │   │   └── settingsStore.js  # Volume, tutorial toggle
│   │   ├── engine/
│   │   │   ├── productionEngine.js   # Full tick: base + sets + synergy + dominance + effects
│   │   │   ├── blockEffects.js       # All block effect functions + Lattice helper
│   │   │   ├── setDetector.js        # Detects all 15 pixel sets
│   │   │   ├── synergyEngine.js      # Set bonuses + synergy multipliers + radiation table
│   │   │   ├── dominanceChecker.js   # Color dominance map builder
│   │   │   ├── achievementEngine.js  # Achievement condition checks
│   │   │   └── levelConfig.js        # 10 hand-crafted + 190 generated levels
│   │   ├── lib/
│   │   │   ├── supabase.js           # Supabase client (VITE_ env vars only)
│   │   │   ├── constants.js          # All block types, pixel colors, grid styles, sets
│   │   │   ├── unlocks.js            # Campaign unlock milestones + useUnlocks() hook
│   │   │   ├── validate.js           # Input sanitization
│   │   │   └── officialTemplates.js  # 12 official prebuilt designs (one per standard set)
│   │   ├── hooks/
│   │   │   └── useGridCellSize.js    # Responsive cell size
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # CSS keyframes + utility classes
│   └── package.json
├── backend/functions/validate-user/  ← Supabase Edge Function
├── supabase/schema.sql               ← Run once in Supabase SQL Editor
└── README.md
```

---

## Core Game Loop

1. **Tick** (every 100ms): `ProductionEngine` calls `computeTick(grid, opts)` → updates `totalPixelsProduced`
2. **Level complete** when `totalPixelsProduced >= effectiveRequired`
3. **Effective required** = `config.requiredOutput × 0.95^colorCheckerReductions`
4. **Stars** = based on fraction of time limit used (tutorial always gives 1 star)

---

## Block State Shape (from `createBlock`)

```js
{
  id, type, pixelLayout, pixelCount,
  pauseTimer,           // ms remaining on move cooldown
  activeSet,            // detected PIXEL_SET name or null
  colorCheckerColor,    // assigned at placement for color_checker type
  colorCheckerTriggered,
  focusColor,           // assigned at placement for focus type
  reactorAge,           // ticks since placed/moved (reactor ramp)
  echoAge,              // ticks since placed/moved (echo ramp)
  overflowTimer,        // 0–149 cycle for overflow burst
  waveDir,              // 'up'|'down'|'left'|'right'|'up-left'|'up-right'|'down-left'|'down-right'
}
```

---

## Block Types (19 total)

### Base Set (always available from campaign level 1)
| Block | Effect |
|---|---|
| **Base** | `floor(effectivePixels / 37.5)` px/s |
| **Doubler** | ×2 if all 4 ortho neighbors < half its pixels |
| **Cross Amp** | Adds `floor(ownPx/10)` px/s to each diagonal neighbor |
| **Color Checker** | Assigned color; 50%+ match → −5% required output (one-time) |
| **Greedy** | On complete: `(myPx − Σneighbor.px) × 10` gold |

### Campaign-Unlockable Specials
| Block | Unlocks at | Effect |
|---|---|---|
| Amplifier | Level 8 | +8% per occupied neighbor (all 8) |
| Resonator | Level 10 | +50% if ortho neighbor is same type |
| Reactor | Level 10 | Ramps 50%→200% over 15 s; resets on move |
| Echo | Level 15 | +4% per 10 s stationary (max +80%) |
| Prism | Level 15 | +5% per unique non-white color (max +30%) |
| Conductor | Level 20 | Borrows best adjacent set bonus |
| Splitter | Level 20 | Gives ortho neighbors +20% of own rate |
| Focus | Level 25 | Assigned color; output ×1→×2 based on match |
| Cluster | Level 25 | +12% per occupied neighbor (excl. void) |
| Forge | Level 30 | On complete: +3 gold per pixel held |

### Shop-Only (require gold purchase)
| Block | Shop Cost | Effect |
|---|---|---|
| Overflow | 300g | 3× burst for 5 s every 10 s |
| Mirror | 250g | Copies best ortho neighbor rate |
| Catalyst | 350g | Synergy bonuses in same row ×1.5 |
| Void | 200g | 0 output; +15% to all 8 surrounding blocks |

---

## Pixel Colors (11 total)

### Standard (unlocked via campaign)
| Color | Unlocks at | Cost | Notes |
|---|---|---|---|
| White | Always | 1px | No dominance |
| Red, Blue | Level 1 | 3px each | Basic sets |
| Orange, Yellow | Level 2 | 3px each | |
| Green | Level 3 | 3px | |
| Violet | Level 5 | 3px | |

### Shop-Only
| Color | Cost | Notes |
|---|---|---|
| Rainbow | 1000g unlock, then 1px | Wildcard for sets |
| Silver | 2px | outputMult 2×, neutral for sets |
| Gold | 8px | +5 gold per pixel on complete |
| Neon | 5px | outputMult 1.5× |

---

## Pixel Sets (15 total)

All detected by `setDetector.js` / `buildSetMap`. Radiation rules in `synergyEngine.js`.

| Set | Colors | Min Px | Own Bonus | Radiation |
|---|---|---|---|---|
| PRIMARY | Red, Blue, Yellow | 40 | +20% | — |
| MIDNIGHT | Blue, Violet | 35 | +15% | Ortho +10% |
| PHILIPPINES | Red, Blue, Yellow, White | 45 | +10% | Ortho +5% |
| GRASS | Yellow, Green | 30 | +12% | Diag +8% |
| SUNSET | Red, Yellow, Orange | 38 | +18% | — |
| OCEAN | Blue, Green | 32 | +18% | Ortho +8% |
| FIRE | Red, Orange | 28 | +20% | Diag +10% |
| ROYAL | Violet, Blue, Red | 38 | +24% | Ortho +12% |
| EMBER | Red, Orange, Violet | 42 | +28% | Diag +12% |
| TROPICS | Orange, Green, Blue | 42 | +26% | All-8 +8% |
| CORAL | Red, Orange, Green | 36 | +22% | Ortho +6% |
| SILVER_MIST | Silver, White | 40 | +22% | Ortho +6% |
| NEON_RUSH | Neon, Yellow, Green | 35 | +20% | Ortho +10% |
| AURORA | Green, Blue, Violet | 38 | +25% | All-8 +12% |
| SUNRISE | Orange, Yellow | 45 | +26% | Diag +10% |

**Synergy:** Two same-set blocks orthogonally adjacent → +15% each (×1.5 in catalyst's row; +25% with Synergy+ grid style).

---

## Grid Styles (12 total, one active at a time)

| Style | Cost | Effect |
|---|---|---|
| Base | Free | — |
| Gold Rush | 500g | +15% gold per level |
| Overclock | 800g | +10% output |
| Efficiency | 600g | +20% time, −10% required |
| Bargain | 700g | 20% cheaper in-level |
| Quantum | 1000g | 2× burst every 30 s for 5 s |
| Neural | 700g | Color Checker cuts −8% (not −5%) |
| Industrial | 600g | +3% per 10 placed blocks |
| Synergy+ | 900g | Synergy bonus +25% (not +15%) |
| Cascade | 750g | Rows 6–11: +4% per row below row 5 |
| Overcharge | 850g | +25% output |
| Lattice | 650g | +35% for blocks with exactly 4 ortho neighbors |

---

## Production Engine Logic

```js
// productionEngine.js runs every 100ms (10 ticks/s)
function computeTick(grid, { activeGridStyle, gridTick }) {
  setMap       = buildSetMap(grid)        // 15-set detection
  dominanceMap = buildDominanceMap(grid)  // >50% non-white color → +25% to all 8 neighbors
  catalystRows = buildCatalystRows(grid)  // rows with active catalyst blocks

  rateMap = first pass: base × set bonus × synergy (synergy scaled by catalyst + synergyMult)

  second pass per block:
    rate += getCrossAmplifierBonus + getSplitterBonus (flat adds)
    rate *= Doubler × Amplifier × Resonator × Reactor × Conductor × Prism
           × Overflow × Echo × Focus × Cluster × VoidBonus
    if dominanceMap: rate *= 1.25
    if mirror: rate = best neighbor's rateMap value
    rate *= grid-style multipliers (outputMult, industrial, quantum, cascade, lattice)

  return { totalThisTick, totalPxPerSec, setMap }
}
```

Base rate formula: `effectivePixels / 37.5` px/s (25 white pixels ≈ 0.667 px/s)

---

## Wave Animation (Block.jsx)

Each active block shows a directional "pixel surge" animation using `mix-blend-mode: screen`.

- `block.waveDir` (default `'up'`) controls the animation direction (8 options)
- CSS keyframes: `pixelWaveV` (vertical), `pixelWaveH` (horizontal), `pixelWaveD` (diagonal)
- `transformOrigin` set per direction; animation duration = `37.5 / pixelCount` seconds
- Cycle speed correlates with production rate (faster = more productive block)

Change direction: click a placed block on the grid → "〰 Wave" option → 8-direction sub-wheel

---

## Radial Context Wheel (Grid.jsx)

**Empty cell click:** Shows all inventory blocks in a radial. Select one to place it.  
**Occupied cell click:** 5-option wheel — Paint, Move, Add (swap), Wave (direction sub-wheel), Remove.  
**Move mode:** After selecting Move, empty cells pulse; click one to complete move.  
**Escape:** Dismisses wheel.

---

## Template System

- **Official templates** (12): one per standard set, show locked `?` in Profile until set discovered
- **Player templates**: saved when discovering a new set in-level (prompted to save)
- **Template picker**: shown when placing an empty block — select a template or "Start Blank"
- Templates deducted from pixel inventory on apply; can't apply if not enough pixels
- `gameStore.applyTemplate(blockId, pixelLayout)` performs the deduction + layout apply

---

## Campaign Unlock Progression (`lib/unlocks.js`)

- **Always**: Base block, White pixel
- **Level 1 complete**: Red, Blue
- **Level 2**: Orange, Yellow
- **Level 3**: Green; Doubler block
- **Level 4**: Cross Amp block
- **Level 5**: Violet; Color Checker, Greedy blocks
- **Level 8**: Amplifier
- **Level 10**: Resonator, Reactor
- **Level 15**: Echo, Prism
- **Level 20**: Conductor, Splitter
- **Level 25**: Focus, Cluster
- **Level 30**: Forge

Shop-only (never campaign-unlocked): Overflow, Mirror, Catalyst, Void; Rainbow, Silver, Gold, Neon

---

## Level System

### Hand-Crafted (1–10)
| Level | Required | Time | Introduces |
|---|---|---|---|
| 1 (Tutorial) | 25 px | 120s | Base block + 25 white pixels |
| 2 | 50 px | 150s | Color pixels |
| 3 | 100 px | 180s | Doubler |
| 4 | 200 px | 200s | Cross Amp |
| 5 | 400 px | 220s | Color Checker |
| 6 | 700 px | 240s | Greedy |
| 7 | 1,200 px | 260s | Sets (GRASS hint) |
| 8 | 2,000 px | 280s | Synergy |
| 9 | 3,500 px | 300s | Dominance |
| 10 | 5,500 px | 330s | All mechanics |

### Generated (11–200)
- Required: `floor(5500 × (level/10)^2.3)`
- Time: 330s + 1.45s/level, capped 600s
- Block mix shifts toward Doubler/CA/Greedy in higher tiers

### Scoring
| Performance | Stars | Gold |
|---|---|---|
| ≤30% time used | 3 ★ | 100g |
| 31–70% | 2 ★ | 70g |
| >70% | 1 ★ | 50g |
| Tutorial | always 1 ★ | 50g |

---

## Endless Mode

- Starts at 20 px; each wave: `requiredOutput × 1.6`
- Grid/inventory persists between waves
- No time limit; stopwatch runs
- Leaderboard synced to Supabase for logged-in users
- Alt-tab pauses the stopwatch (visibilitychange)
- Endpoint: **Stop** (all hearts depleted — hearts system planned)

---

## Key Implementation Rules

1. **Progress bar never decreases**: `totalPixelsProduced` is append-only.
2. **Pixel inventory is authoritative**: always use store actions (`paintPixel`, `clearBlock`, `fillBlock`, `applyTemplate`).
3. **Block move resets**: `reactorAge` and `echoAge` reset to 0 on move.
4. **Color dominance**: >50% of block's filled pixels (white counts in denominator).
5. **Set detection**: "only" sets reject any color outside allowed list; white/silver neutral; rainbow/gold/plasma wildcard.
6. **Campaign unlocks** via `useUnlocks()` hook; shop-only items bypass campaign check.
7. **Supabase only for**: auth, gold, campaign_progress, achievements, endless_scores, templates.
8. **Never commit env files**: `frontend/.env` and `backend/.env` are gitignored.

---

## Deployment

- **Source**: GitHub Actions (`main` push → build → deploy-pages)
- **URL**: `https://Hehehehe290805.github.io/PixelFactory/`
- **Base path**: `/PixelFactory/` (case-sensitive, must match repo name)
- **Secrets needed**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in GitHub repo secrets
- **After deleting gh-pages branch**: set Pages source to "GitHub Actions" in repo Settings → Pages

---

## Environment Variables

| File | Contains | Committed? |
|---|---|---|
| `frontend/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Never |
| `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY` | Never |

---

## Planned Features (not yet implemented)

- **Template sharing**: users upload templates to a shared gallery (needs Supabase `shared_templates` table)
- **Endless hearts + challenges**: 3 hearts, mini-challenge every 2m30s, major challenge every 10m
- **Blueprint matching**: tiered pixel art targets for passive boosts (4 phases: Base → Binary)
- **Endless final stats**: total pixels generated, longest survival, high score tracking
- **Profile page template creation**: build new templates from scratch in the Profile page
