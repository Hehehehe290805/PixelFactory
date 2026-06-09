# CLAUDE.md — PixelFactory

## Project Overview

**PixelFactory** is a browser-based idle/strategy game that demonstrates parallel programming concepts through gameplay. Each block on the grid independently produces pixels (output) simultaneously — representing parallel processes running concurrently. Players design blocks, place them on a grid, and optimize their layout using synergies, set bonuses, and block interactions to hit pixel output targets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Styling | Tailwind CSS + custom pixel-accent components |
| Backend / Auth / DB | Supabase (Auth, PostgreSQL, Realtime) |
| State Management | Zustand |
| Animation | Framer Motion |
| Routing | React Router v6 |

### Why This Stack
- Supabase handles auth, cloud saves, leaderboards, and achievements with minimal backend code
- Zustand is lightweight and perfect for game state (grid state, pixel counts, timers)
- Framer Motion handles the block fill-up and pulse animations cleanly
- React + Vite for fast dev iteration

---

## Project Structure

```
pixelfactory/
├── public/
├── src/
│   ├── assets/               # Pixel art icons, grid textures
│   ├── components/
│   │   ├── game/
│   │   │   ├── Grid.jsx              # 12x12 main game grid
│   │   │   ├── Block.jsx             # Individual block component (16x16 canvas)
│   │   │   ├── BlockEditor.jsx       # 16x16 pixel painting interface
│   │   │   ├── BlockSlot.jsx         # Grid cell that holds a block
│   │   │   ├── PixelCounter.jsx      # Live stats: px/s, remaining, total
│   │   │   ├── ProductionEngine.jsx  # Parallel production simulation logic
│   │   │   └── LevelHUD.jsx          # Timer, progress bar, star indicator
│   │   ├── ui/
│   │   │   ├── MainMenu.jsx
│   │   │   ├── ShopModal.jsx
│   │   │   ├── SettingsModal.jsx
│   │   │   ├── BlockTemplates.jsx    # Template manager (home screen)
│   │   │   ├── AchievementToast.jsx
│   │   │   └── StarResult.jsx        # End-of-level star screen
│   │   └── auth/
│   │       ├── LoginModal.jsx
│   │       └── RegisterModal.jsx
│   ├── pages/
│   │   ├── Home.jsx           # Main menu: Campaign, Endless, Shop, Settings, Block Templates
│   │   ├── Campaign.jsx       # Level select (10 levels, star ratings shown)
│   │   ├── Level.jsx          # Core gameplay screen
│   │   ├── Endless.jsx        # Endless mode with highscore
│   │   ├── Shop.jsx
│   │   └── Profile.jsx        # Achievements, stats
│   ├── store/
│   │   ├── gameStore.js       # Zustand: grid state, blocks, pixel counts
│   │   ├── userStore.js       # Zustand: gold, inventory, templates, achievements
│   │   └── settingsStore.js
│   ├── engine/
│   │   ├── productionEngine.js   # Core parallel output calculation loop
│   │   ├── blockEffects.js       # All block type effect logic
│   │   ├── setDetector.js        # Detects pixel sets (MIDNIGHT, PRIMARY, etc.)
│   │   ├── synergyEngine.js      # Adjacent block synergy calculations
│   │   ├── dominanceChecker.js   # Color dominance logic (25% boost)
│   │   └── levelConfig.js        # All 10 level definitions
│   ├── lib/
│   │   ├── supabase.js           # Supabase client
│   │   └── constants.js          # Pixel colors, block types, pricing
│   └── main.jsx
├── supabase/
│   └── schema.sql                # DB schema
├── CLAUDE.md
└── package.json
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
- Cheapest block type

### Doubler Block
- **Cost:** 150 gold / 60 px
- **Effect:** Doubles its own output **if ALL 4 orthogonal neighbors (top, right, bottom, left) each have fewer than half the Doubler's pixel count**
- Reward for isolation strategy

### Cross Amplifier Block
- **Cost:** 120 gold / 50 px
- **Effect:** Adds `Math.floor(ownPixelCount / 10)` px/s to each of its 4 diagonal neighbors (top-left, top-right, bottom-left, bottom-right)
- Reward for diagonal placement strategy

### Color Checker Block
- **Cost:** 100 gold / 40 px
- **Effect:** Assigned a random color at placement. If ≥50% of its pixels match that color, reduces the level's **remaining required output** by 5% (one-time trigger per level)
- Encourages color-intentional design

### Greedy Block
- **Cost:** 200 gold / 80 px
- **Effect:** On level completion, adds bonus gold: `(greedyPixelCount - sum of all 8 surrounding blocks' pixel counts) × 10` gold
- Only activates if Greedy block has more pixels than all 8 neighbors combined
- Reward for isolating one dense block

---

## Pixel Sets (Title Blocks)

A **Title Block** is a block whose pixel composition matches a defined set. Sets require:
1. Correct color composition (dominance of specific colors)
2. Minimum pixel count threshold

Sets can be purchased in the Shop (comes with a base template the player can edit), OR discovered in-level (triggers an achievement + bonus gold).

| Set Name | Colors Required | Min Pixels | Effect |
|---|---|---|---|
| PRIMARY | Red, Blue, Yellow only | 40 | +20% output for own block |
| MIDNIGHT | Blue and Violet only | 35 | +15% output + adjacent blocks (orthogonal) get +10% |
| PHILIPPINES | Red, Blue, Yellow, White | 45 | +10% output, orthogonal neighbors get +5% |
| GRASS | Yellow and Green only | 30 | +12% output, diagonal neighbors get +8% |
| SUNSET | Red, Yellow, Orange only | 38 | +18% output for own block |

**Synergy Bonus:** If two orthogonally adjacent blocks both have the **same set**, each gets an additional **+15% production boost** on top of their set bonus.

---

## Shop Items

### Grid Styles (Permanent upgrades, one active at a time)
| Style | Cost | Effect |
|---|---|---|
| Base Grid | Free | No bonus |
| Gold Rush | 500 gold | +15% gold gain after each level |
| Overclock | 800 gold | +10% pixel output across all blocks |
| Efficiency | 600 gold | +20% time limit, -10% required output |
| Bargain | 700 gold | Blocks and pixels 20% cheaper in-level |

### Special Blocks (unlockable, then buyable in-level)
| Block | Shop Unlock | In-Level Cost | Effect |
|---|---|---|---|
| Overflow Block | 300 gold | 100 px | Stores excess pixels per tick; releases a burst every 10s equal to 5s worth of production |
| Mirror Block | 250 gold | 90 px | Copies the output rate of the highest-producing orthogonal neighbor (does not stack) |
| Catalyst Block | 350 gold | 120 px | Multiplies synergy bonuses in its row by 1.5x |
| Void Block | 200 gold | 70 px | Produces 0 pixels itself, but removes adjacency penalties from all neighbors |

### Other Shop Items
| Item | Cost | Notes |
|---|---|---|
| Rainbow Pixel (unlock) | 1000 gold | Permanently unlocks rainbow pixels; in-level cost = white pixel price |
| Block Template Slot +1 | 200 gold | Increases saved template slots (base: 5 slots) |
| Pixel Pack (10) | 30 gold | 10 colored pixels of player's choice |
| Pixel Pack (25) | 70 gold | |
| Pixel Pack (50) | 130 gold | |
| Pixel Pack (100) | 240 gold | |

---

## Block Templates

Accessible from the **Home screen** via the "Block Templates" button.

- Players can pre-design blocks (16x16 canvas) and save them as named templates
- Templates store pixel layout and color
- In-level, players can purchase a template block directly from the in-level shop (pays pixel cost for all pixels inside it)
- If a design activates a Title Set (e.g., MIDNIGHT) in-level and the player hasn't saved that set template yet, they are prompted to save it
- Prebuilt templates provided by the game (labeled "Official") cannot be edited but can be purchased as a base
- Base template slots: 5 (expandable via Shop)

---

## Level System (Campaign)

### Scoring
| Performance | Stars | Gold Reward |
|---|---|---|
| Completed in ≤30% of time limit | 3 stars | 100% gold |
| Completed in 31–70% of time limit | 2 stars | 70% gold |
| Completed in >70% of time limit | 1 star | 50% gold |

### Level Definitions

| Level | Required Output | Time Limit | Blocks Given | Notes |
|---|---|---|---|---|
| 1 (Tutorial) | 500 px | 120s | 1 Base Block, 20 white pixels | Tutorial: handholding, step-by-step |
| 2 | 1,200 px | 150s | 2 Base Blocks, 30 pixels | Intro to color pixels |
| 3 | 2,500 px | 180s | 3 Blocks (mixed), 50 pixels | Introduce Doubler Block |
| 4 | 4,000 px | 200s | 4 Blocks, 60 pixels | Introduce Cross Amplifier |
| 5 | 7,000 px | 220s | 5 Blocks, 80 pixels | Introduce Color Checker |
| 6 | 12,000 px | 240s | 6 Blocks, 100 pixels | Introduce Greedy Block |
| 7 | 20,000 px | 260s | 7 Blocks, 120 pixels | First set puzzle (GRASS hint) |
| 8 | 35,000 px | 280s | 8 Blocks, 140 pixels | Synergy introduced |
| 9 | 60,000 px | 300s | 10 Blocks, 160 pixels | Dominance mechanic highlighted |
| 10 | 100,000 px | 330s | 12 Blocks, 200 pixels | All mechanics in play |

---

## Endless Mode

- No time limit
- Starts at 500 px required output
- Each wave: `requiredOutput = previousOutput * 1.6`
- Player keeps their grid between waves (blocks persist)
- In-level shop available between waves
- Highscore = highest wave reached, synced to **Supabase leaderboard**
- Leaderboard shows: Username, Highest Wave, Total Pixels Produced

---

## In-Level Stats HUD

Always visible during gameplay:
- **Pixels/second** (live, updates every tick)
- **Total pixels produced** (never decreases)
- **Pixels spent** (tracked separately)
- **Progress bar** (based on total produced vs required; spending does not reduce bar)
- **Remaining pixels needed** (required - total produced)
- **Timer** (countdown for Campaign; stopwatch for Endless)
- **Star indicator** (live preview of current star rating based on time elapsed)

---

## Visual Design

**Theme:** Clean modern UI with pixel accents.

- Grid background: subtle dot-grid or clean tile lines
- Blocks: rounded tiles with visible 16x16 pixel art inside at all times
- **Production animation:** Block fills up with a colored overlay (matching dominant color or white), then **pulses outward** on each output tick
- Active synergy lines: faint glowing lines between synergized blocks
- Dominance aura: soft glow radiating from dominant blocks to their 8 neighbors
- Font: Clean sans-serif (Inter or similar) with pixel-style headers
- Color palette: Dark background (#0f0f1a), light card surfaces, vibrant pixel colors

---

## Database Schema (Supabase)

```sql
-- Users (handled by Supabase Auth, extended below)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  gold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory: pixels and blocks owned outside of levels
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  item_type TEXT NOT NULL, -- 'pixel', 'block', 'grid_style', 'special_unlock'
  item_key TEXT NOT NULL,  -- e.g. 'pixel_red', 'block_doubler', 'style_overclock'
  quantity INTEGER DEFAULT 0
);

-- Block Templates
CREATE TABLE block_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  pixel_layout JSONB NOT NULL, -- 16x16 array of color values
  set_type TEXT,               -- e.g. 'MIDNIGHT', null if no set
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Progress
CREATE TABLE campaign_progress (
  user_id UUID REFERENCES profiles(id),
  level_number INTEGER,
  stars INTEGER DEFAULT 0,
  best_time_seconds INTEGER,
  PRIMARY KEY (user_id, level_number)
);

-- Endless Highscores (leaderboard)
CREATE TABLE endless_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  username TEXT NOT NULL,
  highest_wave INTEGER NOT NULL,
  total_pixels_produced BIGINT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);
```

---

## Achievements

| Key | Name | Condition |
|---|---|---|
| `first_level` | Factory Floor | Complete Level 1 |
| `three_star_any` | Perfectionist | Get 3 stars on any level |
| `three_star_all` | Pixel Perfect | Get 3 stars on all 10 levels |
| `discover_midnight` | Night Shift | Discover MIDNIGHT set in-level |
| `discover_primary` | Color Theory | Discover PRIMARY set in-level |
| `discover_all_sets` | Set Master | Discover all 5 sets in-level |
| `greedy_10k` | Gold Digger | Earn 10,000 bonus gold from Greedy Blocks total |
| `endless_wave_10` | Infinite Factory | Reach Wave 10 in Endless |
| `endless_wave_25` | Overclocker | Reach Wave 25 in Endless |
| `rainbow_unlock` | Spectrum | Purchase Rainbow Pixel unlock |
| `templates_maxed` | Blueprint Master | Fill all template slots |
| `dominate_color` | Dominant | Trigger color dominance on 8 blocks simultaneously |

---

## Production Engine Logic (pseudocode)

```js
// Runs every 100ms (10 ticks/second)
function gameTick(grid) {
  let totalThisTick = 0;

  for each block in grid.placedBlocks {
    if (block.pauseTimer > 0) {
      block.pauseTimer -= 100;
      continue; // skip production during 5s move cooldown
    }

    let rate = baseRate(block);               // pixelCount * 0.8
    rate *= setBonus(block);                   // Title set multiplier
    rate *= synergyBonus(block, grid);         // Adjacent same-set bonus
    rate += crossAmplifierBonus(block, grid);  // Diagonal CA block contributions
    rate *= doublerCheck(block, grid);         // 2x if neighbors all < half
    rate *= dominanceBoost(block, grid);       // 25% if neighbor is dominant

    totalThisTick += rate / 10; // divide by 10 since we tick 10x/sec
  }

  gameState.totalPixelsProduced += totalThisTick;
  gameState.displayPixels = gameState.totalPixelsProduced; // never decreases
}
```

---

## Key Implementation Notes for Claude Code

1. **Never decrease the progress bar.** `totalPixelsProduced` is append-only. Spending pixels in-level is tracked in a separate `pixelsSpent` counter. The progress bar always uses `totalPixelsProduced`.

2. **Block move cooldown.** When a block is dragged to a new slot, set `block.pauseTimer = 5000`. Retain all other block state (pixel layout, accumulated set bonuses, etc.).

3. **Color dominance check.** Run after every block edit. A block is dominant if one non-white color ≥ 50% of its filled pixels. Dominant blocks add a `dominanceBoost = 1.25` multiplier to all 8 orthogonal+diagonal neighbors.

4. **Set detection.** Run `setDetector.js` whenever a block's pixel layout changes. Check color composition and pixel count against all set definitions. Assign `block.activeSet` accordingly. If set is newly discovered (not in user's template library and not purchased), trigger achievement flow.

5. **Greedy block gold.** Calculate only on level completion. `bonus = (greedyBlock.pixelCount - sumOf8Neighbors.pixelCount) * 10`. Only apply if result is positive.

6. **Doubler block.** Check all 4 orthogonal neighbors. Each neighbor must have `pixelCount < greedyBlock.pixelCount / 2`. If ALL pass, output × 2.

7. **Template save prompt.** After a level ends, check all blocks that activated a set. If `user.templates` does not contain that set type, show a modal: "You discovered [SET NAME]! Save this as a template?"

8. **Supabase Realtime** is not needed for core gameplay (all simulation is client-side). Only use Supabase for: auth, save/load progress, leaderboard writes, achievement unlocks.

9. **Game state persistence.** Auto-save grid state to Supabase on level exit and wave completion in Endless. On load, restore from last saved state.

10. **Endless mode between waves.** Pause the timer, show the in-level shop, let player buy blocks/pixels/templates, then continue. Grid state fully persists between waves.

---

## Deployment — GitHub Pages

### Why GitHub Pages needs special setup with Vite + React Router
GitHub Pages serves static files from a single URL. React Router uses client-side routing, which means refreshing any page other than `/` will return a 404. We fix this with a redirect trick. Supabase auth also needs the correct redirect URL configured.

### One-Time Setup

**1. Create the GitHub repo**
```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/pixelfactory.git
```

**2. Install the GitHub Pages deploy plugin**
```bash
npm install --save-dev gh-pages
```

**3. Set the base path in `vite.config.js`**
```js
export default defineConfig({
  base: '/pixelfactory/', // must match your repo name exactly
  plugins: [react()],
})
```

**4. Add deploy scripts to `package.json`**
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

**5. Fix React Router for GitHub Pages**

Create `public/404.html` with this content — it redirects all 404s back to `index.html` with the path preserved:
```html
<!DOCTYPE html>
<html>
  <head>
    <script>
      const path = window.location.pathname;
      window.location.replace(
        window.location.origin + '/?p=' + encodeURIComponent(path)
      );
    </script>
  </head>
</html>
```

Then in your `main.jsx`, add this before rendering:
```js
// Restore path from GitHub Pages 404 redirect
const params = new URLSearchParams(window.location.search);
const redirectPath = params.get('p');
if (redirectPath) {
  window.history.replaceState(null, '', redirectPath);
}
```

**6. Configure Supabase Auth redirect URLs**

In your Supabase dashboard → Authentication → URL Configuration:
- **Site URL:** `https://YOUR_USERNAME.github.io/pixelfactory`
- **Redirect URLs:** `https://YOUR_USERNAME.github.io/pixelfactory/**`

**7. Environment variables**

Create `.env` in project root (never commit this):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add `.env` to `.gitignore`. For GitHub Pages to use these, you must add them as **GitHub Actions secrets** (see below).

### Deploying

**Manual deploy (simple):**
```bash
npm run deploy
```
This builds the project and pushes the `dist/` folder to the `gh-pages` branch automatically.

Your live URL will be:
```
https://YOUR_USERNAME.github.io/pixelfactory/
```

### Automatic Deploy via GitHub Actions (recommended)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to gh-pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Add your Supabase keys in: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

### Important GitHub Pages Limitations to Know
- **No server-side code.** All logic must be client-side (this is fine — our engine is already fully client-side).
- **Supabase calls go directly from browser to Supabase.** Never put your Supabase service role key in the frontend — only use the `anon` key.
- **Custom domain** is possible later (Settings → Pages → Custom domain) if you want `pixelfactory.gg` or similar.

---

## Development Phases

### Phase 1 — Core Loop
- [ ] Vite + React + Supabase setup
- [ ] Auth (register, login, profile)
- [ ] 12x12 grid with drag-and-drop block placement
- [ ] 16x16 block pixel editor
- [ ] Production engine (game tick, base output)
- [ ] Level 1 (tutorial) fully playable
- [ ] Progress bar + HUD stats

### Phase 2 — Block Types & Effects
- [ ] All 5 block types implemented
- [ ] Doubler, Cross Amplifier, Color Checker, Greedy logic
- [ ] Block move cooldown (5s pause)
- [ ] Block fill + pulse animation

### Phase 3 — Sets & Synergies
- [ ] Set detector (all 5 sets)
- [ ] Synergy engine (adjacent same-set bonus)
- [ ] Color dominance checker
- [ ] Achievement triggers for set discovery

### Phase 4 — Campaign & Levels
- [ ] All 10 levels configured
- [ ] Star rating system
- [ ] Gold reward calculation
- [ ] Level select screen with star display

### Phase 5 — Shop & Templates
- [ ] Shop UI (grid styles, special blocks, pixel packs, rainbow unlock)
- [ ] Block Template manager (home screen)
- [ ] In-level shop (buy templates, pixels, blocks)
- [ ] Template save prompt on set discovery

### Phase 6 — Endless & Leaderboard
- [ ] Endless mode wave system
- [ ] Highscore tracking
- [ ] Supabase leaderboard

### Phase 7 — Polish
- [ ] All achievements
- [ ] Settings (volume, tutorial toggle, etc.)
- [ ] Responsive layout
- [ ] Prebuilt official templates