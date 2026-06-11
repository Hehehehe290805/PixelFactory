# CLAUDE.md — PixelFactory

## Project Overview

**PixelFactory** is a browser-based idle/strategy game themed around parallel programming. Each block on the grid is an independent process producing pixels per second — like parallel threads. Players select pre-designed art blocks, place them on a 12×12 grid, and optimize their layout using design synergies, block effects, and wave animations to hit pixel output targets.

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
│   │   └── favicon.svg           # 4-color pixel icon
│   ├── index.html
│   ├── vite.config.js            # base: '/PixelFactory/'
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   ├── Block.jsx              # Renders fixed pixelLayout + 8-dir wave animation
│   │   │   │   ├── BlockSlot.jsx          # Grid cell; drag-drop + onCellClick
│   │   │   │   ├── Grid.jsx               # Radial wheel (Move/Replace/Wave/Synergy/Remove); unique-design dedup
│   │   │   │   ├── InventoryPanel.jsx     # Expandable bottom bar; design cards with hover tooltips
│   │   │   │   ├── LevelHUD.jsx           # Progress bar, timer (×gameSpeed), ⏸ pause, speed selector
│   │   │   │   ├── PixelCounter.jsx       # px/s + floating +N animation, progress, totals
│   │   │   │   ├── ProductionEngine.jsx   # 100ms tick; respects gameSpeed + gamePaused
│   │   │   │   ├── RadialWheel.jsx        # Animated radial context menu
│   │   │   │   ├── ActiveEffectsPanel.jsx # Right panel: synergies + rewards dispatch on first activation
│   │   │   │   └── ShopSidebar.jsx        # Deck shop + random block + sell zone (drag to sell 20%)
│   │   │   ├── ui/
│   │   │   │   ├── AchievementToast.jsx
│   │   │   │   ├── DeckSelector.jsx       # Pre-level: pick 3 designs (max 2× same)
│   │   │   │   ├── LearningCard.jsx       # Post-level fact card (L1–12) or quiz (L13+)
│   │   │   │   ├── StarResult.jsx         # No stars on tutorial; green ✓ checkmark instead
│   │   │   │   └── TutorialOverlay.jsx    # Spotlight tutorial (clip-path grayout + pulsing ring)
│   │   │   └── auth/
│   │   │       ├── LoginModal.jsx
│   │   │       └── RegisterModal.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Campaign.jsx        # Level select; design choice modal at levels 5,10,15,...
│   │   │   ├── Level.jsx           # DeckSelector → game
│   │   │   ├── Endless.jsx         # End Run flow; endless design unlock tracking
│   │   │   ├── Profile.jsx         # Design collection: unlocked + locked designs
│   │   │   ├── Shop.jsx            # Permanent shop: grid styles, 30 shop-only designs, speed boosts
│   │   │   ├── Settings.jsx
│   │   │   ├── AccountSettings.jsx
│   │   │   └── Leaderboard.jsx
│   │   ├── store/
│   │   │   ├── gameStore.js      # Grid, inventory, deckSelection, randomBuyCount, sellBlock, grantRandomBlock
│   │   │   ├── userStore.js      # Auth, gold, progress, achievements, quizStats, CRUD
│   │   │   ├── shopStore.js      # Persistent unlocks: activeGridStyle, unlockedBlocks, purchasedSpeeds
│   │   │   └── settingsStore.js  # showTutorial, showLearning, musicEnabled/Volume, sfxEnabled/Volume (persisted)
│   │   ├── engine/
│   │   │   ├── productionEngine.js   # Full tick: base + design synergy + block effects
│   │   │   ├── blockEffects.js       # All 19 block effect functions
│   │   │   ├── designSynergies.js    # Design series synergy detection
│   │   │   ├── achievementEngine.js  # Achievement condition checks (design-based)
│   │   │   └── levelConfig.js        # 10 hand-crafted + 190 generated levels
│   │   ├── data/
│   │   │   ├── designLibrary.js      # 200+ designs: id, name, series, blockType, pixelLayout, desc, unlockSource
│   │   │   └── learningContent.js    # Facts (L1–12), quiz questions (L13+), Endless questions + rewards
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   ├── constants.js          # BLOCK_TYPES, GRID_STYLES, GRID_SIZE, TICK_MS
│   │   │   ├── designUnlocks.js      # Design unlock milestones + useDesignUnlocks() hook
│   │   │   ├── validate.js
│   │   │   └── unlocks.js            # Block-type unlock pool
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

1. **Pre-level**: Player opens DeckSelector → picks up to 3 designs from their collection (same design can appear up to 2× in the deck)
2. **Level starts**: inventory is empty; deck designs appear in ShopSidebar for purchase with produced pixels
3. **Tick** (every 100ms): `ProductionEngine` calls `computeTick(grid, opts)` → scaled by `gameSpeed` → updates `totalPixelsProduced`
4. **Tick skipped** when `gamePaused === true`
5. **Level complete** when `totalPixelsProduced >= config.requiredOutput`
6. **Stars** = based on fraction of time limit used (tutorial always gives ✓ not ★)

---

## Design System

### What Is a Design?

A **design** is a block with:
- Fixed 16×16 pixel art (`pixelLayout`) — not editable by the player
- A default `blockType` listed on the design card — but **each purchased instance gets a randomly assigned block type** from the pool of unlocked types
- A series (`series`) — determines synergy group membership
- A one-line tooltip (`desc`)
- An unlock source

The `blockType` field on a design in `designLibrary.js` is the fallback/default used only for tutorial blocks. Every shop or random purchase calls `pickRandomType(shopUnlocked)` and passes the result to `createBlock(designId, randomType, cost)`. Block instances also carry `purchaseCost` (pixels paid at purchase) for the sell-back calculation.

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

**~75 synergies across 10 types.** Synergies activate when designs are arranged in specific spatial patterns. Stronger synergies require more designs and some grant one-time rewards on first activation.

### Synergy Types

| Type | Trigger | Example |
|---|---|---|
| `series_count` | N **unique** designs of same series anywhere | GARDEN: 7 flower designs → +35% |
| `exact_count` | N copies of the exact same design id | ROSE PARADE: 3 Roses → +30% those blocks |
| `adjacency_pair` | Two **specific** design ids placed orthogonally adjacent | SUN & MOON: Sun adjacent to Moon → +55% both |
| `row_series` | N designs of same series in the same horizontal row | CITY BLOCK: 5 buildings in one row → +45% |
| `column_series` | N designs of same series in the same vertical column | FLOWER COLUMN: 4 flowers in one column → +40% |
| `long_range` | Two qualifying designs ≥ `minDist` Manhattan cells apart | DISTANT STARS: 2 space ≥6 apart → +45% both |
| `core_radius` | Core design + N satellites within `radius` cells | SOLAR SYSTEM: Sun + 3 space within 2 → Sun +65%, ring +38% |
| `block_type_count` | N blocks of the same `blockType` anywhere | SPECIALIST: 5 of same type → +45% |
| `cross_family` | Specific designs AND/OR series from **different** families all on grid | CHRISTMAS_TREE: Star + Snowflake + any tree → +55%, grants random block |
| `meta_synergy` | Two or more other synergy IDs both currently active | PRIMORDIAL_GROVE: GARDEN + FOREST both active → +35% to all synergy cells |

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

// adjacency_pair — both must be specific design IDs (no generic series):
{ designA, designB }

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
  radius,              // max Manhattan distance from core to satellite (≤ 2)
  ownCore,             // bonus for the core block
  ownSatellite,        // bonus for each qualifying satellite block
  own,                 // = ownCore, used for synergyMap priority comparison
}

// cross_family:
{
  requires: [
    { designId: 'x' },          // specific design must be on grid
    { series: 'x', count: N },  // N designs of this series must be on grid
  ],
  requireAdjacent: true,  // optional: the two named designIds must be orthogonally adjacent
}

// meta_synergy — MUST appear last in SYNERGY_DEFS:
{
  requires: ['SYNERGY_ID_A', 'SYNERGY_ID_B'],  // all must be currently active
  affectsAll: true,  // optional: bonus applies to every occupied cell (not just synergy cells)
}

// reward field (any type):
{ reward: { type: 'pixels' | 'gold' | 'random_block', amount?: number } }
// Fired once by ActiveEffectsPanel when the synergy first transitions to active

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

### Conductor Block

Borrows the highest `bonusMap` value from any of the 8 adjacent cells.

---

## Block Types (19 total)

All effects are computed from the fixed `pixelLayout`/`pixelCount` of the design.

### Block Effect Notes

- **Base**: `pixelCount / 37.5` px/s — pixelCount is fixed per design (~80–120 typical)
- **Color Checker**: `dominantColor` is precomputed from the design's pixel art; triggers immediately on placement if dominant color ≥50% of design
- **Focus**: `focusColor` = design's `dominantColor`; multiplier = `1 + dominantColorRatio` (fixed per design, ~1.6–1.9×)
- **Prism**: counts unique non-white/silver colors in the design's fixed pixel art
- **Conductor**: borrows highest active synergy bonus from adjacent blocks' `activeSynergy` field
- **Greedy/Forge**: use `pixelCount` for their calculations
- All timing-based effects (Reactor, Echo, Overflow) work independently of design

### Base Set (intro with starters)
| Block | Effect |
|---|---|
| **Base** | `floor(pixelCount / 37.5)` px/s |
| **Doubler** | ×2 if all 4 ortho neighbors have < half its pixelCount |
| **Cross Amp** | Adds `floor(pixelCount/10)` px/s to each diagonal neighbor |
| **Color Checker** | dominantColor ≥50% → −5% required output (one-time, on placement) |
| **Greedy** | On complete: `(myPixelCount − Σneighbor.pixelCount) × 10` gold |

### Campaign-Unlocked Specials
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
  deckSelection,      // [designId × 3] — chosen before each level

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
  startLevel(levelBlocks),
  resetLevel(), completeLevel(),
}
```

---

## Block Instance Shape (from `createBlock(designOrId, typeOverride, purchaseCost)`)

```js
{
  id,             // unique instance id
  designId,       // references DESIGNS array
  name,           // = design.name
  series,         // = design.series
  type,           // randomly assigned at purchase — NOT always design.blockType
  pixelLayout,    // = design.pixelLayout (fixed; not editable)
  pixelCount,     // = design.pixelCount (fixed)
  dominantColor,  // = design.dominantColor (for color_checker/focus)
  purchaseCost,   // pixels paid when bought; sell refund = floor(purchaseCost * 0.20)
  pauseTimer,     // ms remaining on move cooldown
  activeSynergy,  // highest synergy ID affecting this block (null if none)
  colorCheckerTriggered,
  reactorAge,
  echoAge,
  overflowTimer,
  waveDir,
}
```

`createBlock` signature: `createBlock(designOrId, typeOverride = null, purchaseCost = 0)`. Tutorial blocks use `typeOverride = null` so they keep the design's default type. Shop purchases pass a random type from `pickRandomType(shopUnlocked)`.

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
2. Player picks up to **3 designs** from their collection — same design can appear up to **2×** in one deck
3. Level starts with an empty inventory; deck designs are available in the `ShopSidebar`
4. **Mid-level shop**: buy copies of deck designs using produced pixels; each purchase assigns a **random block type** from the unlocked pool
5. **Random block**: always available in the shop at `200px × 2^purchaseCount` (doubles every buy)

`MAX_DECK = 3` and `MAX_DECK_COPIES = 2` are constants in `lib/constants.js`.

### In-Level Shop (ShopSidebar)

- Shows unique deck designs (deduplicated — each design appears once)
- Each has a pixel cost based on the design's default block type (Bargain grid style −20%)
- Block type shown as "type: random" — the actual effect is only known after purchase
- Can drag directly from shop → grid if affordable
- Purchase limit: 2 copies of any one design per level
- **Sell zone** at the bottom: drag any block here to sell for 20% of its `purchaseCost`
- **Random block** at the bottom: cost starts at 200px and doubles each time it's bought

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
  synergyMap   = buildSynergyData(grid).synergyMap
  catalystRows = buildCatalystRows(grid)
  // first pass: base × synergy × block effects → rateMap
  // second pass: + flat adds (CrossAmp, Splitter), × all multipliers, grid-style mods
  return { totalThisTick, totalPxPerSec, synergyMap }
}
```

Base rate formula: `pixelCount / 37.5` px/s (pixelCount fixed per design)

---

## Audio System (`lib/audio.js`)

All audio is synthesized at runtime using the **Web Audio API** — no external files are bundled.

### Architecture

```
SFX oscillators → sfxMasterGain → AudioContext.destination
Music oscillators → playerGain → musicMasterGain → lowpassFilter → DynamicsCompressor → destination
```

- `sfxMasterGain` and `musicMasterGain` are lazy-created on first use (satisfies browser autoplay policy)
- `AudioSettingsSync` component in `App.jsx` watches `settingsStore` and updates gain values reactively
- `MusicManager` component in `App.jsx` watches `useLocation()` and starts `menu` track on non-gameplay routes

### Music Tracks (8 total)

| Track ID | Area | Key / BPM | Character |
|---|---|---|---|
| `menu` | All non-level screens | A major, 68 BPM | Bright, inviting |
| `intro` | Levels 1–10 | C major, 72 BPM | Calm, peaceful |
| `apprentice` | Levels 11–30 | G major, 88 BPM | Warm, hopeful |
| `craftsman` | Levels 31–60 | D minor, 96 BPM | Focused, rhythmic |
| `expert` | Levels 61–100 | A minor, 108 BPM | Energetic, driving |
| `master` | Levels 101–150 | E minor, 118 BPM | Intense, tense |
| `grandmaster` | Levels 151–200 | B minor, 132 BPM | Epic, driving |
| `endless` | Endless mode | F lydian, 76 BPM | Meditative, flowing |

### MusicPlayer class

Each playing track is a `MusicPlayer` instance with:
- **Drone layer** — 3–4 sustained oscillators with slow LFO vibrato (runs until `stop()`)
- **Arpeggio layer** — lookahead scheduler (100ms poll, 280ms lookahead) that wraps `arpNotes[]` infinitely
- Fade in (2.5 s) on `start()`, fade out on `stop(fadeTime)`
- Routes through a per-player gain node → `musicMasterGain`

### Music API

```js
startMusic(trackId)          // fade-in new track; fades out old one
stopMusic(fade = 2.0)        // fade out current track
applyMusicEnabled(bool)      // called from Settings toggle; restarts last trackId when re-enabled
getLevelTrack(levelNum)      // returns track id for a campaign level number
setMusicVolume(0–1)          // updates musicMasterGain immediately
setSfxVolume(0–1)            // updates sfxMasterGain immediately
```

### Sound Effects

| Function | Trigger | Sound |
|---|---|---|
| `playBlockPlace()` | Block dragged/placed on grid | Soft double-thud |
| `playPurchase()` | Design bought (pre-buy or shop) | Two-note coin ping |
| `playSynergyActivate(type)` | Synergy activates (per type, 7 variants) | Rising arpeggio, type-specific pattern |
| `playLevelComplete()` | Level win condition met | Grand 5-note fanfare + chord resolution |
| `playAchievementUnlock()` | Achievement toast appears | 4-note triumphant chime |
| `playDesignUnlock()` | Design unlock modal shown | 7-note magical shimmer |

### Settings persistence

`settingsStore.js` persists `{ musicEnabled, sfxEnabled, musicVolume, sfxVolume, showTutorial, showLearning }` to `localStorage` key `pf_settings`. Audio gain nodes are updated reactively via `AudioSettingsSync` in `App.jsx`.

---

## Pause System

- ⏸ button calls `setPaused(true)`
- `ProductionEngine` skips tick when `gamePaused === true`
- **Pause modal** (z-70): Continue, Settings, Exit Level
- `beforeunload` warning active during active level run

---

## Wave Animation (Block.jsx)

`block.waveDir` (default `'up'`) — 8 directions. Duration = `37.5 / pixelCount` seconds.

Radial wheel on occupied cell: Move, Replace, Wave (sub-wheel), Synergy (shows synergy list panel for that block), Remove. No right-click — the Synergy option replaces it. When selecting a design to place from an empty-cell wheel, the inventory is first deduplicated by `designId` so each design shows at most once.

---

## Tutorial System (TutorialOverlay.jsx)

Level 1 only. Spotlight tutorial using clip-path grayout + pulsing ring.

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

Buying a shop-only block type (e.g. "Overflow") unlocks the ability to add that effect type to designs drawn during a run.

---

## Endless Mode

- `userStore.endlessMinutes` — total accumulated minutes in endless runs (persisted)
- When `endlessMinutes >= 20` and design not yet unlocked → grant Rainbow Prism design
- `userStore.quizStats.correct` (campaign correct answers) tracked for 25/50 design unlocks

---

## Profile Page (`Profile.jsx`)

Shows the full **Design Collection**:
- All 200+ designs shown in a grid
- Unlocked: full color, shows name + series
- Locked: grayscale silhouette with "???" name + unlock hint
- Series filter tabs

---

## Auth, User CRUD & Email Setup

### Supabase Auth

Authentication is handled entirely by Supabase. Users register with email + password; Supabase sends a 6-digit OTP confirmation code. On successful auth, `userStore.initialize()` calls `loadProfile()` to fetch gold, achievements, campaign progress, and design unlocks from the `profiles` table.

Account deletion uses a soft-delete approach via `delete_requested_at` timestamp. A Supabase Edge Function (`backend/functions/validate-user/`) handles any server-side auth validation.

### Email (Brevo SMTP)

Auth emails (OTP verification, password reset) are sent through Brevo's free SMTP relay instead of Supabase's default mailer. Configuration is done once in the Supabase dashboard:

1. Create a free account at [brevo.com](https://brevo.com) and verify your sender email under **Senders & IP**
2. Get SMTP credentials: click your avatar → **SMTP & API → SMTP** tab
3. In Supabase dashboard: **Authentication → Emails → SMTP Settings** → enable Custom SMTP:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: your Brevo SMTP login (email address)
   - Password: your Brevo SMTP key (not your account password)
   - Sender email: your verified Brevo sender address
4. In Supabase: **Authentication → Emails → Templates → Confirm signup** → replace the body with just `{{ .Token }}` so users receive the 6-digit code directly instead of a magic link

### RLS Trigger

The `profiles` table requires a trigger that automatically inserts a row on new user signup:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, gold, campaign_progress)
  VALUES (new.id, 0, '{}');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### User CRUD

All user data lives in `userStore.js`:
- `gold`, `achievements` (Set), `campaignProgress`, `quizStats`, `unlockedDesigns[]`, `endlessMinutes`
- `loadProfile()` — reads from `profiles` table on init/login
- `saveCampaignProgress(levelNum, stars, elapsed)` — upserts `campaign_progress` JSONB
- `unlockAchievements(keys[])` — upserts `achievements` rows (no-op for guests)
- `addGold(amount)` — updates `profiles.gold`

---

## Supabase Schema

See `supabase/schema.sql`. Key columns on the `profiles` table: `id`, `gold`, `campaign_progress` (JSONB), `achievements`, `unlocked_designs` (JSONB), `endless_minutes` (float).

---

## Key Implementation Rules

1. **`totalPixelsProduced` is append-only** — never decremented, used for win condition.
2. **In-level shop uses produced pixels** — `pixelsSpentInShop` tracks spending; win condition unaffected.
3. **Permanent shop uses gold** — grid styles, shop-only designs, speed boosts.
4. **Block move resets**: `reactorAge` and `echoAge` reset to 0 on move.
5. **Design pixel art is immutable** — `pixelLayout` is always read from the design library, never from user edits.
6. **`pixelCount` and `dominantColor` are precomputed** in the design library — do not recompute at runtime.
7. **`buildSynergyData(grid)`** returns `synergyMap`, `bonusMap`, and `activeList` — used by `productionEngine` and `ActiveEffectsPanel`.
8. **Focus effect is deterministic** — `focusColor = dominantColor`, multiplier = `1 + (dominantColorCount / pixelCount)`, fixed per design.
9. **Color Checker always triggers on placement** — the design's dominant color is precomputed at ≥50%, so placing a color_checker design always reduces required output by 5%.
10. **Speed boosts are permanent** — `shopStore.purchasedSpeeds`; affect both production AND timer.
11. **Text selection disabled globally** — `user-select: none` on `body`; re-enabled for `input`/`textarea`.
12. **Supabase only for**: auth, gold, campaign_progress, achievements, endless_scores, profiles CRUD.
13. **Achievements require login** — guest players cannot earn achievements.
14. **Never commit env files** — `frontend/.env` gitignored.

---

## Deployment

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

## Learning System

Parallel computing education via `LearningCard` (post-level) and Endless quizzes.
- Levels 1–12 show a fact card after completion.
- Levels 13+ show a multiple-choice quiz; correct answers accumulate toward design unlock milestones (25 and 50).
- Endless mode has its own quiz pool with separate rewards.

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
| Deck selection (3 designs) | Thread pool configuration — choosing which thread types to instantiate |
| Reactor warm-up | Thread spin-up cost — a newly launched process takes time to reach full throughput |
| Echo locality bonus | Cache warming — a stationary process benefits from hot data |
| Splitter work distribution | Work broadcasting — a thread pushes partial load to its neighbors |
| Void coordinator | Dedicated coordinator thread — zero output, but amplifies surrounding workers |

---

## Changelog (recent refactors)

### Phase 1 — UX Quick Fixes ✅
- **Tutorial card auto-positioning:** `TutorialOverlay.jsx` now detects whether the spotlight target is on the right half of the screen. If so, the card renders on the left (`left:16`) instead of always `right:16` — fixes overlap with Output Panel and Active Effects panel spotlights.
- **Shop sidebar deck cards:** `ShopSidebar.jsx` now renders a purchasable card for each design in `deckDesignIds` (deduplicated). Cards show design thumbnail, block type, and pixel cost. Clicking calls `buyDesignFromShop` from `gameStore` (already capped at 2 per design per level). Random Block remains as a secondary option below the deck cards.

### Phase 2 — Production System Cleanup ✅
- **Removed pixelCount guards** from `productionEngine.js` (lines 69, 95) — blocks no longer skip if `pixelCount` is 0/falsy; guard now checks block type explicitly.
- **Doubler** reworked: ×2 when **no orthogonal neighbor shares the same series** (series-isolated condition).
- **CrossAmp** bonus: flat `0.5 px/s` per active diagonal cross_amp neighbor (was `pixelCount / 10`).
- **Greedy** gold: `(myRate − avgNeighborRate) × 20` using rateMap (was pixelCount comparison).
- **Forge** gold: `rate × 6` at level end using rateMap (was `pixelCount × 3`).
- **Catalyst/Splitter** guards: removed `pixelCount > 0` checks.
- **Focus** effect: flat +50% multiplier (removed dominantColor ratio).
- **Block.jsx** — `isActive` no longer needs `pixelCount > 0`; `cycleDuration` replaced with fixed `WAVE_CYCLE_S = 2.0s`; `fillRatio` uses series-based constant; `floatAmount = rate × 2.0s`.
- **Reactor pulsing**: overlay div on reactor blocks with `breathe` animation that speeds up as `reactorAge` grows. Color interpolates orange → red. Added `@keyframes breathe` and `urgentPulse` to `index.css`.
- **Type stripe**: increased from 3px to 4px, glows with `typeColor` when block is active.
### Phase 3 — Game Design Changes ✅
- **Family choice milestones** (replaces single-design choice): At levels 10, 15, 20, 25, 30+ the player picks 1 of 2 series and receives all 10 core designs from that family. `getFamilyChoiceForLevel()` and `getFamilyPackDesigns()` added to `designLibrary.js`. `shouldShowFamilyChoice()` replaces `shouldShowDesignChoice()` in `designUnlocks.js`. `FamilyChoiceModal` replaces `DesignChoiceModal` in `Level.jsx`.
- **Starter designs → all flowers**: 10 flower designs (daisy, rose, tulip, lily, hibiscus, lotus, poppy, marigold, lavender, peony) are now `unlockSource: 'starter'`. Former starters (oak, house, star, cat, circle, apple, heart, snowflake, mountain) changed to `campaign_family` — earned via family choice milestones.
- **Preset decks — DeckSelector removed**: All campaign levels now use `presetDeck: [...]` defined in `levelConfig.js`. Levels 6-10 have hand-crafted synergy-focused decks. Levels 11-200 use `generatePresetDeck(levelNum)` cycling through 10 thematic patterns. `DeckSelector` component no longer rendered.
- **Preset deck in shop**: `ShopSidebar` receives `deckDesignIds` from `activeDeck` (set by `startLevelWithDeck`) and shows buyable cards for those designs.
### Phase 6 — Synergy Collection System ✅
- **`discoveredSynergies`** added to `userStore` (persisted to `profiles.discovered_synergies` JSONB). Auto-discovered when any synergy first activates in `ActiveEffectsPanel.jsx` (calls `discoverSynergy(id)`).
- **Basic synergies** (always visible, no discovery needed): DOUBLE_DOWN, REACTOR_NETWORK, ECHO_CHAMBER, SPECIALIST, BEE_AND_FLOWER. Defined in `BASIC_SYNERGY_IDS` constant.
- **Profile → Synergies tab**: Progress bar, type filter strip, and a card list for all synergies. Discovered cards show: type badge (colored), synergy name, bonus summary (`getSynergyHint` + `getBonusSummary`), reward. Locked cards show "??? Unknown Synergy" with a vague hint and "Roll to reveal" message. Live count in tab label (X/Y).
- **Shop → Synergy Compendium section**: `synergyScrollCount` stored in `shopStore` (localStorage). Roll cost = `min(50 + count×25, 500g)`. Reveals one random undiscovered synergy; previews the just-revealed synergy name + type in the section. "Complete" state when all synergies discovered.
- **`TYPE_LABELS` and `TYPE_COLORS`** reused in both Profile and Shop for consistent synergy type presentation.

### Phase 5 — Synergy, Tutorial, Shop, Music, Level-Tint ✅
- **Synergy overhaul**: Removed all `series_count`, `row_series`, `column_series` synergy types (boring count-based). Kept adjacency_pair, long_range, core_radius, block_type_count, cross_family, meta_synergy. Added 4 **mega synergies** (cross_family, maxSpan:12, 8-10 designs): GRAND_TAPESTRY, COSMIC_BLOOM, PRIMAL_MACHINE, WORLD_SPIRIT. Updated meta synergies to reference remaining synergies: PRIMORDIAL_GROVE (BLOOMING_CORE+ECOSYSTEM), DEEP_SPACE (SOLAR_SYSTEM+DISTANT_STARS), etc. Added BATTLE_COURT, BLOOD_MOON, and 3-requirement COSMIC_NEXUS (ultimate meta).
- **Tutorial = flowers only**: All 5 tutorial levels now give only flower-family starting blocks and flower-family shop decks. TutorialOverlay step text updated accordingly.
- **Wave pulse = 4 seconds**: `WAVE_CYCLE_S = 4.0` in Block.jsx — one satisfying 4s pulse at base rate gives ~4px per float.
- **Shop deck redesign**: Removed random block from ShopSidebar entirely. Added `ShopDeckSelector` component (pick up to 8 designs pre-level from collection). Non-tutorial levels show this selector before gameplay; confirmed designs populate the shop. Preset starter blocks (2 copies per design from `config.presetDeck`) are given free at level start, separate from the shop deck.
- **Music redesign**: Menu track redesigned as C major pentatonic, 52 BPM, very quiet triangle drones — warm and non-creepy. All level tracks bumped by ~8-12 BPM for more energy. Drone gains reduced, arpeggio patterns more varied. Endless track now 10-note melodic pattern.
- **Level tint**: `SERIES_TINT` map in `levelConfig.js` maps each series to a subtle bg/rim/accent palette. `Level.jsx` computes the dominant series from `config.presetDeck` and tints the game container background accordingly (flowers → purple, trees → green, celestial → violet, space → deep blue, etc.).

### Phase 4 — Void Interface Visual Retheme ✅
- **Complete palette retheme**: Replaced blue-navy (`#0a0a18`) with cosmic void (`#06061a`). New Tailwind tokens: `void-bg`, `void-card`, `void-border`, `void-rim` etc. Action colors: `neon-indigo` (#6366f1), `neon-cyan` (#22d3ee), `neon-green` (#34d399), `neon-yellow` (#fbbf24). Legacy `game-*` / `pixel-*` aliases kept for compatibility.
- **index.css**: New CSS custom properties `--glow-indigo/cyan/green/yellow/red/violet/orange`. Cards use `linear-gradient(145deg,...)` with top-edge highlight. Progress bars are 8px tall with `linear-gradient(90deg, #6366f1, #22d3ee)`. Buttons redesigned with void palette. Added `.scanlines` pseudo-element, `@keyframes drift`, `breathe`, `urgentPulse`.
- **LevelHUD**: 4-tier timer urgency (white → yellow → orange → red with pulse). Stars glow via `--glow-yellow`. Progress bar uses gradient fill. Void card header styling.
- **PixelCounter**: px/s number glows with `--glow-indigo` (green when complete). Bigger +N floats with green text-shadow. Panel glows green on completion.
- **ActiveEffectsPanel**: Active synergy rows have a 4px colored left border stripe in the synergy's `typeColor`. Progress bars use typeColor fill. Header uses `void-ghost` style.
- **Home.jsx**: Cosmic dust particles (5 drifting dots). Neon rule below title. "FACTORY" glows indigo. Gradient separator in auth strip. Campaign button glows.
- **TutorialOverlay**: Glassmorphic card (`blur(20px)`, semi-transparent void bg, accent-colored border).
- **BlockSlot.jsx**: Void colors for empty cells (`radial-gradient` bg). Indigo drag-over state with inner glow. Move target animation in indigo.
- **Block.jsx**: Type stripe 4px + glows when active. Reactor pulsing overlay (breathe animation, orange→red).
- **Grid container (Level.jsx)**: `.scanlines` overlay for CRT texture effect.
- **Replay penalty**: Replayed levels give 10% gold (first completion still gives 100%). Checked via `campaignProgress[levelNum]?.stars`.
- **Impeccable**: Zero anti-patterns detected after retheme.
