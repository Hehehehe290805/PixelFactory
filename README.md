# PixelFactory

A browser-based **idle/strategy game** about parallel programming. Each block on the grid is an independent process producing pixels per second — just like parallel threads contributing to a shared output. Choose pre-designed art blocks from your collection, place them on a 12×12 grid, and optimize your layout using design synergies, block effects, and spatial patterns to hit pixel output targets.

---

## Play It

Live at: **https://Hehehehe290805.github.io/PixelFactory/**

---

## How It Works

### Core Loop

1. **Pick your shop deck** — Before each non-tutorial level, choose up to 8 designs from your collection to populate the in-level shop. Tutorial levels (1–5) give preset flower blocks directly.
2. **Play** — Buy designs from the in-level shop using produced pixels, place them on the grid; the engine ticks every 100 ms producing pixels in parallel
3. **Win** — Reach the required pixel total before time runs out (or in Endless: survive as long as possible)

### Designs & Block Types

Every block on the grid is a **design** — a fixed 16×16 pixel artwork that comes bundled with a specific **block type** (its effect). Designs are grouped into 12 **series** (flowers, trees, buildings, celestial, animals, shapes, food, symbols, weather, landscapes, space, abstract). The pixel art is decorative; the series and block type determine gameplay.

**19 block types:**

| Block | Effect |
|---|---|
| **Base** | `SERIES_RATE[series]` px/s — space/celestial: 0.7, most series: 1.0, trees/food/landscapes/abstract: 1.3 |
| **Doubler** | ×2 when no orthogonal neighbor shares this block's series |
| **Cross Amp** | Adds +0.5 px/s flat to each diagonal neighbor |
| **Color Checker** | Dominant color ≥50% → −5% required output (once, on placement) |
| **Greedy** | On complete: `(myRate − avgNeighborRate) × 20` gold when above average |
| **Amplifier** | +8% per occupied neighbor (all 8) |
| **Resonator** | +50% if any ortho neighbor is same block type |
| **Reactor** | Ramps 50%→200% over 15 s; resets on move |
| **Echo** | +4% per 10 s stationary (max +80%) |
| **Prism** | +5% per unique non-white color in design's pixel art (max +30%) |
| **Conductor** | Borrows highest synergy bonus from adjacent blocks |
| **Splitter** | Gives ortho neighbors +20% of own rate |
| **Focus** | Flat ×1.5 output multiplier |
| **Cluster** | +12% per occupied neighbor (excl. void) |
| **Forge** | On complete: `rate × 6` gold (min 5g) based on production rate |
| **Overflow** | 3× burst for 5 s every 10 s (shop-only) |
| **Mirror** | Copies best ortho neighbor rate (shop-only) |
| **Catalyst** | Synergy bonuses in same row ×1.5 (shop-only) |
| **Void** | 0 output; +15% to all 8 surrounding blocks (shop-only) |

---

## Design Synergy System

Synergies activate when designs are arranged in specific spatial patterns. There are **6 synergy types** and ~35 named synergies. All synergies have **3 levels** — bonuses scale at ×1.0 / ×1.6 / ×2.2 as you build more qualifying pairs.

### Synergy Types

**Adjacency Pair** — Two specific designs placed orthogonally adjacent.
> Example: Sun touching Moon → **Sun & Moon** (+100% both)

**Long Range** — Two qualifying designs at least N cells apart (Manhattan distance).
> Example: 2 space designs ≥7 apart → **Distant Stars** (+90% both, radiates +20% all-8)

| Synergy | Condition | L1 Bonus |
|---|---|---|
| Distant Stars | 2 space ≥7 apart | +90% · +20% all-8 |
| Antipodes | 2 landscapes ≥8 apart | +85% · +18% ortho |
| Polar Winds | weather + landscape ≥6 apart | +100% both |
| Wild Migration | 2 animals ≥6 apart | +85% · +18% ortho |
| Star Scatter | 2 celestial ≥8 apart | +105% · +22% all-8 |

**Core Radius** — One anchor block plus N satellites within a Manhattan radius.
> Example: Sun + 3 space designs within 2 cells → **Solar System** (Sun +120%, satellites +75%)

| Synergy | Core | Satellites | Radius | Core Bonus | Sat Bonus |
|---|---|---|---|---|---|
| Solar System | Sun | 3 space | 2 | +120% | +75% |
| Royal Court | Crown | 3 symbols | 2 | +110% | +70% |
| Ecosystem | any tree | 3 animals | 2 | +105% | +65% |
| Mountain Kingdom | Mountain | 3 landscapes | 2 | +110% | +70% |
| Blooming Core | any flower | 4 flowers | 2 | +120% | +70% |

**Cross-Family** — Specific designs from different series in a spatial zone. Some require adjacency; **Mega synergies** span the whole grid (10 designs).
> Example: Star + Snowflake + any tree → **Christmas Tree** (+100%, free random block!). 3 flowers + 3 celestial + 2 space + Sun anywhere → **Cosmic Bloom** (+160%, free random block!)

**Block Type Count** — N blocks of the same effect type anywhere.
> Example: 5 of the same effect type → **Specialist** (+90%, radiates +20% all-8). 3 echo blocks → **Echo Chamber** (+45%).

**Meta Synergy** — Requires two or more other synergies to be simultaneously active.
> Example: Blooming Core + Ecosystem both active → **Primordial Grove** (+75% to all synergy cells, free block!). All three of Deep Space + Primordial Grove + Beast Empire → **Cosmic Nexus** (+60% to ALL occupied cells!)

### Also: Implicit Adjacency Bonus

Any block with a same-series orthogonal neighbor gets a free **+15%** — separate from named synergies.

### Reading the Active Effects Panel

During a level, the right-side panel lists every synergy that is active or in progress. Click any entry to expand it and see:
- A **type badge** (ADJACENCY, LONG RANGE, CORE/RING, BLOCK TYPE, CROSS-FAMILY, META) — tells you the spatial pattern
- The current **bonus** and **level** (L1/L2/L3) if active
- **How to activate** — plain-language setup instructions
- **How many more** designs are needed

---

## Deck System

### Before Each Level
1. **ShopDeckSelector** opens — pick up to **8 designs** from your collection to populate the in-level shop. Tutorial levels (1–5) skip this.
2. Level starts with **preset free blocks** from the level's `presetDeck` config already in your inventory
3. Your chosen shop-deck designs appear in the in-level shop for purchase

### In-Level Shop
- Shows your selected shop-deck designs (deduplicated); each purchase assigns a **random block type** from your unlocked pool
- Drag directly from the shop to the grid when you can afford it
- **2 copies max** per design per level
- **Sell zone** at the bottom of the shop — drag any block here to sell it for **20% of what you paid**
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
| Complete tutorial (levels 1–5) | 10 starter flower designs |
| Every 5th campaign level (10, 15, 20…) | Pick 1 of 2 series → receive all 10 core designs from that family |
| Permanent shop | 30 exclusive shop-only designs |
| Endless: survive 20 min total | Rainbow Prism design |
| Campaign: 25 correct quiz answers | Crystal Star design |
| Campaign: 50 correct quiz answers | Nebula design |
| Specific achievements | Cosmetic visual-only designs |

**Starter designs (all flowers, given after tutorial):** Daisy · Rose · Tulip · Lily · Hibiscus · Lotus · Poppy · Marigold · Lavender · Peony

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

- **Campaign** — 200 levels, 6 tiers (Tutorial → Grandmaster). Tutorial levels 1–5 (flower-only), hand-crafted 6–10, procedurally generated 11–200. Family choice modals unlock 10 designs every 5 levels (starting level 10).
- **Endless** — No time limit. Waves scale at ×1.6. Leaderboard on Supabase. Survive 20 total minutes to unlock the Rainbow Prism design.

---

## Profile

The **Profile** page shows your full design collection and synergy compendium:
- **Designs tab**: 200+ designs — unlocked in full color, locked as grayscale silhouettes with unlock hint; filter by series
- **Synergies tab**: all ~35 synergies — discovered ones show type badge + bonus; undiscovered show "??? Unknown Synergy". Synergies auto-discover when first activated in a level; you can also spend gold in the permanent shop to roll a reveal.

---

## Achievements

Categories: Campaign Progress, Stars, Design Collection, Production Milestones, Synergy Mastery, Gold & Blocks, Endless Mode, Shop Unlocks. Achievements require a logged-in account.

---

## Audio

All audio is synthesized at runtime using the **Web Audio API** — no audio files are bundled.

### Music
Each area has a distinct ambient track that loops indefinitely:

| Area | Track | Character |
|---|---|---|
| Menus / Lobby | Menu | A major, bright and inviting |
| Levels 1–10 | Intro | C major, calm and peaceful |
| Levels 11–30 | Apprentice | G major, warm and hopeful |
| Levels 31–60 | Craftsman | D minor, focused and rhythmic |
| Levels 61–100 | Expert | A minor, energetic and driving |
| Levels 101–150 | Master | E minor, intense and tense |
| Levels 151–200 | Grandmaster | B minor, epic and epic |
| Endless Mode | Endless | F lydian, meditative and flowing |

### Sound Effects

| Event | Sound |
|---|---|
| Block placed | Soft double-thud |
| Design purchased (pre-buy or shop) | Two-note coin ping |
| Synergy activates | Rising arpeggio — distinct pattern per synergy type |
| Achievement unlocked | Four-note triumphant chime |
| Level complete | Grand ascending fanfare + chord resolution |
| Design/unlock discovered | Seven-note magical shimmer |

### Volume Controls

Music and sound effects each have a separate volume slider and on/off toggle in **Settings**. Settings persist to localStorage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite — `frontend/` |
| Styling | Tailwind CSS + custom CSS keyframes |
| State | Zustand (`gameStore`, `userStore`, `shopStore`, `settingsStore`) |
| Animation | Framer Motion + CSS (`pixelWaveV/H/D`, `blockFillUp`) |
| Audio | Web Audio API — pure synthesis, no files |
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

Run `supabase/schema.sql` once in the SQL Editor to create all tables, policies, and triggers.

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

See [CLAUDE.md](CLAUDE.md) for full architecture and codebase reference.
