import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useSettingsStore } from '../../store/settingsStore'

const PAD = 14

// ── Per-level tutorial step definitions ──────────────────────────────────────
// waitFor values: null | 'inventoryOpen' | 'blockPlaced' | 'producing' | 'blocks4' | 'blocks5' | 'shop_purchase'

const STEPS_BY_LEVEL = {
  1: [
    {
      id: 'welcome',
      title: 'Welcome to PixelFactory!',
      body: 'Your factory is a 12×12 grid where each block is an independent process producing pixels — like parallel threads. Place designs, hit the pixel target, and complete the level!',
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'open_inventory',
      title: 'Open your inventory',
      body: 'Tap the ▲ bar at the bottom to see your starter designs. Each design has fixed pixel art, a block type effect, and a series group.',
      waitFor: 'inventoryOpen',
      targetSel: '[data-tutorial="inventory"]',
      hint: 'Tap the inventory bar at the bottom ↓',
    },
    {
      id: 'view_designs',
      title: 'Designs & Series',
      body: 'Each card shows pixel art, its block type, and its series (flowers, trees, etc.). Designs in the same series can unlock synergy bonuses when placed together!',
      waitFor: null,
      targetSel: '[data-tutorial="inventory-panel"]',
    },
    {
      id: 'place_block',
      title: 'Place a design on the grid',
      body: 'Drag a design from your inventory onto an empty grid cell — or click a cell and pick one from the radial wheel. Place your first block now!',
      waitFor: 'blockPlaced',
      targetSel: '[data-tutorial="grid"]',
      hint: 'Drag a design card to an empty grid cell',
    },
    {
      id: 'watch',
      title: 'Watch it produce!',
      body: 'Your block generates pixels per second. The px/s counter on the right updates in real time. Each block runs independently — like a parallel thread!',
      waitFor: 'producing',
      targetSel: null,
      hint: 'Waiting for production to start…',
    },
    {
      id: 'check_effects',
      title: 'Synergies Panel',
      body: 'This panel on the right tracks your synergy progress. Placing designs of the same series together unlocks massive production multipliers — up to +50% or more!',
      waitFor: null,
      targetSel: '[data-tutorial="active-effects"]',
    },
    {
      id: 'done',
      title: 'Hit the Target!',
      body: 'Place all your blocks to build up your px/s rate. Watch the progress bar fill toward the required output shown in the top bar. Good luck!',
      waitFor: null,
      targetSel: null,
    },
  ],

  2: [
    {
      id: 'welcome',
      title: 'Level 2: The Dashboard',
      body: "Great work finishing Level 1! Now let's understand all the numbers guiding your factory. You have 6 blocks this time — more firepower!",
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'hud',
      title: 'The HUD',
      body: 'The top bar shows your level name, the required pixel target, and time remaining. Tutorial levels have no time limit — but real levels have strict timers. Speed wins stars!',
      waitFor: null,
      targetSel: '[data-tutorial="level-hud"]',
    },
    {
      id: 'output_panel',
      title: 'Output Panel',
      body: 'The right panel tracks your px/s production rate and shows a progress bar toward the pixel target. Your running pixel totals appear below. Watch it grow as you place more blocks!',
      waitFor: null,
      targetSel: '[data-tutorial="pixel-counter"]',
    },
    {
      id: 'place_blocks',
      title: 'Fill the Grid',
      body: 'Place at least 4 blocks to see your production rate climb. Every additional block adds more pixels per second — maximize coverage for maximum output!',
      waitFor: 'blocks4',
      targetSel: '[data-tutorial="grid"]',
      hint: 'Place 4 or more blocks on the grid',
    },
    {
      id: 'stars',
      title: '★ Star Ratings',
      body: 'In timed levels, stars are based on how quickly you win: under 60% of the time limit = 3 stars · under 85% = 2 stars · just made it = 1 star. No time = no stars.',
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'gold',
      title: '💰 Earning Gold',
      body: '3★ = 100g · 2★ = 70g · 1★ = 50g. Gold unlocks permanent upgrades in the Shop: new grid styles, special block types, and speed boosts that carry into every run!',
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'done',
      title: 'Go for It!',
      body: 'Fill the grid, watch the px/s rate climb, and hit the required output. The progress bar glows green when you reach the target!',
      waitFor: null,
      targetSel: null,
    },
  ],

  3: [
    {
      id: 'welcome',
      title: 'Level 3: Open Shop',
      body: "You only start with 2 blocks this time — you'll need to buy more using the pixels you produce! Let's learn the in-level economy.",
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'first_blocks',
      title: 'Place Your Starters',
      body: 'Put your 2 starting blocks on the grid to begin producing pixels. You need pixel income flowing before you can afford anything from the shop!',
      waitFor: 'blocks2',
      targetSel: '[data-tutorial="grid"]',
      hint: 'Place both starting blocks on the grid',
    },
    {
      id: 'shop_intro',
      title: 'The Shop Sidebar',
      body: 'The left panel is your in-level shop. Your pixel balance (produced minus spent) is shown at the top. Designs in your deck appear as purchasable cards here.',
      waitFor: null,
      targetSel: '[data-tutorial="shop-sidebar"]',
    },
    {
      id: 'buy_design',
      title: 'Buy a Design',
      body: "Once you have enough pixels, click a design card to buy it — it appears in your inventory. You can also drag it straight from the shop onto the grid. Try buying one!",
      waitFor: 'shop_purchase',
      targetSel: '[data-tutorial="shop-sidebar"]',
      hint: 'Produce some pixels, then click a design to buy it',
    },
    {
      id: 'sell_zone',
      title: 'Sell Zone',
      body: 'The sell zone is at the bottom of the shop panel. Drag any grid block onto it to sell for 20% of its purchase price — useful for repositioning your factory layout!',
      waitFor: null,
      targetSel: '[data-tutorial="shop-sidebar"]',
    },
    {
      id: 'done',
      title: 'Build Your Factory!',
      body: 'Buy designs, place them strategically, and hit the pixel target. Balance spending vs. saving — every pixel you spend is also a pixel toward the win condition!',
      waitFor: null,
      targetSel: null,
    },
  ],

  4: [
    {
      id: 'welcome',
      title: 'Level 4: Synergy Lab',
      body: "Time to unlock the real power of PixelFactory — SYNERGIES! Specific design combinations grant massive production multipliers. This changes everything.",
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'effects_panel',
      title: 'Active Effects Panel',
      body: "This panel tracks every synergy you're building toward. Green = active (bonus is live!). Gray = in progress. Click any synergy to see exactly what bonus it gives and how to trigger it.",
      waitFor: null,
      targetSel: '[data-tutorial="active-effects"]',
    },
    {
      id: 'series_synergy',
      title: 'Cross-Family & Adjacency Synergies',
      body: "All your designs are flowers. Place specific pairs next to each other — Rose + Peony, or Bee + Daisy — to trigger powerful adjacency synergies! Check the Active Effects panel to see which pairs are in range.",
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'place_synergy',
      title: 'Place Your Flowers',
      body: 'Start placing flower designs on the grid. Watch the synergy progress bar tick up as you place more! Trigger adjacency synergies like Bee & Flower or Sunblossom for massive bonuses.',
      waitFor: 'blocks5',
      targetSel: '[data-tutorial="grid"]',
      hint: 'Place 5 or more designs on the grid',
    },
    {
      id: 'adjacency',
      title: 'Adjacency Synergies',
      body: 'Some synergies require two specific designs placed SIDE BY SIDE. Example: placing a Sun design directly next to a Moon design triggers SUN & MOON — +55% to both blocks instantly!',
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'row_column',
      title: 'Row & Column Synergies',
      body: 'Fill an entire row with designs from the same series for a ROW synergy bonus. Fill a column for a COLUMN bonus. These stack on top of your series bonuses!',
      waitFor: null,
      targetSel: '[data-tutorial="active-effects"]',
    },
    {
      id: 'done',
      title: 'Synergize & Conquer!',
      body: 'Use the Active Effects panel to guide your grid placement. Active synergies now sort to the top — higher-level bonuses float higher. Hit the target to finish!',
      waitFor: null,
      targetSel: null,
    },
  ],

  5: [
    {
      id: 'welcome',
      title: 'Level 5: Block Workshop',
      body: "Final tutorial level! Meet the specialized block types that make designs unique. After this level, you'll build your own custom decks — and earn your first bonus design!",
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'block_types_intro',
      title: 'Block Types Explained',
      body: "Every design has a block type determining its unique effect. In the shop, cards show 'type: random' — you discover the actual type after buying! Your starting blocks this level show several types.",
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'base_doubler',
      title: 'Base & Doubler',
      body: 'BASE gives steady output equal to floor(pixelCount ÷ 37.5) px/s — reliable and predictable. DOUBLER gives ×2 output when all 4 orthogonal neighbors are weaker designs. Great in corners or surrounded by base blocks!',
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'reactor_echo',
      title: 'Reactor & Echo',
      body: "REACTOR starts at 50% and ramps up to 200% over 15 seconds — it pays off if you leave it alone! ECHO gains +4% output every 10 seconds stationary, stacking up to +80%. Never move these two!",
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'amplifier',
      title: 'Amplifier & Splitter',
      body: 'AMPLIFIER gains +8% output per occupied neighbor (up to 8 neighbors = +64%). Place it in the middle of your grid for maximum effect! SPLITTER shares +20% of its own rate with each orthogonal neighbor.',
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'place_blocks',
      title: 'Try Them Out!',
      body: 'Place all your blocks and watch how each type behaves. Notice the Reactor ramping up and the Amplifier growing stronger as you fill its surroundings!',
      waitFor: 'blocks5',
      targetSel: '[data-tutorial="grid"]',
      hint: 'Place 5 or more blocks to continue',
    },
    {
      id: 'deck_intro',
      title: 'Coming Up: Deck Builder',
      body: "From Level 6 onwards, you'll pick a deck of up to 3 designs before each level. Your collection grows at every 5-level milestone — choose designs that synergize with each other!",
      waitFor: null,
      targetSel: null,
    },
    {
      id: 'done',
      title: 'Tutorial Complete!',
      body: "Hit the pixel target to finish the tutorial! A bonus design is waiting — after the level you'll choose between two options to permanently add to your collection. Good luck!",
      waitFor: null,
      targetSel: null,
    },
  ],
}

function getSpotlight(sel) {
  if (!sel) return null
  const el = document.querySelector(sel)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 }
}

export default function TutorialOverlay({ active, inventoryOpen, onDone, tutorialLevel = 1 }) {
  const { showTutorial } = useSettingsStore()
  const { grid, totalPixelsProduced, pixelsSpentInShop } = useGameStore()

  const [stepIdx, setStepIdx] = useState(0)
  const [spotlight, setSpotlight] = useState(null)

  const STEPS = STEPS_BY_LEVEL[tutorialLevel] ?? STEPS_BY_LEVEL[1]
  const blocksOnGrid = grid.flat().filter(Boolean).length
  const step = STEPS[stepIdx]

  // Reset step index when tutorial level changes (entering a new tutorial level)
  useEffect(() => { setStepIdx(0) }, [tutorialLevel])

  const refreshSpotlight = useCallback(() => {
    if (!step?.targetSel) { setSpotlight(null); return }
    setSpotlight(getSpotlight(step.targetSel))
  }, [step?.targetSel])

  useEffect(() => {
    setSpotlight(null)
    const t = setTimeout(refreshSpotlight, 200)
    return () => clearTimeout(t)
  }, [stepIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(refreshSpotlight, 350)
    return () => clearTimeout(t)
  }, [inventoryOpen, refreshSpotlight])

  useEffect(() => {
    window.addEventListener('resize', refreshSpotlight)
    return () => window.removeEventListener('resize', refreshSpotlight)
  }, [refreshSpotlight])

  function advance() { setStepIdx(i => Math.min(i + 1, STEPS.length - 1)) }

  // inventoryOpen auto-advance
  useEffect(() => {
    if (!active || !showTutorial || !step) return
    if (step.waitFor !== 'inventoryOpen' || !inventoryOpen) return
    const t = setTimeout(advance, 380)
    return () => clearTimeout(t)
  }, [inventoryOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // blockPlaced / producing / blocks4 / blocks5 / shop_purchase auto-advance
  useEffect(() => {
    if (!active || !showTutorial || !step) return
    if (step.waitFor === 'blockPlaced'     && blocksOnGrid >= 1) advance()
    if (step.waitFor === 'blocks2'         && blocksOnGrid >= 2) advance()
    if (step.waitFor === 'producing'       && totalPixelsProduced > 0) advance()
    if (step.waitFor === 'blocks4'         && blocksOnGrid >= 4) advance()
    if (step.waitFor === 'blocks5'         && blocksOnGrid >= 5) advance()
    if (step.waitFor === 'shop_purchase'   && pixelsSpentInShop > 0) advance()
  }, [blocksOnGrid, totalPixelsProduced, pixelsSpentInShop]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !showTutorial) return null

  const isLast    = stepIdx === STEPS.length - 1
  const isWaiting = !!step?.waitFor

  const W = window.innerWidth
  const H = window.innerHeight
  let clipPath
  if (spotlight) {
    const { x, y, w, h } = spotlight
    clipPath = `polygon(0px 0px,${W}px 0px,${W}px ${H}px,0px ${H}px,0px 0px,${x}px ${y}px,${x}px ${y+h}px,${x+w}px ${y+h}px,${x+w}px ${y}px,${x}px ${y}px)`
  }

  // Level badge color per tutorial level
  const levelColors = { 1: '#1499cc', 2: '#ffd166', 3: '#00d49a', 4: '#a066f0', 5: '#f03e4e' }
  const accentColor = levelColors[tutorialLevel] ?? '#1499cc'

  return (
    <>
      {/* Dark backdrop with spotlight hole */}
      <div style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.72)', clipPath, pointerEvents:'auto' }} />

      {/* Pulsing ring around target */}
      <AnimatePresence>
        {spotlight && (
          <motion.div
            key={step.id + '-ring'}
            initial={{ opacity:0 }}
            animate={{ opacity:[0.6,1,0.6] }}
            exit={{ opacity:0, transition:{ duration:0.15, repeat:0 } }}
            transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }}
            style={{
              position:'fixed', left:spotlight.x-4, top:spotlight.y-4,
              width:spotlight.w+8, height:spotlight.h+8,
              borderRadius:10, border:`2px solid ${accentColor}`,
              boxShadow:`0 0 0 1px ${accentColor}33,0 0 24px ${accentColor}50`,
              zIndex:41, pointerEvents:'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Tutorial card — auto-positions left when spotlight is on the right half */}
      <div style={{
        position:'fixed', top:80, width:300, maxWidth:'calc(100vw - 32px)', zIndex:60,
        ...(spotlight && (spotlight.x + spotlight.w / 2) > window.innerWidth * 0.5
          ? { left: 16 }
          : { right: 16 }),
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:16 }}
            transition={{ duration:0.22 }}
          >
            <div style={{
              borderRadius: '1rem', padding: '1.25rem',
              background: 'rgba(6, 6, 26, 0.90)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${accentColor}30`,
              borderTop: `1px solid ${accentColor}55`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}15`,
            }}>
              {/* Header: level badge + step dots + skip */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
                    style={{ background: accentColor + '22', color: accentColor, border: `1px solid ${accentColor}44` }}
                  >
                    Lv.{tutorialLevel}
                  </span>
                  <div className="flex gap-1">
                    {STEPS.map((_, i) => (
                      <div key={i} className={`rounded-full transition-all ${
                        i < stepIdx ? 'w-3 h-2' : i === stepIdx ? 'w-4 h-2' : 'w-2 h-2 bg-game-border'
                      }`}
                      style={i <= stepIdx ? { backgroundColor: accentColor } : undefined}
                      />
                    ))}
                  </div>
                </div>
                <button onClick={onDone} className="text-xs font-bold text-gray-600 hover:text-gray-300 transition">
                  Skip
                </button>
              </div>

              <h3 className="text-base font-black text-white mb-1">{step.title}</h3>
              <p className="text-sm font-semibold text-gray-400 leading-relaxed">{step.body}</p>

              {isWaiting && step.hint && (
                <div className="mt-3 flex items-center gap-2 text-xs font-black" style={{ color: accentColor }}>
                  <motion.span animate={{ opacity:[1,0.3,1] }} transition={{ repeat:Infinity, duration:1.4 }}>●</motion.span>
                  {step.hint}
                </div>
              )}

              {!isWaiting && (
                <div className="flex gap-2 mt-4">
                  {stepIdx > 0 && (
                    <button onClick={() => setStepIdx(i => i - 1)} className="btn btn-secondary text-xs px-3 py-2">← Back</button>
                  )}
                  <button
                    onClick={isLast ? onDone : advance}
                    className="btn btn-primary flex-1 text-sm"
                    style={isLast ? { background: accentColor } : undefined}
                  >
                    {isLast ? "Let's go! →" : 'Next →'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
