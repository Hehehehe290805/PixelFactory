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
│   │   │   │   ├── BlockEditor.jsx        # 16×16 painter; eraser (⌫); data-tutorial attrs
│   │   │   │   ├── BlockSlot.jsx          # Grid cell; drag-drop + onCellClick
│   │   │   │   ├── Grid.jsx               # Radial wheel, move mode, wave dir picker
│   │   │   │   ├── InventoryPanel.jsx     # Expandable bottom bar (▲ toggle); overlays grid
│   │   │   │   ├── LevelHUD.jsx           # Progress bar, timer, ⏸ pause, speed selector
│   │   │   │   ├── PixelCounter.jsx       # px/s + floating +N animation, progress, totals
│   │   │   │   ├── ProductionEngine.jsx   # 100ms tick; respects gameSpeed + gamePaused
│   │   │   │   ├── RadialWheel.jsx        # Animated radial context menu
│   │   │   │   └── ShopSidebar.jsx        # In-level shop; uses produced pixels (not gold)
│   │   │   ├── ui/
│   │   │   │   ├── AchievementToast.jsx
│   │   │   │   ├── InLevelShop.jsx        # (legacy popup — replaced by ShopSidebar)
│   │   │   │   ├── StarResult.jsx         # No stars on tutorial; green ✓ checkmark instead
│   │   │   │   ├── TemplatePicker.jsx     # Shown before editor when block is empty
│   │   │   │   ├── TemplateSaveModal.jsx
│   │   │   │   └── TutorialOverlay.jsx    # Spotlight tutorial (clip-path grayout + pulsing ring)
│   │   │   └── auth/
│   │   │       ├── LoginModal.jsx
│   │   │       └── RegisterModal.jsx      # Shows email confirmation message when needed
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Main menu; "Account" button when logged in
│   │   │   ├── Campaign.jsx        # Level select with tier accordions
│   │   │   ├── Level.jsx           # Core gameplay; h-screen; pause modal; editor at z-50
│   │   │   ├── Endless.jsx         # Endless wave mode; h-screen; pause modal
│   │   │   ├── Profile.jsx         # Templates: official (locked until discovered) + player
│   │   │   ├── Shop.jsx            # Permanent shop: block unlocks, grid styles (uses gold)
│   │   │   ├── Settings.jsx        # Tutorial toggle; achievements (hidden for guests)
│   │   │   └── AccountSettings.jsx # /account: update username/email/password, forgot pw, delete
│   │   ├── store/
│   │   │   ├── gameStore.js      # Grid, inventory, cooldowns, waveDir, gameSpeed, gamePaused,
│   │   │   │                     #   pixelsSpentInShop, purchasedSpeeds
│   │   │   ├── userStore.js      # Auth, gold, progress, achievements, CRUD, requestAccountDeletion
│   │   │   ├── shopStore.js      # Persistent shop unlocks (localStorage)
│   │   │   └── settingsStore.js  # showTutorial only (audio removed — not implemented)
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
│   │   ├── App.jsx                   # Routes; includes /account
│   │   ├── main.jsx
│   │   └── index.css                 # CSS keyframes + utility classes
│   └── package.json
├── backend/functions/validate-user/  ← Supabase Edge Function
├── supabase/schema.sql               ← Re-run in Supabase SQL Editor after any change
└── README.md
```

---

## Core Game Loop

1. **Tick** (every 100ms): `ProductionEngine` calls `computeTick(grid, opts)` → scaled by `gameSpeed` → updates `totalPixelsProduced`
2. **Tick skipped** when `gamePaused === true`
3. **Level complete** when `totalPixelsProduced >= effectiveRequired`
4. **Effective required** = `config.requiredOutput × 0.95^colorCheckerReductions`
5. **Stars** = based on fraction of time limit used (tutorial always gives 1 star, shown as ✓ not ★)

---

## gameStore State Shape

```js
{
  // Grid & blocks
  grid,                  // 12×12 array of block | null
  inventory,             // blocks not yet placed
  pixelInventory,        // { [colorKey]: count } — used for painting

  // Production
  totalPixelsProduced,   // append-only; never decremented; used for win condition
  pixelsSpent,           // pixels spent on painting (paint/fill/template)
  pixelsSpentInShop,     // pixels spent in the in-level shop this level
  currentPxPerSecond,    // live rate (already × gameSpeed)

  // Level state
  levelActive, levelComplete,
  selectedBlockId,
  colorCheckerReductions,

  // Game speed / pause
  gameSpeed,             // 0.5 | 1 | 2 | 5 | 10  (default 1)
  gamePaused,            // boolean — stops timer + production tick
  purchasedSpeeds,       // Set of speed values bought in shop this level

  // Actions (key ones)
  buyShopItem(cost),     // deducts from pixelsSpentInShop budget; returns bool
  purchaseSpeed(speed),  // adds speed to purchasedSpeeds
  setGameSpeed(speed),
  setPaused(bool),
  startLevel(), resetLevel(), completeLevel(),
}
```

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

### Shop-Only (require gold purchase from permanent shop)
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

### Shop-Only (permanent shop, cost in gold)
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

## In-Level Shop (ShopSidebar)

**Currency: produced pixels** — the shop balance is `totalPixelsProduced − pixelsSpentInShop`.  
Spending shop pixels does **not** affect the win condition (`totalPixelsProduced` is append-only).

| Item | Cost |
|---|---|
| 10 mixed pixels | 20 px |
| 25 mixed pixels | 45 px |
| 50 mixed pixels | 85 px |
| 100 mixed pixels | 160 px |
| 10 of one color | 30 px |
| Speed 0.5× | 50 px |
| Speed 2× | 100 px |
| Speed 5× | 250 px |
| Speed 10× | 600 px |

Once a speed is purchased, buttons `0.5× 1× 2× 5× 10×` appear in the HUD (only purchased speeds + always-on `1×`).

---

## Production Engine Logic

```js
// ProductionEngine.jsx — interval runs every TICK_MS (100ms)
// Skips entirely when gamePaused === true

const { totalThisTick, totalPxPerSec, setMap } = computeTick(grid, {
  activeGridStyle, gridTick,
})

// Scale output by gameSpeed (0.5, 1, 2, 5, or 10)
const scaled = totalThisTick * gameSpeed
addPixels(scaled)             // totalPixelsProduced += scaled
setPxPerSecond(totalPxPerSec * gameSpeed)

// Achievement checks only fire when user is logged in
if (userRef.current) { /* checkSetDiscovery, checkDominance, etc. */ }
```

```js
// productionEngine.js computeTick — pure function, no side effects
function computeTick(grid, { activeGridStyle, gridTick }) {
  setMap       = buildSetMap(grid)
  dominanceMap = buildDominanceMap(grid)
  catalystRows = buildCatalystRows(grid)
  // first pass: base × set × synergy (fills rateMap)
  // second pass: + flat adds (CA, Splitter), × all multipliers, grid-style mods
  return { totalThisTick, totalPxPerSec, setMap }
}
```

Base rate formula: `effectivePixels / 37.5` px/s

---

## Pause System

- ⏸ button in `LevelHUD` calls `setPaused(true)` from gameStore.
- `ProductionEngine` skips the tick when `gamePaused === true`.
- Timer countdown in `Level.jsx` / stopwatch in `Endless.jsx` also pauses.
- Pause modal (z-70) shows **Continue**, **Settings**, **Exit Level**.

---

## Wave Animation (Block.jsx)

Each active block shows a directional "pixel surge" animation using `mix-blend-mode: screen`.

- `block.waveDir` (default `'up'`) controls the animation direction (8 options)
- CSS keyframes: `pixelWaveV` (vertical), `pixelWaveH` (horizontal), `pixelWaveD` (diagonal)
- `transformOrigin` set per direction; animation duration = `37.5 / pixelCount` seconds

Change direction: click a placed block on the grid → "〰 Wave" option → 8-direction sub-wheel

---

## Radial Context Wheel (Grid.jsx)

**Empty cell click:** Shows all inventory blocks in a radial. Select one to place it.  
**Occupied cell click:** 5-option wheel — Paint, Move, Add (swap), Wave (direction sub-wheel), Remove.  
**Move mode:** After selecting Move, empty cells pulse; click one to complete move.

---

## Inventory Panel (InventoryPanel.jsx)

- **Collapsed** (default): 44px handle bar at the bottom. Shows block count + pixel color chips.
- **Expanded**: slides up 264px, overlays the bottom of the grid. Auto-filling block grid, scrollable.
- Dragging a block from the panel auto-collapses it so the grid drop target is visible.
- The handle bar has `data-tutorial="inventory"` for the tutorial spotlight.

---

## Tutorial System (TutorialOverlay.jsx)

Level 1 only. 7 steps, rendered as a fixed card (top-right, z-60).

**Spotlight grayout**: A dark backdrop div at z-40 uses a CSS `clip-path` polygon with a rectangular "hole" cut out at the current step's target element (`data-tutorial` attribute). The hole lets pointer events pass through to the target. All other UI is blocked.

**z-index scheme during tutorial:**
- Game UI: z-0 to z-20
- Tutorial backdrop: z-40 (clip-path hole at target)
- Pulsing ring around hole: z-41
- BlockEditor overlay: z-50 (above the backdrop, always interactive)
- Tutorial card: z-60
- StarResult: z-50 (never shown simultaneously with tutorial card)
- Pause modal: z-70

**Step targets** (`data-tutorial` attributes):
- `inventory` — InventoryPanel handle button
- `editor-canvas` — BlockEditor 16×16 grid div
- `editor-done` — BlockEditor "Done" button
- `grid` — Grid center area wrapper in Level.jsx

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

### Scoring
| Performance | Stars | Gold |
|---|---|---|
| ≤30% time used | 3 ★ | 100g |
| 31–70% | 2 ★ | 70g |
| >70% | 1 ★ | 50g |
| Tutorial | always 1 ★ (shown as ✓) | 50g |

---

## Endless Mode

- Starts at 20 px; each wave: `requiredOutput × 1.6`
- No time limit; stopwatch pauses on tab-hide and on `gamePaused`
- Leaderboard synced to Supabase for logged-in users
- Pause modal available

---

## Auth & User CRUD

### Registration (`userStore.register`)
- Username is passed via `supabase.auth.signUp({ options: { data: { username } } })`
- A DB trigger (`handle_new_user` in schema.sql) creates the profile row with `SECURITY DEFINER` — bypasses RLS even when email confirmation is pending (no session yet).
- If email confirmation is required, `register()` returns `'confirm_email'` instead of `true`, and `RegisterModal` shows an email-check prompt.

### User CRUD actions (all in `userStore.js`)
| Action | Method |
|---|---|
| Change username | `updateUsername(newUsername)` |
| Change email | `updateEmail(newEmail)` — sends confirmation link |
| Change password | `updatePassword(newPassword)` |
| Send password reset | `sendPasswordReset(email)` — sends reset link |
| Delete account (soft) | `requestAccountDeletion()` — sets `delete_requested_at`; user has 30 days |
| Cancel deletion | Automatic on next login — `loadProfile` clears `delete_requested_at` |

All CRUD UI lives at `/account` → `AccountSettings.jsx`.

### Achievements
- Only tracked and persisted when the user is **logged in** (`userStore.user !== null`).
- `unlockAchievements()` returns immediately if `user` is null.
- `ProductionEngine` skips all achievement checks for guests.
- Settings page hides the achievements section for guests.

### Session Persistence
- Supabase JS SDK handles refresh tokens automatically (stored in localStorage).
- No custom cookie logic needed.

---

## Supabase Schema Notes

**Always re-run `supabase/schema.sql` in the Supabase SQL Editor after any change.**

Key additions beyond basic CRUD policies:
- `profiles.delete_requested_at TIMESTAMPTZ` — set when user requests deletion
- `handle_new_user()` trigger on `auth.users` INSERT — auto-creates profile from auth metadata
- Auto-delete cron job (commented out in schema.sql) — requires `pg_cron` extension; runs daily to hard-delete accounts where `delete_requested_at < NOW() - INTERVAL '30 days'`

---

## Key Implementation Rules

1. **`totalPixelsProduced` is append-only** — never decremented, used for win condition.
2. **Shop uses produced pixels** — `pixelsSpentInShop` tracks spending; win condition unaffected.
3. **Pixel inventory is authoritative** — always use store actions (`paintPixel`, `clearBlock`, `fillBlock`, `applyTemplate`).
4. **Block move resets**: `reactorAge` and `echoAge` reset to 0 on move.
5. **Color dominance**: >50% of block's filled pixels (white counts in denominator).
6. **Set detection**: "only" sets reject any color outside allowed list; white/silver neutral; rainbow/gold/plasma wildcard.
7. **Campaign unlocks** via `useUnlocks()` hook; shop-only items bypass campaign check.
8. **Supabase only for**: auth, gold, campaign_progress, achievements, endless_scores, templates, profiles CRUD.
9. **Achievements require login** — guest players cannot earn achievements.
10. **Never commit env files**: `frontend/.env` and `backend/.env` are gitignored.

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
- **Mobile responsive layout**: ShopSidebar hidden on phones; stats panel hidden on tablet; touch drag-drop via `drag-drop-touch` polyfill (planned, not yet wired)
