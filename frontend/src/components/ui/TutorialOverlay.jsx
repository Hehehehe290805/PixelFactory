import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useSettingsStore } from '../../store/settingsStore'

const PAD = 14

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PixelFactory!',
    body: 'Each block is an independent process that produces pixels — like parallel threads. Paint blocks, place them on the grid, and watch them produce!',
    waitFor: null,
    targetSel: null,
  },
  {
    id: 'open_inventory',
    title: 'Open your inventory',
    body: 'Tap the ▲ bar at the very bottom of the screen to expand your inventory and see your blocks.',
    waitFor: 'inventoryOpen',
    targetSel: '[data-tutorial="inventory"]',
    hint: 'Tap the inventory bar at the bottom ↓',
  },
  {
    id: 'select_block',
    title: 'Click a block',
    body: 'Click any block in the inventory to open the pixel editor.',
    waitFor: 'blockSelected',
    targetSel: '[data-tutorial="inventory-panel"]',
    hint: 'Click a block in the inventory',
  },
  {
    id: 'paint_pixels',
    title: 'Paint at least 5 pixels',
    body: 'Click or drag on the 16×16 canvas to paint pixels. More pixels = faster production!',
    waitFor: 'pixelsPainted',
    targetSel: null,
    hint: 'Paint pixels on the canvas',
  },
  {
    id: 'close_editor',
    title: 'Close the editor',
    body: 'Click "Done" to save your painting and close the editor.',
    waitFor: 'editorClosed',
    targetSel: null,
    hint: 'Click "Done" to continue →',
  },
  {
    id: 'place_block',
    title: 'Place your block on the grid',
    body: 'Click any empty cell on the grid — then choose your painted block. You can also open the inventory ▲ and drag it directly.',
    waitFor: 'blockPlaced',
    targetSel: '[data-tutorial="grid"]',
    hint: 'Click an empty grid cell to place your block',
  },
  {
    id: 'watch',
    title: 'Watch it produce!',
    body: 'Your block is now producing pixels! See the progress bar fill and the px/s counter on the right.',
    waitFor: 'producing',
    targetSel: null,
    hint: 'Waiting for production to start…',
  },
  {
    id: 'done',
    title: "You're all set!",
    body: 'Keep placing and painting blocks to hit the pixel target. Discover color sets for big bonuses. Good luck!',
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
  const { inventory, grid, totalPixelsProduced, selectedBlockId } = useGameStore()

  const [stepIdx, setStepIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [spotlight, setSpotlight] = useState(null)

  const blocksOnGrid = grid.flat().filter(Boolean).length
  const totalPainted = [...inventory, ...grid.flat().filter(Boolean)]
    .reduce((s, b) => s + b.pixelCount, 0)

  const step = STEPS[stepIdx]

  const refreshSpotlight = useCallback(() => {
    if (!step?.targetSel) { setSpotlight(null); return }
    setSpotlight(getSpotlight(step.targetSel))
  }, [step?.targetSel])

  // Clear spotlight immediately when step changes, then re-measure
  useEffect(() => {
    setSpotlight(null)
    refreshSpotlight()
    const t = setTimeout(refreshSpotlight, 200)
    return () => clearTimeout(t)
  }, [stepIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refreshSpotlight()
  }, [refreshSpotlight, selectedBlockId])

  // Re-measure after inventory open/close animation completes
  useEffect(() => {
    const t = setTimeout(refreshSpotlight, 350)
    return () => clearTimeout(t)
  }, [inventoryOpen, refreshSpotlight])

  useEffect(() => {
    window.addEventListener('resize', refreshSpotlight)
    return () => window.removeEventListener('resize', refreshSpotlight)
  }, [refreshSpotlight])

  function advance() { setStepIdx(i => Math.min(i + 1, STEPS.length - 1)) }

  function dismiss() { setDismissed(true); onDone?.() }

  // Advance after inventory open animation finishes (~380ms spring)
  useEffect(() => {
    if (!active || !showTutorial || dismissed || !step) return
    if (step.waitFor !== 'inventoryOpen' || !inventoryOpen) return
    const t = setTimeout(advance, 380)
    return () => clearTimeout(t)
  }, [inventoryOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active || !showTutorial || dismissed || !step) return
    if (step.waitFor === 'blockSelected' && selectedBlockId) advance()
    if (step.waitFor === 'pixelsPainted' && totalPainted >= 5) advance()
    if (step.waitFor === 'editorClosed'  && !selectedBlockId) advance()
    if (step.waitFor === 'blockPlaced'   && blocksOnGrid >= 1) advance()
    if (step.waitFor === 'producing'     && totalPixelsProduced > 0) advance()
  }, [selectedBlockId, totalPainted, blocksOnGrid, totalPixelsProduced]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !showTutorial || dismissed || stepIdx >= STEPS.length) return null

  const isLast    = stepIdx === STEPS.length - 1
  const isWaiting = !!step.waitFor

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
      <div style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.72)', clipPath, pointerEvents:'all' }} />

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
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIdx}
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:16 }}
          transition={{ duration:0.22 }}
          style={{ position:'fixed', top:80, right:16, width:300, maxWidth:'calc(100vw - 32px)', zIndex:60 }}
        >
          <div className="card" style={{ borderColor:'#1499cc88', boxShadow:'0 0 0 1px #1499cc22,0 12px 40px #000000bb' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all ${i < stepIdx ? 'w-3 h-2 bg-pixel-blue' : i === stepIdx ? 'w-4 h-2 bg-pixel-blue' : 'w-2 h-2 bg-game-border'}`} />
                ))}
              </div>
              <button onClick={() => dismiss()} className="text-xs font-bold text-gray-600 hover:text-gray-300 transition">
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
                  onClick={() => isLast ? dismiss() : advance()}
                  className="btn btn-primary flex-1 text-sm"
                >
                  {isLast ? "Let's go!" : 'Next →'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
