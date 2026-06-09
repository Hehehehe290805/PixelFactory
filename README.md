# PixelFactory

A browser-based **idle/strategy game** about parallel programming. Each block on the grid is an independent process producing pixels simultaneously — just like parallel threads contributing to a shared output. Design blocks, place them on a 12×12 grid, and optimize your layout using synergies, set bonuses, and block interactions to hit the pixel output targets.

---

## Play It

Deployed on GitHub Pages:  
**https://GITHUB_USERNAME.github.io/pixelfactory/**

---

## Features

### Core Gameplay

- **12×12 grid** — drag, place, move, and remove blocks freely during a run
- **16×16 pixel editor** — paint individual pixels onto each block to power its output
- **Game tick engine** (100 ms / 10 ticks per second) — all blocks produce in parallel every tick
- **Progress bar** that never decreases — pixel total is append-only; spending is tracked separately
- **Block move cooldown** — moving a block pauses its production for 5 seconds

### Block Types (15 total)

| Block | Effect |
|---|---|
| **Base** | Output = pixels × 0.8 px/s |
| **Doubler** | ×2 output if all 4 orthogonal neighbors have < half its pixels |
| **Cross Amplifier** | Adds flat px/s to each diagonal neighbor |
| **Color Checker** | Assigned a random color — when ≥50% pixels match, cuts required output by 5% |
| **Greedy** | On complete: earns gold based on pixel surplus vs. neighbors |
| **Overflow** | Bursts at 3× output for 5 s every 10 s |
| **Mirror** | Copies the output rate of its best orthogonal neighbor |
| **Catalyst** | Synergy bonuses in its row are ×1.5 |
| **Void** | Produces 0 px; gives +15% to all 8 surrounding blocks |
| **Amplifier** | +8% per occupied neighbor (max +64%) |
| **Resonator** | +50% if any orthogonal neighbor is the same type |
| **Reactor** | Ramps from 50% → 200% output over 15 s; resets on move |
| **Conductor** | Borrows the highest set bonus from adjacent blocks |
| **Prism** | +5% per unique non-white color in its pixels (max +30%) |
| **Echo** | +4% per 10 s stationary (max +80%) |
| **Splitter** | Gives orthogonal neighbors a flat +20% of its own rate |
| **Focus** | Assigned a color at placement; output scales from ×1 → ×2 based on color match |
| **Cluster** | +12% per occupied neighbor (all 8, excluding void) |
| **Forge** | On level complete: +3 gold per pixel held |

### Pixel Colors (11 total)

Standard (always available): **White, Red, Orange, Yellow, Green, Blue, Violet**  
Unlockable from Shop: **Rainbow** (wildcard), **Silver** (2× output weight), **Gold** (+5 gold/pixel on complete), **Neon** (1.5× output weight)

### Pixel Sets (15 sets)

Blocks whose pixels exclusively match a set's color list (meeting the minimum pixel count) activate a bonus on that block and optionally radiate to neighbors.

**Original:**

| Set | Colors | Min Px | Own Bonus | Radiation |
|---|---|---|---|---|
| PRIMARY | Red, Blue, Yellow | 40 | +20% | — |
| MIDNIGHT | Blue, Violet | 35 | +15% | Ortho +10% |
| PHILIPPINES | Red, Blue, Yellow, White | 45 | +10% | Ortho +5% |
| GRASS | Yellow, Green | 30 | +12% | Diag +8% |
| SUNSET | Red, Yellow, Orange | 38 | +18% | — |

**Standard-color sets (new):**

| Set | Colors | Min Px | Own Bonus | Radiation |
|---|---|---|---|---|
| OCEAN | Blue, Green | 32 | +18% | Ortho +8% |
| FIRE | Red, Orange | 28 | +20% | Diag +10% |
| ROYAL | Violet, Blue, Red | 38 | +24% | Ortho +12% |
| EMBER | Red, Orange, Violet | 42 | +28% | Diag +12% |
| TROPICS | Orange, Green, Blue | 42 | +26% | All-8 +8% |
| CORAL | Red, Orange, Green | 36 | +22% | Ortho +6% |

**Special-pixel sets:**

| Set | Colors | Min Px | Own Bonus | Radiation |
|---|---|---|---|---|
| SILVER_MIST | Silver, White | 40 | +22% | Ortho +6% |
| NEON_RUSH | Neon, Yellow, Green | 35 | +20% | Ortho +10% |
| AURORA | Green, Blue, Violet | 38 | +25% | All-8 +12% |
| SUNRISE | Orange, Yellow | 45 | +26% | Diag +10% |

**Synergy bonus:** Two orthogonally adjacent blocks with the same set each gain an additional **+15%**.

### Color Dominance

If a single non-white color makes up >50% of a block's pixels, all 8 surrounding blocks get **+25%** output.

### Grid Styles (12 total)

| Style | Cost | Effect |
|---|---|---|
| Base Grid | Free | No bonus |
| Gold Rush | 500g | +15% gold per level |
| Overclock | 800g | +10% all output |
| Efficiency | 600g | +20% time, −10% required |
| Bargain | 700g | Blocks & pixels 20% cheaper |
| Quantum | 1000g | 2× burst every 30 s for 5 s |
| Neural | 700g | Color Checker cuts −8% (not −5%) |
| Industrial | 600g | +3% per 10 placed blocks |
| Synergy+ | 900g | Same-set synergy is +25% (not +15%) |
| Cascade | 750g | Lower rows produce more (up to +24%) |
| Overcharge | 850g | +25% all output |
| Lattice | 650g | +35% for blocks with exactly 4 ortho neighbors |

### Game Modes

- **Campaign** — 200 levels across 6 tiers (Tutorial → Grandmaster). Hand-crafted levels 1–10, procedurally generated 11–200. Score ★ based on completion speed.
- **Endless** — No time limit. Waves scale at ×1.6. Leaderboard synced to Supabase.

### Shop & Templates

- Buy new block types, special pixels, and grid styles with gold earned from levels
- Save custom 16×16 block designs as templates; use them instantly in-level
- Official prebuilt templates for each set included (one per set)
- Base 5 template slots, expandable via Shop

### Achievements (36 total)

Categories: Campaign Progress, Stars, Set Discovery, Production Milestones, Gold & Blocks, Endless Mode, Shop & Templates.

### UI

- **Block fill-up animation** — each placed block shows a colored bar rising bottom-to-top, cycling at a speed proportional to its production rate
- **Left sidebar in-level shop** — buy pixel packs and color packs without leaving the game
- **Bottom inventory strip** — all your blocks visible and draggable at all times
- **Tutorial overlay** — step-by-step guidance for Level 1, auto-advances on player actions
- **Achievement toasts** — pop-up notifications on unlock
- **Alt-tab safe** — timer pauses when the browser tab loses focus

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + custom CSS |
| State | Zustand |
| Animation | Framer Motion |
| Routing | React Router v6 |
| Backend | Supabase (Auth + PostgreSQL) |

---

## Local Development

```bash
cd frontend
npm install
# Create frontend/.env with:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
npm run dev
```

App runs at `http://localhost:5173/pixelfactory/`

---

## Deploy to GitHub Pages (Free)

1. Push your repo to GitHub.
2. Add two repository secrets under **Settings → Secrets → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run the deploy command:
   ```bash
   cd frontend
   npm run deploy
   ```
   This builds to `dist/` and pushes it to the `gh-pages` branch.
4. In your GitHub repo go to **Settings → Pages** and set the source branch to `gh-pages`.
5. In your Supabase project go to **Authentication → URL Configuration** and add:
   - Site URL: `https://GITHUB_USERNAME.github.io/pixelfactory`
   - Redirect URL: `https://GITHUB_USERNAME.github.io/pixelfactory`

Your game will be live at `https://GITHUB_USERNAME.github.io/pixelfactory` — completely free.

> **Alternative free hosts:** [Netlify](https://netlify.com) (drag-and-drop your `dist/` folder) or [Vercel](https://vercel.com) (connect your GitHub repo, set the same env vars in the dashboard). Both are free for personal projects with no server needed since all game logic runs client-side.

---

## Database Setup (Supabase)

Run `supabase/schema.sql` once in the Supabase SQL Editor. This creates all tables with Row Level Security enabled.

---

## Environment Variables

| File | Purpose |
|---|---|
| `frontend/.env` | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — **never commit** |
| `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` and `BREVO_API_KEY` — **never commit** |

See [CLAUDE.md](CLAUDE.md) for full architecture and implementation details.
