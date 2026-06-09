# CLAUDE.md — PixelFactory

## Project Overview

**PixelFactory** is a browser-based idle/strategy game that demonstrates parallel programming concepts through gameplay. Each block on the grid independently produces pixels (output) simultaneously — representing parallel processes running concurrently. Players design blocks, place them on a grid, and optimize their layout using synergies, set bonuses, and block interactions to hit pixel output targets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) — lives in `frontend/` |
| Styling | Tailwind CSS + custom pixel-accent components |
| Backend / Auth / DB | Supabase (Auth, PostgreSQL) — Edge Functions in `backend/` |
| State Management | Zustand |
| Animation | Framer Motion |
| Routing | React Router v6 |

### Why This Stack
- Supabase handles auth, cloud saves, leaderboards, and achievements with minimal backend code
- Zustand is lightweight and perfect for game state (grid state, pixel counts, timers)
- Framer Motion handles the block fill-up and pulse animations cleanly
- React + Vite for fast dev iteration

---

## Repository Structure

```
PixelFactory/                    ← repo root
├── frontend/                    ← Vite + React app (run: npm run dev)
│   ├── public/
│   │   └── 404.html             # GitHub Pages SPA redirect fix
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── Grid.jsx              # 12x12 grid, drag-and-drop
│   │   │   │   ├── Block.jsx             # Block canvas + fill/pulse animation
│   │   │   │   ├── BlockEditor.jsx       # 16x16 pixel painting, inventory-aware
│   │   │   │   ├── BlockSlot.jsx         # Single grid cell (drag target)
│   │   │   │   ├── PixelCounter.jsx      # px/s, total, remaining stats
│   │   │   │   ├── ProductionEngine.jsx  # Game tick interval component
│   │   │   │   └── LevelHUD.jsx          # Timer, progress bar, stars
│   │   │   ├── ui/
│   │   │   │   ├── AchievementToast.jsx
│   │   │   │   └── StarResult.jsx
│   │   │   └── auth/
│   │   │       ├── LoginModal.jsx        # Supabase email/password login
│   │   │       └── RegisterModal.jsx     # Validated: username/email/password
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Main menu
│   │   │   ├── Campaign.jsx      # Level select (stars shown, locked levels)
│   │   │   ├── Level.jsx         # Core gameplay: grid + HUD + editor
│   │   │   ├── Endless.jsx       # Endless wave mode
│   │   │   ├── Shop.jsx          # Shop (UI complete, inventory wiring Phase 5+)
│   │   │   ├── Profile.jsx       # Block Templates
│   │   │   └── Settings.jsx      # Volume, tutorial toggle
│   │   ├── store/
│   │   │   ├── gameStore.js      # Grid, pixel inventory, paint/erase, cooldowns
│   │   │   ├── userStore.js      # Auth, gold, campaign progress, achievements
│   │   │   └── settingsStore.js  # Volume, tutorial toggle
│   │   ├── engine/
│   │   │   ├── productionEngine.js   # Full tick: base + sets + synergy + dominance + effects
│   │   │   ├── blockEffects.js       # Doubler, CrossAmp, Greedy calculations
│   │   │   ├── setDetector.js        # Detects all 5 pixel sets
│   │   │   ├── synergyEngine.js      # Set bonuses + synergy multipliers
│   │   │   ├── dominanceChecker.js   # Color dominance map builder
│   │   │   ├── achievementEngine.js  # Achievement condition checks
│   │   │   └── levelConfig.js        # All 10 level definitions
│   │   ├── lib/
│   │   │   ├── supabase.js           # Supabase client (VITE_ env vars only)
│   │   │   ├── constants.js          # Pixel colors, block types, sets, grid size
│   │   │   ├── validate.js           # Input sanitization, password/email regex
│   │   │   └── officialTemplates.js  # Prebuilt pixel designs for each set
│   │   ├── hooks/
│   │   │   └── useGridCellSize.js    # Responsive cell size by viewport
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env                     # NEVER commit — VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
│   ├── package.json
│   └── vite.config.js           # base: '/pixelfactory/'
├── backend/                     ← Supabase Edge Functions (server-side only)
│   ├── functions/
│   │   └── validate-user/       # Username uniqueness check using service role key
│   ├── .env                     # NEVER commit — SUPABASE_SERVICE_ROLE_KEY + BREVO_API_KEY
│   └── README.md
├── supabase/
│   └── schema.sql               # Run once in Supabase SQL Editor
├── .gitignore                   # Blocks frontend/.env, backend/.env, node_modules, dist
└── CLAUDE.md
```

---

## Core Concepts

### The Parallel Programming Metaphor
Each block on the 12x12 grid is an **independent process** producing pixels per second simultaneously. All blocks run their production loop in parallel (via a shared game tick), exactly like parallel threads contributing to a shared output. The player's job is to optimize the layout — just like a developer optimizes parallel workloads.

### Game Tick
The production engine runs on a **100ms interval** (10 ticks/second). Each tick, every placed block calculates its current output rate (base + modifiers from adjacency, sets, synergies, dominance) and adds to the running pixel total. The progress bar reflects the running total and **never decreases** even if pixels are spent in-level.

---

## Grid

- **Main Grid:** 12 × 12 slots
- **Block Canvas:** Each block is a **16 × 16 pixel design grid**
- Blocks can be placed, moved, or removed at any time during a run
- Moving a block pauses its production for **5 seconds** (cooldown); partial progress state is retained
- Removing a block returns the block and all pixels inside it to the player's inventory

---

## Pixel Colors

| Color | Cost (in-level) | Notes |
|---|---|---|
| White | 1 px | No dominance effect. Cheap filler. |
| Red | 3 px | Participates in sets |
| Orange | 3 px | Participates in sets |
| Yellow | 3 px | Participates in sets |
| Green | 3 px | Participates in sets |
| Blue | 3 px | Participates in sets |
| Violet | 3 px | Participates in sets |
| Rainbow | 3 px (if unlocked) | Counts as any color; purchased once in Shop, then available at white price in-level |

**Color Dominance Rule:** If a single non-white color makes up >50% of a block's pixels, all 8 surrounding blocks get a **+25% production boost**.
White dominance has **no effect**.

---

## Block Types

### Base Block
- **Cost:** 50 gold (shop) / 20 px (in-level)
- **Base Output:** Scales with pixel count. Formula: `Math.floor(pixelCount * 0.8)` px/s
- No special effect

### Doubler Block
- **Cost:** 150 gold / 60 px
- **Effect:** Doubles its own output **if ALL 4 orthogonal neighbors each have fewer than half the Doubler's pixel count**

### Cross Amplifier Block
- **Cost:** 120 gold / 50 px
- **Effect:** Adds `Math.floor(ownPixelCount / 10)` px/s to each of its 4 diagonal neighbors

### Color Checker Block
- **Cost:** 100 gold / 40 px
- **Effect:** Assigned a random color at placement. If ≥50% of its pixels match that color, reduces the level's **remaining required output** by 5% (one-time trigger)

### Greedy Block
- **Cost:** 200 gold / 80 px
- **Effect:** On level completion: `(greedyPixelCount - sum of all 8 neighbors' pixel counts) × 10` gold bonus

### Overflow Block *(unlockable)*
- **Cost:** 300 gold / 100 px
- **Effect:** Cycles a 15s burst loop: charges for 10s, then produces **3×** for 5s (via `overflowTimer` 0–149)

### Mirror Block *(unlockable)*
- **Cost:** 250 gold / 90 px
- **Effect:** Copies the output rate of its highest-producing orthogonal neighbor (uses pre-effect rateMap)

### Catalyst Block *(unlockable)*
- **Cost:** 350 gold / 120 px
- **Effect:** All synergy bonuses for blocks in the **same row** are multiplied by **×1.5**

### Void Block *(unlockable)*
- **Cost:** 200 gold / 70 px
- **Effect:** Produces 0 px itself; gives **+15%** to each of its 8 surrounding blocks

### Amplifier Block *(unlockable)*
- **Cost:** 180 gold / 70 px
- **Effect:** +8% output per occupied neighbor cell (all 8); max +64% with full surroundings

### Resonator Block *(unlockable)*
- **Cost:** 220 gold / 85 px
- **Effect:** +50% output if any orthogonal neighbor is also a Resonator

### Reactor Block *(unlockable)*
- **Cost:** 400 gold / 140 px
- **Effect:** Starts at 50% output; ramps to 200% max over 15s. Resets on move

### Conductor Block *(unlockable)*
- **Cost:** 300 gold / 110 px
- **Effect:** Borrows the highest set output bonus from any adjacent block

### Prism Block *(unlockable)*
- **Cost:** 250 gold / 90 px
- **Effect:** +5% output per unique non-white/silver color in its pixels (max +30%)

### Echo Block *(unlockable)*
- **Cost:** 180 gold / 70 px
- **Effect:** Gains +4% output for each 10s it remains stationary (max +80% at ~3.5 min); resets on move

### Splitter Block *(unlockable)*
- **Cost:** 280 gold / 100 px
- **Effect:** Gives each orthogonal neighbor a flat +20% of this block's base rate as a px/s bonus

### Focus Block *(unlockable)*
- **Cost:** 160 gold / 65 px
- **Effect:** Assigned a random color at placement; output scales from ×1 (0% match) to ×2 (100% match)

### Cluster Block *(unlockable)*
- **Cost:** 230 gold / 85 px
- **Effect:** +12% output per occupied neighbor (all 8, excluding void blocks); max +96%

### Forge Block *(unlockable)*
- **Cost:** 320 gold / 120 px
- **Effect:** Produces 0 px/s; on level complete: **+3 gold per pixel held**

---

## Pixel Sets (Title Blocks)

### Original Sets
| Set Name | Colors Required | Min Pixels | Own Bonus | Neighbor Effect |
|---|---|---|---|---|
| PRIMARY | Red, Blue, Yellow only | 40 | +20% output | — |
| MIDNIGHT | Blue and Violet only | 35 | +15% output | Orthogonal +10% |
| PHILIPPINES | Red, Blue, Yellow, White | 45 | +10% output | Orthogonal +5% |
| GRASS | Yellow and Green only | 30 | +12% output | Diagonal +8% |
| SUNSET | Red, Yellow, Orange only | 38 | +18% output | — |

### Special-Pixel Sets *(require unlockable pixels)*
| Set Name | Colors Required | Min Pixels | Own Bonus | Neighbor Effect |
|---|---|---|---|---|
| SILVER_MIST | Silver and White only | 40 | +22% output | Orthogonal +6% |
| NEON_RUSH | Neon, Yellow, Green only | 35 | +20% output | Orthogonal +10% |
| AURORA | Green, Blue, Violet only | 38 | +25% output | All-8 +12% |
| SUNRISE | Orange and Yellow only | 45 | +26% output | Diagonal +10% |

### Standard-Color Sets *(white, red, orange, yellow, green, blue, violet)*
| Set Name | Colors Required | Min Pixels | Own Bonus | Neighbor Effect |
|---|---|---|---|---|
| OCEAN | Blue and Green only | 32 | +18% output | Orthogonal +8% |
| FIRE | Red and Orange only | 28 | +20% output | Diagonal +10% |
| ROYAL | Violet, Blue, Red only | 38 | +24% output | Orthogonal +12% |
| EMBER | Red, Orange, Violet only | 42 | +28% output | Diagonal +12% |
| TROPICS | Orange, Green, Blue only | 42 | +26% output | All-8 +8% |
| CORAL | Red, Orange, Green only | 36 | +22% output | Orthogonal +6% |

**Synergy Bonus:** Two orthogonally adjacent blocks with the **same set** each get an additional **+15%**.

---

## Shop Items

### Grid Styles (Permanent, one active at a time)
| Style | Cost | Effect |
|---|---|---|
| Base Grid | Free | No bonus |
| Gold Rush | 500 gold | +15% gold gain after each level |
| Overclock | 800 gold | +10% pixel output across all blocks |
| Efficiency | 600 gold | +20% time limit, −10% required output |
| Bargain | 700 gold | Blocks and pixels 20% cheaper in-level |
| Quantum | 1000 gold | Every 30s all blocks produce 2× for 5s |
| Neural | 700 gold | Color Checker trigger reduces −8% required (not −5%) |
| Industrial | 600 gold | +3% output per 10 placed blocks on the grid |
| Synergy+ | 900 gold | Same-set adjacency synergy bonus is +25% (not +15%) |
| Cascade | 750 gold | Rows 6–11 produce more: +4% per row below row 5 (up to +24%) |
| Overcharge | 850 gold | +25% output for all blocks |
| Lattice | 650 gold | Blocks with exactly 4 occupied orthogonal neighbors get +35% |

### Special Blocks (unlock in Shop, buy in-level)
See Block Types section above for full list of unlockable blocks.

### Other
| Item | Cost | Notes |
|---|---|---|
| Rainbow Pixel (unlock) | 1000 gold | Unlocks rainbow; in-level cost = white price |
| Template Slot +1 | 200 gold | Base: 5 slots |
| Pixel Pack (10/25/50/100) | 30/70/130/240 gold | Colored pixels of choice |

---

## Block Templates

- Players pre-design blocks (16×16) and save as named templates
- In-level: purchase a template block from in-level shop (pays pixel cost for all pixels inside)
- On set discovery in-level → prompt to save as template
- Prebuilt "Official" templates (one per set) included, cannot be edited
- Base template slots: 5 (expandable via Shop)

---

## Level System (Campaign)

### Scoring
| Performance | Stars | Gold Reward |
|---|---|---|
| ≤30% of time limit | 3 stars | 100 gold |
| 31–70% of time limit | 2 stars | 70 gold |
| >70% of time limit | 1 star | 50 gold |

### Level Definitions
| Level | Required Output | Time | Notes |
|---|---|---|---|
| 1 (Tutorial) | 500 px | 120s | 1 Base Block, 20 white pixels |
| 2 | 1,200 px | 150s | Intro color pixels |
| 3 | 2,500 px | 180s | Doubler introduced |
| 4 | 4,000 px | 200s | Cross Amplifier introduced |
| 5 | 7,000 px | 220s | Color Checker introduced |
| 6 | 12,000 px | 240s | Greedy Block introduced |
| 7 | 20,000 px | 260s | First set puzzle (GRASS hint) |
| 8 | 35,000 px | 280s | Synergy introduced |
| 9 | 60,000 px | 300s | Dominance mechanic highlighted |
| 10 | 100,000 px | 330s | All mechanics in play |

---

## Endless Mode

- No time limit; starts at 500 px required output
- Each wave: `requiredOutput = previousOutput × 1.6`
- Grid persists between waves; in-level shop available between waves
- Highscore = highest wave reached, synced to Supabase leaderboard

---

## Level System — 200 Levels

| Tier | Levels | Theme |
|---|---|---|
| Tutorial | 1–10 | Hand-crafted, introduce every mechanic |
| Apprentice | 11–30 | Spark → Core |
| Craftsman | 31–60 | Circuit → Queue |
| Expert | 61–100 | Thread → Unroll |
| Master | 101–150 | Kernel → Nsight |
| Grandmaster | 151–200 | Exascale → Threshold |

Levels 11–200 are generated programmatically in `levelConfig.js` with:
- **Required output:** `100k × (level/10)^2.3` — smooth power curve
- **Time limit:** 330s at level 10, +1.45s/level, capped at 600s
- **Blocks:** Scale from 6 to 36, type mix shifts toward Doubler/CA/Greedy in later tiers
- **Pixels:** `50 + level × 8` total, split evenly across 7 colors, capped at 2500

Campaign page shows tier accordions (click to expand) with a mini progress bar per tier.

## Achievements (36 total)

### Campaign Progress
| Key | Name | Condition |
|---|---|---|
| `first_level` | Factory Floor | Complete Level 1 |
| `level_25` | Getting Serious | Complete Level 25 |
| `level_50` | Halfway There | Complete Level 50 |
| `level_100` | Century Run | Complete Level 100 |
| `level_150` | Deep Factory | Complete Level 150 |
| `level_200` | Grand Master | Complete all 200 levels |

### Stars
| Key | Name | Condition |
|---|---|---|
| `three_star_any` | Perfectionist | 3 stars on any level |
| `three_star_10` | Flawless Ten | 3 stars on first 10 levels |
| `three_star_50` | Stellar Run | 3 stars on 50 levels |
| `three_star_all` | Pixel Perfect | 3 stars on all 200 levels |

### Sets
`discover_midnight`, `discover_primary`, `discover_grass`, `discover_sunset`, `discover_phils`, `discover_all_sets`, `synergy_double`

### Production
`dominate_color`, `dominate_full`, `px_100k`, `px_1m`, `px_10m`, `rate_1000`, `rate_10000`

### Gold & Blocks
`greedy_10k`, `greedy_100k`, `doubler_trigger`, `full_grid`

### Endless
`endless_wave_10`, `endless_wave_25`, `endless_wave_50`, `endless_wave_100`

### Shop & Templates
`rainbow_unlock`, `templates_maxed`, `save_template`

---

## Production Engine Logic

```js
// Runs every 100ms (10 ticks/second) — frontend/src/engine/productionEngine.js
function computeTick(grid) {
  const setMap       = buildSetMap(grid)         // setDetector.js
  const dominanceMap = buildDominanceMap(grid)   // dominanceChecker.js

  for each [row, col] in grid {
    let rate = floor(block.pixelCount * 0.8)     // base px/s

    rate *= getSetBonusMultiplier(row, col, setMap)   // own set + neighbor radiation
    rate *= getSynergyMultiplier(row, col, setMap)    // +15% if matching adjacent set
    rate += getCrossAmplifierBonus(row, col, grid)    // flat px/s from diagonal CA blocks
    rate *= getDoublerMultiplier(block, row, col, grid) // ×2 if all neighbors < half
    if dominanceMap.has(row, col): rate *= 1.25       // +25% from dominant neighbor

    total += rate / 10   // per 100ms tick
  }
}
```

---

## Key Implementation Notes

1. **Never decrease the progress bar.** `totalPixelsProduced` is append-only. Spending pixels tracked in separate `pixelsSpent`.

2. **Pixel inventory is authoritative.** All painting/erasing/fill/clear goes through `gameStore` actions (`paintPixel`, `clearBlock`, `fillBlock`) which check and update `pixelInventory`. Never directly mutate `pixelLayout`.

3. **Block move cooldown.** `placeBlock` on an occupied slot is rejected. `moveBlock` sets `pauseTimer = 5000`. `tickCooldowns(TICK_MS)` called every game tick.

4. **Color dominance check.** `buildDominanceMap` runs every tick. A block is dominant if one non-white color > 50% of ALL its filled pixels (including white in denominator).

5. **Set detection.** `buildSetMap` runs every tick. "Only" sets (PRIMARY, MIDNIGHT, GRASS, SUNSET) reject any pixel outside the allowed color list. PHILIPPINES allows white explicitly.

6. **Color Checker trigger.** Fires in `paintPixel`/`fillBlock` when ≥50% of the block's pixels match `colorCheckerColor`. Sets `colorCheckerTriggered = true` and increments `colorCheckerReductions` in gameStore. Level.jsx reads reductions to compute `effectiveRequired`.

7. **Greedy gold.** Calculated via `totalGreedyBonus(grid)` on level complete. Added to user gold via `addGold()`.

8. **Achievement checks.** `achievementEngine.js` exports pure check functions. Called from Level.jsx (on complete), Endless.jsx (on wave), and ProductionEngine.jsx (on set discovery). Unlock via `userStore.unlockAchievement(key)`.

9. **Supabase only used for:** auth, profile gold, campaign_progress, achievements, endless_scores. All simulation is client-side.

10. **Env vars:** Frontend uses only `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (in `frontend/.env`). Service role key lives only in `backend/.env`, never in frontend code.

---

## Environment Variables

| File | Committed | Contains |
|---|---|---|
| `frontend/.env` | Never | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `backend/.env` | Never | `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY` |

---

## Database Schema (Supabase)

See `supabase/schema.sql` — run once in Supabase SQL Editor.

Tables: `profiles`, `inventory`, `block_templates`, `campaign_progress`, `endless_scores`, `achievements`.
All tables have Row Level Security enabled. Users can only access their own rows.

---

## Deployment — GitHub Pages

1. `frontend/vite.config.js` has `base: '/pixelfactory/'`
2. `frontend/public/404.html` handles SPA redirect
3. `frontend/src/main.jsx` restores path from `?p=` param
4. Deploy: `cd frontend && npm run deploy` (pushes `dist/` to `gh-pages` branch)
5. Or use GitHub Actions (auto-deploy on push to `main`) — add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repo secrets
6. Supabase Auth → URL Configuration → Site URL: `https://YOUR_USERNAME.github.io/pixelfactory`

---

## Development Phases

### Phase 1 — Core Loop ✅
- [x] Vite + React + Supabase setup (`frontend/` folder)
- [x] Auth (register, login) — input sanitized, password regex enforced
- [x] 12×12 grid with drag-and-drop block placement
- [x] 16×16 block pixel editor with pixel inventory
- [x] Production engine (game tick, base output)
- [x] Level 1 (tutorial) fully playable
- [x] Progress bar + HUD stats

### Phase 2 — Block Types & Effects ✅
- [x] All 5 block types: Base, Doubler, Cross Amplifier, Color Checker, Greedy
- [x] Pixel inventory — spend on paint, refund on erase/clear/remove block
- [x] Block move cooldown (5s pause timer)
- [x] Block fill overlay + glow pulse animation

### Phase 3 — Sets & Synergies ✅
- [x] Set detector — all 5 sets (PRIMARY, MIDNIGHT, PHILIPPINES, GRASS, SUNSET)
- [x] Synergy engine — set bonuses + neighbor radiations + +15% same-set adjacency
- [x] Color dominance checker — +25% to all 8 neighbors
- [x] Set badge dot shown on Block component

### Phase 4 — Campaign & Levels ✅
- [x] All 10 levels configured in `levelConfig.js`
- [x] Star rating system (live preview + final result)
- [x] Gold reward calculation (base + Greedy bonus)
- [x] Level select with star display and unlock gating

### Phase 5 — Shop & Templates ✅
- [x] Shop page UI with all items, pricing, purchase toasts, owned state
- [x] Block Templates page with pixel preview and official templates
- [x] Pixel inventory shown in-level (left panel)
- [x] Color Checker info banner in editor
- [x] In-level shop — buy pixel packs (mixed or per-color) with gold during a level
- [x] Template save prompt — shown when a new set is detected on a placed block

### Phase 6 — Endless & Leaderboard ✅
- [x] Endless mode — wave system (×1.6 scaling), stopwatch
- [x] Grid persists between waves; between-wave overlay with Shop button
- [x] Pixel/block counts scale with wave number
- [x] Supabase leaderboard submission on each wave complete (logged-in users)

### Phase 7 — Polish ✅
- [x] Achievement engine (`achievementEngine.js`) — 12 achievements, pure check functions
- [x] Achievement toast — global queue in userStore, auto-dismiss, click to skip
- [x] Settings page — SFX/music volume sliders, tutorial toggle, achievement list
- [x] Responsive grid — `useGridCellSize` hook: 48px → 36px → 28px by viewport width
- [x] Official prebuilt templates — one per set (MIDNIGHT, PRIMARY, PHILIPPINES, GRASS, SUNSET)
- [x] Tutorial overlay — step-by-step guidance for Level 1, advances automatically on player actions
- [x] Modern thick UI — `.btn`, `.card`, `.input` CSS classes; border-2, font-black, chunky progress bars
- [x] In-level shop accessible via "Shop" link in inventory panel
- [x] Template save prompt on new set discovery mid-level
- [x] Supabase leaderboard + template save wired to DB
