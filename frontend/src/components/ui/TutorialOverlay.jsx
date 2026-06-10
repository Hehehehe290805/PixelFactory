import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useSettingsStore } from '../../store/settingsStore'

const PAD = 14

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PixelFactory!',
    body: 'Each block on the grid is an independent process that produces pixels — like parallel threads. Place designs, build synergies, and hit the pixel target!',
    waitFor: null,
    targetSel: null,
  },
  {
    id: 'open_inventory',
    title: 'Open your inventory',
    body: 'Tap the ▲ bar at the bottom of the screen to expand your inventory and see your designs.',
    waitFor: 'inventoryOpen',
    targetSel: '[data-tutorial="inventory"]',
    hint: 'Tap the inventory bar at the bottom ↓',
  },
  {
    id: 'view_designs',
    title: 'Your designs',
    body: 'These are your design cards. Each has a fixed pixel art, a block type that determines its effect, and a series that enables synergy bonuses.',
    waitFor: null,
    targetSel: '[data-tutorial="inventory-panel"]',
  },
  {
    id: 'place_block',
    title: 'Place a design on the grid',
    body: 'Drag a design from the inventory onto the grid, or click an empty cell and select a design. Go ahead — place your first one!',
    waitFor: 'blockPlaced',
    targetSel: '[data-tutorial="grid"]',
    hint: 'Drag or click a grid cell to place a design',
  },
  {
    id: 'watch',
    title: 'Watch it produce!',
    body: 'Your design is now producing pixels! The progress bar and px/s counter update in real time.',
    waitFor: 'producing',
    targetSel: null,
    hint: 'Waiting for production to start…',
  },
  {
    id: 'check_effects',
    title: 'Check your synergies',
    body: 'The Active Effects panel on the right tracks your synergy progress. Collect designs of the same series to unlock big bonuses!',
    waitFor: null,
    targetSel: '[data-tutorial="active-effects"]',
  },
  {
    id: 'done',
    title: "You're all set!",
    body: 'Keep placing designs to hit the pixel target. Build synergies for bonus output. Good luck!',
    waitFor: null,
    targetSel: null,
  },
]

function getSpotlight(sel) {
  if (!sel) return null
  const el = document.querySelector(sel)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 }
}

export default function TutorialOverlay({ active, inventoryOpen, onDone }) {
  const { showTutorial } = useSettingsStore()
  const { grid, totalPixelsProduced } = useGameStore()

  const [stepIdx, setStepIdx] = useState(0)
  const [spotlight, setSpotlight] = useState(null)

  const blocksOnGrid = grid.flat().filter(Boolean).length

  const step = STEPS[stepIdx]

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

  // blockPlaced / producing auto-advance
  useEffect(() => {
    if (!active || !showTutorial || !step) return
    if (step.waitFor === 'blockPlaced'  && blocksOnGrid >= 1) advance()
    if (step.waitFor === 'producing'    && totalPixelsProduced > 0) advance()
  }, [blocksOnGrid, totalPixelsProduced]) // eslint-disable-line react-hooks/exhaustive-deps

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
              borderRadius:10, border:'2px solid #1499cc',
              boxShadow:'0 0 0 1px #1499cc33,0 0 24px #1499cc50',
              zIndex:41, pointerEvents:'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Tutorial card */}
      <div style={{ position:'fixed', top:80, right:16, width:300, maxWidth:'calc(100vw - 32px)', zIndex:60 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:16 }}
            transition={{ duration:0.22 }}
          >
            <div className="card" style={{ borderColor:'#1499cc88', boxShadow:'0 0 0 1px #1499cc22,0 12px 40px #000000bb' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`rounded-full transition-all ${i < stepIdx ? 'w-3 h-2 bg-pixel-blue' : i === stepIdx ? 'w-4 h-2 bg-pixel-blue' : 'w-2 h-2 bg-game-border'}`} />
                  ))}
                </div>
                <button onClick={onDone} className="text-xs font-bold text-gray-600 hover:text-gray-300 transition">
                  Skip
                </button>
              </div>

              <h3 className="text-base font-black text-white mb-1">{step.title}</h3>
              <p className="text-sm font-semibold text-gray-400 leading-relaxed">{step.body}</p>

              {isWaiting && step.hint && (
                <div className="mt-3 flex items-center gap-2 text-xs font-black text-pixel-blue">
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
                  >
                    {isLast ? "Let's go!" : 'Next →'}
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
