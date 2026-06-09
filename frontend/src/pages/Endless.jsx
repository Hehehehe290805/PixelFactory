import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore, createBlock } from '../store/gameStore'
import { useUserStore } from '../store/userStore'
import { checkEndlessWave } from '../engine/achievementEngine'
import Grid from '../components/game/Grid'
import PixelCounter from '../components/game/PixelCounter'
import BlockEditor from '../components/game/BlockEditor'
import ProductionEngine from '../components/game/ProductionEngine'
import InventoryPanel from '../components/game/InventoryPanel'
import ShopSidebar from '../components/game/ShopSidebar'
import { motion, AnimatePresence } from 'framer-motion'

const FIRST_WAVE = 20   // scaled for new production rate (was 500)
const MULTIPLIER  = 1.6

function waveRequired(wave) {
  return Math.floor(FIRST_WAVE * Math.pow(MULTIPLIER, wave - 1))
}

function basePixels(wave) {
  const extra = (wave - 1) * 5
  return { white: 25 + extra, red: 5 + extra, blue: 5 + extra, yellow: 5 + extra }
}

function baseBlocks(wave) {
  const count = 2 + Math.floor((wave - 1) / 3)
  return Array.from({ length: count }, () => createBlock('base'))
}

export default function Endless() {
  const {
    grid, inventory, pixelInventory, selectedBlockId, setSelectedBlock,
    startLevel, levelComplete, resetLevel, colorCheckerReductions, totalPixelsProduced, removeBlock,
  } = useGameStore()
  const { achievements, unlockAchievements, saveEndlessScore, user } = useUserStore()

  const [wave, setWave]             = useState(1)
  const [phase, setPhase]           = useState('playing')
  const [elapsed, setElapsed]       = useState(0)
  const [grandTotal, setGrandTotal] = useState(0)
  const tabHiddenAtRef = useRef(null)

  const effectiveRequired = Math.floor(waveRequired(wave) * Math.pow(0.95, colorCheckerReductions))

  function doStartWave(w) {
    startLevel(baseBlocks(w), basePixels(w))
    setPhase('playing')
    setElapsed(0)
  }

  useEffect(() => {
    doStartWave(1)
    return () => resetLevel()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Stopwatch
  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  // Pause stopwatch on tab hide
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        tabHiddenAtRef.current = Date.now()
      } else if (tabHiddenAtRef.current !== null) {
        const hiddenSecs = Math.round((Date.now() - tabHiddenAtRef.current) / 1000)
        tabHiddenAtRef.current = null
        setElapsed(e => Math.max(0, e - hiddenSecs))
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!levelComplete) return
    const newTotal = grandTotal + Math.floor(totalPixelsProduced)
    setGrandTotal(newTotal)
    setPhase('between')
    const waveKeys = checkEndlessWave({ wave, unlockedKeys: achievements })
    if (waveKeys.length) unlockAchievements(waveKeys)
    if (user) saveEndlessScore(wave, newTotal)
  }, [levelComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNextWave() {
    const next = wave + 1
    setWave(next)
    doStartWave(next)
  }

  function handleCloseEditor() {
    const state = useGameStore.getState()
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 12; c++) {
        const b = state.grid[r][c]
        if (b && b.id === state.selectedBlockId && b.pixelCount === 0) {
          removeBlock(r, c)
          break
        }
      }
    }
    setSelectedBlock(null)
  }

  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-game-bg flex flex-col">
      {phase === 'playing' && <ProductionEngine requiredOutput={effectiveRequired} />}

      {/* HUD */}
      <div className="bg-game-card border-b-2 border-game-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link to="/" className="btn btn-secondary text-xs px-3 py-2 flex-shrink-0">← Exit</Link>
        <div className="flex-shrink-0 hidden sm:block">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Endless</div>
          <div className="text-white font-black text-sm">Wave {wave}</div>
        </div>
        <ProgressBar value={totalPixelsProduced} max={effectiveRequired} />
        <div className="text-white font-black font-mono text-xl flex-shrink-0">{fmt(elapsed)}</div>
      </div>

      {/* Main play area */}
      <div className="flex flex-1 gap-0 overflow-hidden min-h-0">
        {/* Left sidebar — shop */}
        <ShopSidebar />

        {/* Grid — center */}
        <div className="flex-1 flex items-start justify-center overflow-auto px-2 py-2">
          <Grid selectedBlockId={selectedBlockId} onBlockSelect={setSelectedBlock} />
        </div>

        {/* Stats — right side */}
        <div className="flex flex-col gap-3 flex-shrink-0 overflow-y-auto py-2 pr-2" style={{ width: 196 }}>
          <PixelCounter requiredOutput={effectiveRequired} />
          <div className="card text-xs font-semibold text-gray-400 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 uppercase tracking-widest font-black text-xs">Wave</span>
              <span className="text-white font-black text-base">{wave}</span>
            </div>
            <div className="flex justify-between">
              <span>Total px</span>
              <span className="text-white font-mono font-black">{grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Next wave</span>
              <span className="text-pixel-blue font-black">{waveRequired(wave + 1).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory — bottom bar */}
      <InventoryPanel selectedBlockId={selectedBlockId} onBlockSelect={setSelectedBlock} />

      {/* BlockEditor — centered modal overlay */}
      {selectedBlockId && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4"
          onClick={e => { if (e.target === e.currentTarget) handleCloseEditor() }}
        >
          <BlockEditor blockId={selectedBlockId} onClose={handleCloseEditor} />
        </div>
      )}

      {/* Between-wave overlay */}
      <AnimatePresence>
        {phase === 'between' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          >
            <motion.div
              initial={{ scale: 0.85 }} animate={{ scale: 1 }}
              className="card mx-4 w-full max-w-sm text-center"
              style={{ padding: '2.5rem' }}
            >
              <div className="text-pixel-green text-6xl font-black pixel-heading leading-none mb-2">{wave}</div>
              <div className="text-white font-black text-xl mb-1">Wave Complete!</div>
              <div className="text-gray-500 font-semibold text-sm mb-1">
                Total: <span className="text-white font-black">{grandTotal.toLocaleString()} px</span>
              </div>
              <div className="text-gray-500 font-semibold text-sm mb-6">
                Next: <span className="text-pixel-blue font-black">{waveRequired(wave + 1).toLocaleString()} px</span>
              </div>
              <button onClick={handleNextWave} className="btn btn-primary w-full text-base">
                Wave {wave + 1} →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className="flex justify-between text-xs font-bold text-gray-500">
        <span>{Math.floor(value).toLocaleString()}</span>
        <span>{max.toLocaleString()} px</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: '#1499cc' }} />
      </div>
    </div>
  )
}
