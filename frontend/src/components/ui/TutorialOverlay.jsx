import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useSettingsStore } from '../../store/settingsStore'

// Each step: if `waitFor` is set, the Next button is hidden — the step auto-advances
// when the condition becomes true. Manual steps show a Next button immediately.
const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PixelFactory!',
    body: 'Each block is an independent process that produces pixels — like parallel threads. Paint blocks, place them on the grid, and watch them produce!',
    waitFor: null, // manual — show Next button
  },
  {
    id: 'select_block',
    title: 'Select your block',
    body: 'Click the block in the inventory on the left to select it. The pixel editor will open in the center of your screen.',
    waitFor: 'blockSelected',
    hint: 'Click the block in the left panel →',
  },
  {
    id: 'paint_pixels',
    title: 'Paint at least 5 pixels',
    body: 'Click or drag on the 16×16 grid to paint pixels. Each pixel you add increases your block\'s production rate.',
    waitFor: 'pixelsPainted',
    hint: 'Paint pixels in the editor that just opened',
  },
  {
    id: 'close_editor',
    title: 'Close the editor',
    body: 'Press ✕ on the editor or click the block again to deselect. Then drag your block onto the main grid.',
    waitFor: null,
  },
  {
    id: 'place_block',
    title: 'Place your block on the grid',
    body: 'Drag your block from the left panel onto any cell on the 12×12 grid in the center.',
    waitFor: 'blockPlaced',
    hint: 'Drag the block from the left inventory onto the grid',
  },
  {
    id: 'watch',
    title: 'Watch it produce!',
    body: 'Your block is now producing pixels. See the px/sec counter on the right and the progress bar at the top filling up.',
    waitFor: 'producing',
    hint: 'Wait a moment for production to start…',
  },
  {
    id: 'done',
    title: 'You\'re all set!',
    body: 'Keep placing blocks and painting more pixels to increase your output rate. Right-click a placed block to return it to inventory. Good luck!',
    waitFor: null,
  },
]

export default function TutorialOverlay({ active }) {
  const { showTutorial } = useSettingsStore()
  const { inventory, grid, totalPixelsProduced, selectedBlockId } = useGameStore()

  const [stepIdx, setStepIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const blocksOnGrid = grid.flat().filter(Boolean).length
  const totalPainted = [
    ...inventory,
    ...grid.flat().filter(Boolean),
  ].reduce((s, b) => s + b.pixelCount, 0)

  const step = STEPS[stepIdx]

  useEffect(() => {
    if (!active || !showTutorial || dismissed || !step) return
    if (step.waitFor === 'blockSelected' && selectedBlockId) advance()
    if (step.waitFor === 'pixelsPainted'  && totalPainted >= 5) advance()
    if (step.waitFor === 'blockPlaced'    && blocksOnGrid >= 1) advance()
    if (step.waitFor === 'producing'      && totalPixelsProduced > 0) advance()
  }, [selectedBlockId, totalPainted, blocksOnGrid, totalPixelsProduced])

  function advance() {
    setStepIdx(i => Math.min(i + 1, STEPS.length - 1))
  }

  if (!active || !showTutorial || dismissed || stepIdx >= STEPS.length) return null

  const isLast    = stepIdx === STEPS.length - 1
  const isWaiting = !!step.waitFor // true = hide Next, wait for action

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIdx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed top-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]"
      >
        <div className="card" style={{ borderColor: '#1499cc88', boxShadow: '0 0 0 1px #1499cc33, 0 12px 40px #000000aa' }}>
          {/* Progress dots + skip */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${i < stepIdx ? 'w-3 h-2 bg-pixel-blue' : i === stepIdx ? 'w-4 h-2 bg-pixel-blue' : 'w-2 h-2 bg-game-border'}`} />
              ))}
            </div>
            <button onClick={() => setDismissed(true)} className="text-xs font-bold text-gray-600 hover:text-gray-300 transition">
              Skip tutorial
            </button>
          </div>

          <h3 className="text-base font-black text-white mb-1">{step.title}</h3>
          <p className="text-sm font-semibold text-gray-400 leading-relaxed">{step.body}</p>

          {/* Waiting indicator */}
          {isWaiting && step.hint && (
            <div className="mt-3 flex items-center gap-2 text-xs font-black text-pixel-blue">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              >
                ●
              </motion.span>
              {step.hint}
            </div>
          )}

          {/* Action buttons — only shown for manual steps */}
          {!isWaiting && (
            <div className="flex gap-2 mt-4">
              {stepIdx > 0 && (
                <button onClick={() => setStepIdx(i => i - 1)} className="btn btn-secondary text-xs px-3 py-2">← Back</button>
              )}
              <button
                onClick={() => isLast ? setDismissed(true) : advance()}
                className="btn btn-primary flex-1 text-sm"
              >
                {isLast ? 'Let\'s go!' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
