# PixelFactory

A browser-based **idle/strategy game** about parallel programming. Each block on the grid is an independent process producing pixels per second — just like parallel threads contributing to a shared output. Choose pre-designed art blocks from your collection, place them on a 12×12 grid, and optimize your layout using design synergies, block effects, and spatial patterns to hit pixel output targets.

---

## Play It

Live at: **https://Hehehehe290805.github.io/PixelFactory/**

---

## How It Works

### Core Loop

1. **Pick your deck** — Before each level, choose 10 designs from your unlocked collection
2. **Pre-buy** — Spend starting pixels to buy some deck designs into your opening hand
3. **Play** — Place blocks on the grid; the engine ticks every 100 ms producing pixels in parallel
4. **Win** — Reach the required pixel total before time runs out (or in Endless: survive as long as possible)

### Designs & Block Types

Every block on the grid is a **design** — a fixed 16×16 pixel artwork that comes bundled with a specific **block type** (its effect). Designs are grouped into 12 **series** (flowers, trees, buildings, celestial, animals, shapes, food, symbols, weather, landscapes, space, abstract). The pixel art is decorative; the series and block type determine gameplay.

**19 block types:**

| Block | Effect |
|---|---|
| **Base** | `floor(pixelCount / 37.5)` px/s |
| **Doubler** | ×2 if all 4 ortho neighbors have < half its pixelCount |
| **Cross Amp** | Adds flat px/s to each diagonal neighbor |
| **Color Checker** | Dominant color ≥50% → −5% required output (once, on placement) |
| **Greedy** | On complete: gold based on pixel surplus vs. neighbors |
| **Amplifier** | +8% per occupied neighbor (all 8) |
| **Resonator** | +50% if any ortho neighbor is same block type |
| **Reactor** | Ramps 50%→200% over 15 s; resets on move |
| **Echo** | +4% per 10 s stationary (max +80%) |
| **Prism** | +5% per unique non-white color in design's pixel art (max +30%) |
| **Conductor** | Borrows highest synergy bonus from adjacent blocks |
| **Splitter** | Gives ortho neighbors +20% of own rate |
| **Focus** | Output = `pixelCount/37.5 × (1 + dominantColorRatio)` |
| **Cluster** | +12% per occupied neighbor (excl. void) |
| **Forge** | On complete: +3 gold per pixel held |
| **Overflow** | 3× burst for 5 s every 10 s (shop-only) |
| **Mirror** | Copies best ortho neighbor rate (shop-only) |
| **Catalyst** | Synergy bonuses in same row ×1.5 (shop-only) |
| **Void** | 0 output; +15% to all 8 surrounding blocks (shop-only) |

---

## Design Synergy System

Synergies activate when designs are arranged in specific spatial patterns. There are **7 synergy types**:

### 1. Series Count — place N of the same series anywhere
> Example: 5 flower designs anywhere on the grid → **Garden** (+20% each, +8% ortho radiation)

All 12 series have both a full-tier (4–5 designs) and a mini-tier (2 designs) synergy. Once enough designs of a series are on the grid the bonus applies regardless of where they sit.

### 2. Exact Count — place N copies of the exact same design
> Example: 3 Rose designs → **Rose Parade** (+25% each)

### 3. Adjacency Pair — place two specific designs side by side
> Example: Sun touching Moon → **Sun & Moon** (+30% both). Must be orthogonally adjacent (no diagonal).

### 4. Row Series — place N of the same series in the same horizontal row
> Example: 4 buildings in one row → **City Block** (+28% that row)

### 5. Long Range — place two designs at least N cells apart
> Example: 2 space designs ≥5 cells apart → **Distant Stars** (+25% both, radiates +8%)

Rewards spreading designs across the full grid. The Manhattan distance between the two qualifying blocks must meet or exceed `minDist`.

| Synergy | Condition | Bonus |
|---|---|---|
| Distant Stars | 2 space designs ≥5 apart | +25% · +8% all-8 radiation |
| Antipodes | 2 landscapes ≥6 apart | +22% · +6% ortho |
| Polar Winds | weather + landscape ≥5 apart | +28% both |
| Transcontinental | 2 buildings ≥5 apart | +20% · +7% ortho |
| Wild Migration | 2 animals ≥5 apart | +22% · +6% ortho |

### 6. Core Radius — place an anchor design, then surround it with satellites
> Example: Place Sun on the grid, then put 3+ space designs within 3 cells → **Solar System** (Sun +40%, satellites +20%)

One "core" block acts as an anchor. The bonus activates when enough "satellite" designs are placed within a radius (Manhattan distance) of the core. Core and satellites get different bonus values.

| Synergy | Core | Satellites | Radius | Core bonus | Satellite bonus |
|---|---|---|---|---|---|
| Solar System | Sun | 3 space designs | 3 | +40% | +20% |
| Royal Court | Crown | 3 symbol designs | 2 | +35% | +20% |
| Ecosystem | any tree | 3 animal designs | 2 | +25% | +18% |
| Mountain Kingdom | Mountain | 3 landscape designs | 2 | +30% | +18% |
| Blooming Core | any flower | 4 flower designs | 3 | +35% | +15% |

### 7. Block Type Count — place N blocks sharing the same effect type
> Example: 3 Echo blocks anywhere → **Echo Chamber** (+20% each, +7% ortho radiation). Any series works.

| Synergy | Block Type | Required | Bonus |
|---|---|---|---|
| Double Down | doubler | 3 | +25% · +8% ortho |
| Reactor Network | reactor | 2 | +30% · +10% all-8 |
| Echo Chamber | echo | 3 | +20% · +7% ortho |

### Reading the Active Effects Panel

During a level, the right-side panel lists every synergy that is active or in progress. Click any entry to expand it and see:
- A **type badge** (ADJACENT, LONG RANGE, RADIUS, BLOCK TYPE, etc.) — tells you the spatial pattern required
- The current **bonus** if active
- **How to activate** — plain-language setup instructions specific to that synergy type
- **How many more** designs are needed

---

## Deck System

### Before Each Level
1. **DeckSelector** opens — pick 10 designs from your unlocked collection
2. **Pre-buy phase** — spend starting pixels (`50 + level × 5`, capped at 300) to load some designs into your opening hand
3. The remaining deck designs appear in the **ShopSidebar** during the level

### In-Level Shop
- Shows all 10 chosen deck designs with pixel costs
- Drag directly from the shop to the grid when you can afford it
- Hover a design for its name, series, effect description, and cost
- **Bargain** grid style reduces all in-level costs by 20%

**Approximate design costs by block type:**

| Type | Cost (px) | | Type | Cost (px) |
|---|---|---|---|---|
| base | 13 | | focus | 42 |
| doubler | 39 | | cluster | 55 |
| cross_amp | 32 | | forge | 78 |
| color_checker | 26 | | overflow | 65 |
| greedy | 52 | | mirror | 58 |
| amplifier | 45 | | catalyst | 78 |
| resonator | 55 | | void | 45 |
| reactor | 91 | | | |

---

## Design Unlock Progression

| Source | Reward |
|---|---|
| Complete Level 1 (tutorial) | 10 starter designs — one per main series |
| Every 5th campaign level | Choose 1 of 2 specific designs |
| Permanent shop | 30 exclusive shop-only designs |
| Endless: survive 20 min total | Rainbow Prism design |
| Campaign: 25 correct quiz answers | Crystal Star design |
| Campaign: 50 correct quiz answers | Nebula design |
| Specific achievements | Cosmetic visual-only designs |

**Starter designs (given after tutorial):** Daisy · Oak · House · Star · Cat · Heart · Snowflake · Mountain · Circle · Apple

---

## Grid Styles (12 total — permanent shop)

| Style | Cost | Effect |
|---|---|---|
| Base | Free | — |
| Gold Rush | 500g | +15% gold per level |
| Overclock | 800g | +10% output |
| Efficiency | 600g | +20% time, −10% required |
| Bargain | 700g | In-level shop 20% cheaper |
| Quantum | 1000g | 2× burst every 30 s for 5 s |
| Neural | 700g | Synergy thresholds −1 (e.g. need 4 flowers instead of 5) |
| Industrial | 600g | +3% per 10 placed blocks |
| Synergy+ | 900g | All synergy bonuses +25% stronger |
| Cascade | 750g | Rows 6–11: +4% per row below row 5 |
| Overcharge | 850g | +25% output |
| Lattice | 650g | +35% for blocks with exactly 4 ortho neighbors |

---

## Game Modes

- **Campaign** — 200 levels, 6 tiers (Tutorial → Grandmaster). Hand-crafted levels 1–10, procedurally generated 11–200. Design choice modals unlock new designs every 5 levels.
- **Endless** — No time limit. Waves scale at ×1.6. Leaderboard on Supabase. Survive 20 total minutes to unlock the Rainbow Prism design.

---

## Profile

The **Profile** page shows your full design collection (200+ designs):
- **Unlocked**: full color with name, series, and effect
- **Locked**: grayscale silhouette with unlock hint
- Filter by series using the tabs at the top

---

## Achievements

Categories: Campaign Progress, Stars, Design Collection, Production Milestones, Synergy Mastery, Gold & Blocks, Endless Mode, Shop Unlocks. Achievements require a logged-in account.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite — `frontend/` |
| Styling | Tailwind CSS + custom CSS keyframes |
| State | Zustand (`gameStore`, `userStore`, `shopStore`, `settingsStore`) |
| Animation | Framer Motion + CSS (`pixelWaveV/H/D`, `blockFillUp`) |
| Routing | React Router v6 |
| Backend | Supabase (Auth + PostgreSQL + Edge Functions) |
| Deploy | GitHub Actions → GitHub Pages |

---

## Local Development

```bash
cd frontend
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

App runs at `http://localhost:5173/PixelFactory/`

---

## Deploy to GitHub Pages

1. Push to GitHub. Add two repository secrets under **Settings → Secrets → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Push to `main` — GitHub Actions auto-deploys to GitHub Pages.
3. In Supabase: **Authentication → URL Configuration** — add your Pages URL as both Site URL and Redirect URL.

---

## Database Setup (Supabase)

Run `supabase/schema.sql` once in the SQL Editor. For future changes, run only the changed block — not the full file (existing policies error on re-run).

Required columns (add if missing):
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_designs JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS endless_minutes FLOAT DEFAULT 0;
```

---

## Email Setup (Brevo SMTP)

1. Create a free account at [brevo.com](https://brevo.com) and verify your sender email
2. Get SMTP credentials: avatar → **SMTP & API → SMTP** tab
3. In Supabase: **Authentication → Emails → SMTP Settings** → enable custom SMTP:
   - Host: `smtp-relay.brevo.com` · Port: `587`
   - Sender: your verified Brevo address
4. Set the Confirm Signup template body to `{{ .Token }}` so users get a 6-digit code

---

## Environment Variables

| File | Contains | Committed? |
|---|---|---|
| `frontend/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Never |
| `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | Never |
| `frontend/.env.example` | Template — copy and fill | Yes |

See [CLAUDE.md](CLAUDE.md) for full architecture and implementation details.
