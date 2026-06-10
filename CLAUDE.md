# CLAUDE.md — PixelFactory

## Project Overview

**PixelFactory** is a browser-based idle/strategy game themed around parallel programming. Each block on the grid is an independent process producing pixels per second — like parallel threads. Players select pre-designed art blocks, place them on a 12×12 grid, and optimize their layout using design synergies, block effects, and wave animations to hit pixel output targets.

Live at: **https://Hehehehe290805.github.io/PixelFactory/**  
GitHub: **https://github.com/Hehehehe290805/PixelFactory**

---

## Reengineering Status (June 2026)

**Pixel painting has been removed.** The new system is largely implemented but has 3 critical gaps that must be fixed before the game is playable end-to-end.

### ✅ Completed

- `data/designLibrary.js` — 200+ designs with fixed 16×16 pixel art, block type, series, desc, unlock source
- `engine/designSynergies.js` — 49 synergies across 7 types (series_count, exact_count, adjacency_pair, row_series, long_range, core_radius, block_type_count); replaces setDetector + synergyEngine
- `lib/designUnlocks.js` — milestone pairs, `useDesignUnlocks()`, `shouldShowDesignChoice()`
- `store/gameStore.js` — paint methods removed; `createBlock(design)` takes a design; deck selection; `buyDesignFromShop`
- `store/shopStore.js` — pixel unlocks removed; gates block-type unlocks for shop designs
- `engine/blockEffects.js` — all 19 effects adapted for fixed pixelLayout (focus/prism/color_checker/conductor)
- `engine/productionEngine.js` — uses `buildSynergyData` instead of old set/dominance maps
- `lib/constants.js` — PIXEL_COLORS and PIXEL_SETS removed
- `lib/unlocks.js` — thin shim re-exporting from designUnlocks
- `components/ui/DeckSelector.jsx` — pre-level deck picker + pre-buy phase
- `components/game/ActiveEffectsPanel.jsx` — live synergy progress display
- `components/game/InventoryPanel.jsx` — design cards with hover tooltips
- `components/game/ShopSidebar.jsx` — deck designs, pixel costs, hover descriptions, drag-to-grid
- `pages/Level.jsx` — DeckSelector replaces pre-level shop; DesignChoiceModal after milestones
- `pages/Endless.jsx` — deck flow; endless-minute tracking for 20-min unlock
- `pages/Shop.jsx` — shop-only designs, block type gate unlocks
- `pages/Profile.jsx` — design collection grid
- `components/game/Block.jsx` — uses COLOR_HEX directly; active synergy dot instead of set badge
- `components/game/Grid.jsx` — Paint option removed; 4-option wheel (Move, Replace, Wave, Remove)
- `engine/achievementEngine.js` — set discovery removed; design collection + synergy achievements added
- `store/userStore.js` — `unlockedDesigns[]`, `unlockDesign()`, `unlockDesigns()`, `endlessMinutes`, `addEndlessMinutes()`

**Deleted:** `BlockEditor.jsx`, `TemplatePicker.jsx`, `TemplateSaveModal.jsx`, `setDetector.js`, `dominanceChecker.js`, `synergyEngine.js`, `officialTemplates.js`, `InLevelShop.jsx`

---

### 🔴 Critical — Breaks Gameplay (fix before testing)

**1. `engine/levelConfig.js` — startingBlocks uses old format**

`levelConfig.js` still generates `startingBlocks` with `createBlock('base')` (old string-only API). `createBlock` now requires a design object or design ID. Since levels use the deck system, `startingBlocks` and `startingPixels` in levelConfig can simply be removed — the deck + pre-buy flow handles starting inventory. Fix:
- Remove `startingBlocks` and `startingPixels` from all level configs
- Level.jsx's `handleDeckConfirmed` already handles starting inventory; levelConfig just needs `{ number, name, requiredOutput, timeLimitSeconds, tutorial? }`

**2. Tutorial completion → starter design unlock not wired up**

When the player finishes Level 1 for the first time, `unlockDesigns(getStarterDesignIds())` must be called. Currently nothing grants the 10 starter designs. Fix in `Level.jsx` inside the `useEffect([levelComplete])` block:
```js
// After saveCampaignProgress, if level 1 and first time:
if (levelNum === 1 && !campaignProgress[1]) {
  unlockDesigns(getStarterDesignIds())
}
```

**3. `TutorialOverlay.jsx` — references removed steps**

Still has steps `paint_pixels` (waits for `totalPainted >= 5`), `editor-canvas`, and `editor-done` which reference the deleted BlockEditor. The tutorial steps need to be replaced with the new flow:
1. `welcome` — manual
2. `open_inventory` — waits for `inventoryOpen`
3. `view_designs` — spotlight on inventory panel (manual advance)
4. `place_block` — waits for `blocksOnGrid >= 1`
5. `watch` — waits for `totalPixelsProduced > 0`
6. `check_effects` — spotlight on ActiveEffectsPanel (manual)
7. `done` — manual

---

### 🟡 Important — Broken UX

**4. `LevelHUD.jsx` — may reference `colorCheckerReductions`**

The old `colorCheckerReductions` state no longer exists in gameStore. Check LevelHUD.jsx and remove any reference to it. The `effectiveRequired` calculation now lives in Level.jsx (efficiency grid style −10%).

**5. Supabase schema missing columns**

`userStore.loadProfile` now reads `profiles.unlocked_designs` (JSONB array) and `profiles.endless_minutes` (FLOAT). These columns don't exist yet. Add to `supabase/schema.sql`:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_designs JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS endless_minutes FLOAT DEFAULT 0;
```
Run in Supabase SQL Editor. Until done, profile loads will not restore design unlocks across sessions.

**6. Deck selection not pre-populated on retry**

When a player retries a level, DeckSelector opens with an empty deck. The previous deck choice should be pre-filled. Fix: read `deckSelection` from gameStore as initial value in DeckSelector's `useState([])`.

---

### 🟢 Polish (lower priority)

**7. Bundle size** — 837KB unminified; the pixel art data in designLibrary.js is the main contributor. Consider lazy-loading it with `React.lazy` / dynamic `import()` once critical bugs are fixed.

**8. Campaign.jsx design choice flow** — Design choice pairs (`shouldShowDesignChoice`) are currently only triggered from within Level.jsx. Campaign.jsx doesn't independently show missed choices. Fine for now.

**9. Endless quiz "bonus" redesign** — The old quiz bonus gave `+N white pixels`. The new implementation gives an extra base design block instead. `ENDLESS_REWARDS` in `learningContent.js` still refers to pixel counts; update the between-wave copy to say "Bonus design next wave" instead of "+10 white pixels."

**10. `willow_tree` pattern row 9** — Has a trailing space that the `trimEnd().padEnd(16, '.')` fix in designLibrary handles at runtime. Not a bug, just note.

---

### Implementation Order

Start with the three 🔴 critical items in order: levelConfig → tutorial unlock wiring → TutorialOverlay steps. Then 🟡 items 4 and 5 before pushing to production.
- `components/ui/DeckSelector.jsx` — pre-level deck picker (10 designs)
- `components/game/ActiveEffectsPanel.jsx` — live synergy status panel (right side, below output)

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
│   │   └── favicon.svg           # 4-color pixel icon
│   ├── index.html
│   ├── vite.config.js            # base: '/PixelFactory/'
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── Block.jsx              # Renders fixed pixelLayout + 8-dir wave animation
│   │   │   │   ├── BlockSlot.jsx          # Grid cell; drag-drop + onCellClick
│   │   │   │   ├── Grid.jsx               # Radial wheel, move mode, wave dir
│   │   │   │   ├── InventoryPanel.jsx     # Expandable bottom bar; design cards with hover tooltips
│   │   │   │   ├── LevelHUD.jsx           # Progress bar, timer (×gameSpeed), ⏸ pause, speed selector
│   │   │   │   ├── PixelCounter.jsx       # px/s + floating +N animation, progress, totals
│   │   │   │   ├── ProductionEngine.jsx   # 100ms tick; respects gameSpeed + gamePaused
│   │   │   │   ├── RadialWheel.jsx        # Animated radial context menu
│   │   │   │   ├── ActiveEffectsPanel.jsx # Right panel: active synergies + progress (e.g. GARDEN 3/5)
│   │   │   │   └── ShopSidebar.jsx        # In-level shop: 10 deck designs with pixel costs + hover tooltips
│   │   │   ├── ui/
│   │   │   │   ├── AchievementToast.jsx
│   │   │   │   ├── DeckSelector.jsx       # Pre-level: pick 10 designs from collection + pre-buy
│   │   │   │   ├── LearningCard.jsx       # Post-level fact card (L1–12) or quiz (L13+)
│   │   │   │   ├── StarResult.jsx         # No stars on tutorial; green ✓ checkmark instead
│   │   │   │   └── TutorialOverlay.jsx    # Spotlight tutorial (clip-path grayout + pulsing ring)
│   │   │   └── auth/
│   │   │       ├── LoginModal.jsx
│   │   │       └── RegisterModal.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Campaign.jsx        # Level select; design choice modal at levels 5,10,15,...
│   │   │   ├── Level.jsx           # DeckSelector → pre-buy → game; no BlockEditor
│   │   │   ├── Endless.jsx         # End Run flow; endless design unlock tracking
│   │   │   ├── Profile.jsx         # Design collection: unlocked + locked designs
│   │   │   ├── Shop.jsx            # Permanent shop: grid styles, 30 shop-only designs, speed boosts
│   │   │   ├── Settings.jsx
│   │   │   ├── AccountSettings.jsx
│   │   │   └── Leaderboard.jsx
│   │   ├── store/
│   │   │   ├── gameStore.js      # Grid, inventory (design instances), deckSelection, gameSpeed, gamePaused
│   │   │   ├── userStore.js      # Auth, gold, progress, achievements, quizStats, CRUD
│   │   │   ├── shopStore.js      # Persistent unlocks: activeGridStyle, unlockedDesigns, purchasedSpeeds
│   │   │   └── settingsStore.js  # showTutorial, showLearning
│   │   ├── engine/
│   │   │   ├── productionEngine.js   # Full tick: base + design synergy + block effects
│   │   │   ├── blockEffects.js       # All 19 block effect functions (adapted for fixed pixelLayout)
│   │   │   ├── designSynergies.js    # Design series synergy detection (replaces setDetector + synergyEngine)
│   │   │   ├── achievementEngine.js  # Achievement condition checks (design-based)
│   │   │   └── levelConfig.js        # 10 hand-crafted + 190 generated levels
│   │   ├── data/
│   │   │   ├── designLibrary.js      # 200+ designs: id, name, series, blockType, pixelLayout, desc, unlockSource
│   │   │   └── learningContent.js    # Facts (L1–12), quiz questions (L13+), Endless questions + rewards
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   ├── constants.js          # BLOCK_TYPES, GRID_STYLES, GRID_SIZE, TICK_MS (no PIXEL_COLORS/SETS)
│   │   │   ├── designUnlocks.js      # Design unlock milestones + useDesignUnlocks() hook
│   │   │   ├── validate.js
│   │   │   └── unlocks.js            # Legacy block-type unlocks (kept for compatibility)
│   │   ├── hooks/
│   │   │   └── useGridCellSize.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── backend/functions/validate-user/
├── supabase/schema.sql
└── README.md
```

---

## Core Game Loop

1. **Pre-level**: Player opens DeckSelector → picks 10 designs from their collection → optionally pre-buys some using starting pixels (pixels scale with level)
2. **Tick** (every 100ms): `ProductionEngine` calls `computeTick(grid, opts)` → scaled by `gameSpeed` → updates `totalPixelsProduced`
3. **Tick skipped** when `gamePaused === true`
4. **Level complete** when `totalPixelsProduced >= config.requiredOutput`
5. **Stars** = based on fraction of time limit used (tutorial always gives ✓ not ★)

---

## Design System

### What Is a Design?

A **design** is a block with:
- Fixed 16×16 pixel art (`pixelLayout`) — not editable by the player
- A bundled block type (`blockType`) — determines the production effect
- A series (`series`) — determines synergy group membership
- A one-line tooltip (`desc`)
- An unlock source

```js
// Example design from data/designLibrary.js
{
  id: 'rose',
  name: 'Rose',
  series: 'flowers',
  blockType: 'doubler',
  desc: '×2 output when surrounded by weaker designs',
  unlockSource: 'campaign_choice',  // offered at level 5 or 10
  pixelLayout: [[...], ...],        // 16×16 array of color strings | null
  pixelCount: 96,                   // precomputed count of filled pixels
  dominantColor: 'red',             // most-used color (for color_checker + focus mechanics)
  shopCost: 0,                      // in-level pixel cost (0 = uses block type default)
}
```

### Design Series (12 series, ~16–18 designs each)

| Series | Example Designs |
|---|---|
| flowers | Rose, Daisy, Sunflower, Tulip, Lily, Orchid, Hibiscus, Lotus, Poppy, Bluebell, Marigold, Lavender, Cherry Blossom, Chrysanthemum, Iris, Cosmos, Peony, Daffodil |
| trees | Oak, Pine, Palm, Cherry Blossom Tree, Willow, Apple Tree, Bamboo, Cactus, Bonsai, Maple, Sequoia, Fig, Birch, Eucalyptus, Mangrove, Banyan |
| buildings | House, Castle, Tower, Windmill, Barn, Church, Lighthouse, Bridge, Arch, Well, Hut, Pyramid, Skyscraper, Ruins, Cottage, Pagoda |
| celestial | Sun, Moon, Star, Cloud, Lightning, Comet, Crescent, Full Moon, Shooting Star, Rainbow Arc, Aurora, Eclipse, Galaxy Spiral, Nebula Cloud, Meteor, Solar Flare |
| animals | Cat, Dog, Bird, Fish, Butterfly, Bee, Fox, Turtle, Rabbit, Frog, Owl, Deer, Wolf, Dragon, Phoenix, Eagle, Dolphin, Horse |
| shapes | Circle, Triangle, Diamond, Hexagon, Pentagon, Star Shape, Spiral, Cross, Arrow, Zigzag, Checkerboard, Wavy, Concentric, Octagon |
| food | Apple, Cherry, Mushroom, Cake, Pizza, Strawberry, Pineapple, Watermelon, Lemon, Grapes, Banana, Tomato, Corn, Peach |
| symbols | Heart, Crown, Key, Shield, Gem, Anchor, Sword, Compass, Hourglass, Flame, Skull, Lock, Infinity, Yin-Yang |
| weather | Snowflake, Raindrop, Tornado, Storm Cloud, Sun & Rain, Ice Crystal, Fog, Hail, Thundercloud, Blizzard, Wind Spiral, Frost |
| landscapes | Mountain, Ocean Wave, Forest, Cave, Island, Desert, Volcano, Glacier, Hills, Cliff, Riverbank, Canyon |
| space | Planet, Rocket, Galaxy, Asteroid, Alien, Satellite, Black Hole, Nebula, UFO, Space Station, Meteor Shower, Star Cluster, Pulsar, Quasar |
| abstract | Grid Pattern, Dots, Checkers, Diagonal Stripes, Mosaic, Maze, Fractal, Target Rings, Circuit Board, Digital Wave |

### Visual-Only Designs

Some designs are cosmetic skins (change appearance only, same block effect). Unlockable only via achievement or the permanent shop market. They reference the same blockType as a functional design but have different pixel art.

---

## Design Synergy System (`engine/designSynergies.js`)

Replaces the old pixel-set / radiation system. **49 synergies across 7 types.**

### Synergy Types

| Type | Trigger | Example |
|---|---|---|
| `series_count` | N designs of same series anywhere on grid | GARDEN: 5 flower designs → +20% all output |
| `exact_count` | N copies of exact same design on grid | ROSE PARADE: 3 Roses → +25% those blocks |
| `adjacency_pair` | Two specific designs placed orthogonally adjacent | SUN & MOON: Sun + Moon adjacent → +30% both |
| `row_series` | N designs of same series in same horizontal row | CITY BLOCK: 4 buildings in one row → +28% that row |
| `long_range` | Two qualifying designs at least `minDist` cells apart (Manhattan) | DISTANT STARS: 2 space designs ≥5 apart → +25% both |
| `core_radius` | One "core" design + N "satellite" designs within `radius` cells | SOLAR SYSTEM: Sun + 3 space within 3 cells → Sun +40%, ring +20% |
| `block_type_count` | N blocks sharing the same `blockType` anywhere on grid | ECHO CHAMBER: 3 echo blocks → +20% each |

### Synergy Definition Fields

```js
// Common to all types:
{
  name, type, desc,
  own,               // additive output bonus for qualifying blocks (e.g. 0.20 = +20%)
  radiation: {       // optional — bonus that spreads to neighbors
    type: 'ortho' | 'diag' | 'all8',
    amount,          // additive bonus to radiation targets
  },
}

// series_count / row_series:
{ series, required }

// exact_count:
{ designId, required }

// adjacency_pair:
{ seriesA, seriesB, designA, designB }  // designA/B override series check if set

// long_range — same-series pair:
{ series, minDist }
// long_range — cross-series or cross-design pair:
{ seriesA, seriesB, minDist }   // or: { designA, designB, minDist }

// core_radius:
{
  coreDesignId,        // specific design id for the anchor (OR use coreSeries)
  coreSeries,          // any design of this series can be the core
  satelliteSeries,     // qualifying satellite designs must be of this series
  requiredSatellites,  // how many satellites must be within radius
  radius,              // max Manhattan distance from core to satellite
  ownCore,             // bonus for the core block
  ownSatellite,        // bonus for each qualifying satellite block
  own,                 // = ownCore, used for synergyMap priority comparison
}

// block_type_count:
{ blockType, required }  // blockType matches block.type (e.g. 'reactor', 'echo')
```

### Active Synergy Bonuses

Each synergy contributes additively to `bonusMap[r][c]`. A cell may receive:
- Its own `own` bonus (if it qualifies for that synergy)
- Radiation from neighbors that qualify for that synergy
- For `core_radius`: `ownCore` if it is the core, `ownSatellite` if it is a satellite

### Long-Range Synergies (5 synergies)

Rewards spreading designs across the full grid. Manhattan distance between the pair must be ≥ `minDist`.

| ID | Name | Condition | Bonus |
|---|---|---|---|
| DISTANT_STARS | Distant Stars | 2 space ≥5 | +25% · +8% all-8 |
| ANTIPODES | Antipodes | 2 landscapes ≥6 | +22% · +6% ortho |
| POLAR_WINDS | Polar Winds | weather + landscape ≥5 | +28% both |
| TRANSCONTINENTAL | Transcontinental | 2 buildings ≥5 | +20% · +7% ortho |
| WILD_MIGRATION | Wild Migration | 2 animals ≥5 | +22% · +6% ortho |

### Core-Radius Synergies (5 synergies)

One anchor block + N satellites within a Manhattan radius. Core and satellites get separate bonuses.

| ID | Name | Core | Satellites | Radius | Core | Sat |
|---|---|---|---|---|---|---|
| SOLAR_SYSTEM | Solar System | sun design | 3 space | 3 | +40% | +20% |
| ROYAL_COURT | Royal Court | crown design | 3 symbols | 2 | +35% | +20% |
| ECOSYSTEM | Ecosystem | any tree | 3 animals | 2 | +25% | +18% |
| MOUNTAIN_KINGDOM | Mountain Kingdom | mountain design | 3 landscapes | 2 | +30% | +18% |
| BLOOMING_CORE | Blooming Core | any flower | 4 flowers | 3 | +35% | +15% |

### Block-Type Synergies (3 synergies)

Works across all series — only the block effect type matters.

| ID | Name | Block Type | Required | Bonus |
|---|---|---|---|---|
| DOUBLE_DOWN | Double Down | doubler | 3 | +25% · +8% ortho |
| REACTOR_NETWORK | Reactor Network | reactor | 2 | +30% · +10% all-8 |
| ECHO_CHAMBER | Echo Chamber | echo | 3 | +20% · +7% ortho |

### Synergy Detection API

```js
// Returns:
//   synergyMap[r][c] — id of highest-priority active synergy for that cell (or null)
//   bonusMap[r][c]   — total additive bonus for that cell (own + received radiation)
//   activeList       — [{ id, name, desc, active, progress, required }] for ActiveEffectsPanel
buildSynergyData(grid, neuralGridStyle = false)

getSynergyMultiplier(r, c, bonusMap)        // → 1 + bonusMap[r][c]
getBestNeighborSynergyBonus(r, c, grid, bonusMap)  // used by Conductor
```

Priority for `synergyMap[r][c]`: the synergy whose `ownCore ?? own` is largest wins the cell (so the most impactful active synergy is displayed per block).

### Conductor Block (updated)
Borrows the highest `bonusMap` value from any of the 8 adjacent cells.

---

## Block Types (19 total — all kept)

All effects work on the fixed `pixelLayout`/`pixelCount` of the design.

### Notes on adapted effects:
- **Base**: `pixelCount / 37.5` px/s — pixelCount is fixed per design (~80–120 typical)
- **Color Checker**: `dominantColor` is precomputed from the design's pixel art; triggers immediately on placement if dominant color ≥50% of design
- **Focus**: `focusColor` = design's `dominantColor`; multiplier = `1 + dominantColorRatio` (fixed per design, ~1.6–1.9×)
- **Prism**: counts unique non-white/silver colors in the design's fixed pixel art
- **Conductor**: borrows highest active synergy bonus from adjacent blocks' `activeSynergy` field
- **Greedy/Forge**: use `pixelCount` as before
- All timing-based effects (Reactor, Echo, Overflow) work unchanged

### Base Set (intro with starters)
| Block | Effect |
|---|---|
| **Base** | `floor(pixelCount / 37.5)` px/s |
| **Doubler** | ×2 if all 4 ortho neighbors have < half its pixelCount |
| **Cross Amp** | Adds `floor(pixelCount/10)` px/s to each diagonal neighbor |
| **Color Checker** | dominantColor ≥50% → −5% required output (one-time, on placement) |
| **Greedy** | On complete: `(myPixelCount − Σneighbor.pixelCount) × 10` gold |

### Campaign-Unlocked Specials (via design unlock milestones)
| Block | Effect |
|---|---|
| Amplifier | +8% per occupied neighbor (all 8) |
| Resonator | +50% if ortho neighbor is same block type |
| Reactor | Ramps 50%→200% over 15s; resets on move |
| Echo | +4% per 10s stationary (max +80%) |
| Prism | +5% per unique non-white color in design (max +30%) |
| Conductor | Borrows highest synergy bonus from adjacent blocks |
| Splitter | Gives ortho neighbors +20% of own rate |
| Focus | Output = `pixelCount / 37.5 × (1 + dominantColorRatio)` — fixed per design |
| Cluster | +12% per occupied neighbor (excl. void) |
| Forge | On complete: +3 gold per pixel held |

### Shop-Only (permanent shop)
| Block | Shop Cost | Effect |
|---|---|---|
| Overflow | 300g | 3× burst for 5s every 10s |
| Mirror | 250g | Copies best ortho neighbor rate |
| Catalyst | 350g | Synergy bonuses in same row ×1.5 |
| Void | 200g | 0 output; +15% to all 8 surrounding blocks |

---

## gameStore State Shape

```js
{
  // Grid & blocks
  grid,               // 12×12 array of block instance | null
  inventory,          // design instances in hand (not yet placed)
  deckSelection,      // [designId × 10] — chosen before each level

  // Production
  totalPixelsProduced, // append-only; win condition
  pixelsSpentInShop,   // pixels spent buying designs from in-level shop
  currentPxPerSecond,

  // Level state
  levelActive, levelComplete,
  gameSpeed, gamePaused,

  // Actions
  placeBlock(blockId, row, col),
  removeBlock(row, col),
  moveBlock(fromRow, fromCol, toRow, toCol),
  buyDesignFromShop(designId, cost),  // adds instance to inventory; deducts pixelsSpentInShop
  setWaveDir(blockId, dir),
  buyShopItem(cost),     // deducts from pixelsSpentInShop budget; returns bool
  setGameSpeed(speed),
  setPaused(bool),
  startLevel(levelBlocks),   // no startingPixels param; deck pre-buys handled separately
  resetLevel(), completeLevel(),
}
```

---

## Block Instance Shape (from `createBlock(design)`)

```js
{
  id,             // unique instance id
  designId,       // references DESIGNS array
  type,           // = design.blockType (e.g. 'doubler')
  pixelLayout,    // = design.pixelLayout (fixed; not editable)
  pixelCount,     // = design.pixelCount (fixed)
  dominantColor,  // = design.dominantColor (for color_checker/focus)
  pauseTimer,     // ms remaining on move cooldown
  activeSynergy,  // highest synergy ID affecting this block (null if none)
  colorCheckerTriggered,
  reactorAge,
  echoAge,
  overflowTimer,
  waveDir,
}
```

---

## Design Unlock Progression (`lib/designUnlocks.js`)

| Source | What you get |
|---|---|
| Tutorial complete (level 1) | 10 starter designs (one per main series, all base or simple effect type) |
| Every 5th level completed | Offered a choice: pick 1 of 2 specific designs |
| Permanent shop | 30 exclusive designs (shop-only, cannot be earned via campaign) |
| Endless: survive 20 minutes | Rainbow Prism design (special series) |
| Campaign: 25 correct quiz answers | Crystal Star design |
| Campaign: 50 correct quiz answers | Nebula design |
| Specific achievements | Various visual-only cosmetic designs |

### Starter Designs (10, given at tutorial completion)

| Design | Series | Block Type |
|---|---|---|
| Daisy | flowers | base |
| Oak | trees | base |
| House | buildings | base |
| Star | celestial | base |
| Cat | animals | base |
| Heart | symbols | base |
| Snowflake | weather | base |
| Mountain | landscapes | base |
| Circle | shapes | base |
| Apple | food | greedy |

### Campaign Choice Milestones

At levels 5, 10, 15, 20, 25, 30 (and every 5 levels after), a design choice modal appears after level completion. Player chooses 1 of 2 pre-set designs. These choices introduce effect block types progressively.

---

## Deck System (Pre-Level)

1. **DeckSelector** screen opens before each level
2. Player picks 10 designs from their unlocked collection (any series/type mix)
3. **Pre-buy phase**: spend starting pixels (= `50 + level × 5`, capped at 300) to buy some deck designs into starting inventory
4. **Level starts**: pre-bought designs are in `inventory`; remaining 10 deck designs appear in `ShopSidebar`
5. **Mid-level shop**: buy more copies of deck designs using produced pixels

### In-Level Shop (ShopSidebar)

- Shows all 10 chosen deck designs
- Each has a pixel cost (based on block type effect power; Bargain grid style −20%)
- Hover shows: design name, series, effect description, current pixel cost
- Can drag directly from shop → grid if affordable (cost deducted on drop)
- Purchase feedback: green flash on success, red flash on failure (420ms)
- Items semi-transparent when unaffordable, full opacity when affordable

### Approximate In-Level Design Costs

| Block Type | Level Cost (px) |
|---|---|
| base | 13 |
| doubler | 39 |
| cross_amp | 32 |
| color_checker | 26 |
| greedy | 52 |
| amplifier | 45 |
| resonator | 55 |
| reactor | 91 |
| echo | 45 |
| prism | 58 |
| conductor | 72 |
| splitter | 65 |
| focus | 42 |
| cluster | 55 |
| forge | 78 |
| overflow | 65 |
| mirror | 58 |
| catalyst | 78 |
| void | 45 |

---

## Active Effects Panel (`components/game/ActiveEffectsPanel.jsx`)

Displayed on the right side of the play area, below `PixelCounter`.

- Lists all synergies currently **active** (green glow) or **in progress** (gray, count > 0)
- Each row shows: synergy name · `progress/required` counter · progress bar
- Click any row to expand a **dropdown** that shows:
  - **Type badge** — colored label (ANY POSITION, ADJACENT, LONG RANGE, RADIUS, BLOCK TYPE, etc.) so the player immediately knows the spatial pattern
  - **Bonus** — e.g. `+20% output · radiates +8%` or `core +40% · ring +20%` for radius synergies
  - **How to activate** — plain-language setup instructions tailored to that synergy type
  - **How many more** designs are still needed (when not yet active)
- Active synergies highlight in green/gold; completed bonuses shown inline when collapsed

---

## Grid Styles (12 total)

Same as before. **Neural** grid style now reduces design synergy trigger thresholds by 1 instead of the old Color Checker reduction.

| Style | Cost | Effect |
|---|---|---|
| Base | Free | — |
| Gold Rush | 500g | +15% gold per level |
| Overclock | 800g | +10% output |
| Efficiency | 600g | +20% time, −10% required |
| Bargain | 700g | In-level shop 20% cheaper |
| Quantum | 1000g | 2× burst every 30s for 5s |
| Neural | 700g | Design synergy thresholds −1 (e.g. 5→4 for series_count) |
| Industrial | 600g | +3% per 10 placed blocks |
| Synergy+ | 900g | Design synergy bonuses +25% stronger |
| Cascade | 750g | Rows 6–11: +4% per row below row 5 |
| Overcharge | 850g | +25% output |
| Lattice | 650g | +35% for blocks with exactly 4 ortho neighbors |

---

## Production Engine Logic

```js
// ProductionEngine.jsx — interval every TICK_MS (100ms)
// Skips entirely when gamePaused === true

const { totalThisTick, totalPxPerSec, synergyMap } = computeTick(grid, {
  activeGridStyle, gridTick,
})
const scaled = totalThisTick * gameSpeed
addPixels(scaled)
setPxPerSecond(totalPxPerSec * gameSpeed)
```

```js
// productionEngine.js computeTick — pure function
function computeTick(grid, { activeGridStyle, gridTick }) {
  synergyMap   = buildSynergyData(grid).synergyMap   // replaces setMap + dominanceMap
  catalystRows = buildCatalystRows(grid)
  // first pass: base × synergy × block effects → rateMap
  // second pass: + flat adds (CrossAmp, Splitter), × all multipliers, grid-style mods
  return { totalThisTick, totalPxPerSec, synergyMap }
}
```

Base rate formula: `pixelCount / 37.5` px/s (pixelCount fixed per design)

---

## Pause System (unchanged)

- ⏸ button calls `setPaused(true)`
- `ProductionEngine` skips tick when `gamePaused === true`
- **No auto-pause on editor** — BlockEditor no longer exists
- **Pause modal** (z-70): Continue, Settings, Exit Level
- `beforeunload` warning active during active level run

---

## Wave Animation (Block.jsx — unchanged)

`block.waveDir` (default `'up'`) — 8 directions. CSS keyframes unchanged. Duration = `37.5 / pixelCount` seconds.

Radial wheel on occupied cell: Move, Wave (sub-wheel), Remove. (Paint option removed.)

---

## Tutorial System (TutorialOverlay.jsx — updated steps)

Level 1 only. Revised steps without painting:

**Steps:**
1. `welcome` — manual
2. `open_inventory` — waits for `inventoryOpen` to become true
3. `view_designs` — spotlight on inventory design cards (manual advance)
4. `place_block` — waits for `blocksOnGrid >= 1`
5. `watch` — waits for `totalPixelsProduced > 0`
6. `check_effects` — spotlight on ActiveEffectsPanel (manual)
7. `done` — manual

**z-index scheme:**
- Tutorial backdrop: z-40, card: z-60, pause modal: z-70

---

## Permanent Shop (`Shop.jsx`)

Currency: **gold**. Stored in `shopStore`.

| Category | Items |
|---|---|
| Grid Styles | 12 styles |
| Shop-Only Designs | 30 exclusive designs (use silver/gold/neon/rainbow colors) |
| Shop-Only Block Types | overflow, mirror, catalyst, void (unlocks designs of those types in deck) |
| Speed Boosts | 0.5× (150g), 2× (250g), 5× (500g), 10× (1000g) |

Shop-only block type unlocks work differently now: buying e.g. "Overflow" in the shop unlocks the ability to add Overflow-type designs to your deck.

---

## Endless Mode (updated unlock tracking)

- `userStore.endlessMinutes` — total accumulated minutes in endless runs (persisted)
- When `endlessMinutes >= 20` and design not yet unlocked → grant Rainbow Prism design
- `userStore.quizStats.correct` (campaign correct answers) tracked for 25/50 design unlocks

---

## Profile Page (`Profile.jsx`)

Now shows **Design Collection** instead of templates:
- All 200+ designs shown in a grid
- Unlocked: full color, shows name + series
- Locked: grayscale silhouette with "???" name + unlock hint
- Series filter tabs

---

## Auth & User CRUD (unchanged)

See previous registration, CRUD, and session persistence notes. All unchanged.

---

## Supabase Schema Notes

Unchanged from before. The `templates` table is no longer used by gameplay but kept for backwards compatibility.

---

## Key Implementation Rules

1. **`totalPixelsProduced` is append-only** — never decremented, used for win condition.
2. **In-level shop uses produced pixels** — `pixelsSpentInShop` tracks spending; win condition unaffected.
3. **Deck pre-buy uses starting pixels** (budget = `50 + level × 5`, capped 300) — NOT gold.
4. **Permanent shop uses gold** — grid styles, shop-only designs, speed boosts.
5. **Block move resets**: `reactorAge` and `echoAge` reset to 0 on move.
6. **Design pixel art is immutable** — `pixelLayout` is always read from the design library, never from user edits.
7. **`pixelCount` and `dominantColor` are precomputed** in the design library — do not recompute at runtime.
8. **Design synergies replace sets** — `buildSynergyData(grid)` returns `synergyMap` used instead of old `setMap`.
9. **Focus effect is now deterministic** — `focusColor = dominantColor`, multiplier = `1 + (dominantColorCount / pixelCount)`, fixed per design.
10. **Color Checker always triggers on placement** — since the design's dominant color is already ≥50%, placing a color_checker design always reduces required output by 5%.
11. **Speed boosts are permanent** — `shopStore.purchasedSpeeds`; affect both production AND timer.
12. **Text selection disabled globally** — `user-select: none` on `body`; re-enabled for `input`/`textarea`.
13. **Supabase only for**: auth, gold, campaign_progress, achievements, endless_scores, profiles CRUD.
14. **Achievements require login** — guest players cannot earn achievements.
15. **Never commit env files** — `frontend/.env` gitignored.

---

## Deployment (unchanged)

- GitHub Actions → GitHub Pages
- URL: `https://Hehehehe290805.github.io/PixelFactory/`
- Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## Environment Variables

| File | Contains | Committed? |
|---|---|---|
| `frontend/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Never |
| `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | Never |

---

## Learning System (unchanged)

Parallel computing education via LearningCard (post-level) and Endless quizzes.
- Campaign quiz correct answers now tracked for design unlock milestones (25 and 50).
- See old learning system docs; quiz mechanics are the same.

---

## Parallel Computing Concepts (CCS-309 Reference)

Design series synergies map directly to PDC concepts:

| Game Mechanic | PDC Concept |
|---|---|
| Each design on the grid | Independent parallel thread/process |
| Fixed pixel art = fixed thread behavior | Thread specialization — each process has a defined workload |
| Design series synergy (5 flowers) | Thread affinity group — same-type processes share communication channels |
| Adjacency synergy | Shared-memory locality — processes on the same cache line cooperate |
| Row synergy (Urban Planning) | NUMA domain — threads on the same memory node get a locality bonus |
| Conductor borrowing synergy bonus | Work stealing — a thread borrows the efficiency gains of its neighbor |
| Deck selection (10 designs) | Thread pool configuration — choosing which thread types to instantiate |
| Pre-buy budget (starting pixels) | Bootstrap cost — allocating initial resources before execution begins |

All other PDC mappings from block effects (Reactor warm-up, Echo locality, Splitter work distribution, Void coordinator) remain the same.
