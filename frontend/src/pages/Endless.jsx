import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { startMusic, stopMusic } from '../lib/audio'
import { useGameStore, createBlock, pickRandomType } from '../store/gameStore'
import { useShopStore } from '../store/shopStore'
import { getOwnedBlockTypes } from '../lib/constants'
import { useUserStore } from '../store/userStore'
import { useDesignUnlocks } from '../lib/designUnlocks'
import { checkEndlessWave } from '../engine/achievementEngine'
import { getEndlessQuestion, ENDLESS_REWARDS } from '../data/learningContent'
import Grid from '../components/game/Grid'
import PixelCounter from '../components/game/PixelCounter'
import ProductionEngine from '../components/game/ProductionEngine'
import ActiveEffectsPanel from '../components/game/ActiveEffectsPanel'
import InventoryPanel from '../components/game/InventoryPanel'
import ShopSidebar from '../components/game/ShopSidebar'
import DeckSelector from '../components/ui/DeckSelector'
import { motion, AnimatePresence } from 'framer-motion'

// Wave N requires: FIRST_WAVE × MULTIPLIER^(N-1)
// At ~30 px/s (6 starting blocks):  wave 1 ≈ 27s · wave 3 ≈ 4.5 min
// At ~200 px/s (mid-game):          wave 5 ≈ 5 min · wave 6 ≈ 9 min
// At ~1 000 px/s (optimised):       wave 7 ≈ 10 min · wave 8 ≈ 27 min
const FIRST_WAVE  = 800
const MULTIPLIER  = 3.0

// Gold awarded for a correct quiz answer per difficulty
const QUIZ_GOLD = { easy: 10, normal: 20, hard: 35 }

function waveRequired(wave) {
  return Math.floor(FIRST_WAVE * Math.pow(MULTIPLIER, wave - 1))
}

function calcGold(wave, grandTotal) {
  return Math.floor(wave * 5 + grandTotal * 0.001)
}

export default function Endless() {
  const navigate = useNavigate()
  const {
    grid, startLevel, startNextWave, levelComplete, resetLevel, totalPixelsProduced,
    gamePaused, setPaused, restoreGrid, gameSpeed, setGameSpeed,
  } = useGameStore()

  const {
    achievements, unlockAchievements, saveEndlessScore, saveQuizResult,
    addGold, user, endlessMinutes = 0, addEndlessMinutes, unlockDesign,
    saveEndlessRun, loadEndlessRun, deleteEndlessRun,
  } = useUserStore()

  const { unlockedDesigns } = useDesignUnlocks()
  const { unlockedBlocks, purchasedSpeeds } = useShopStore()

  const [wave, setWave]             = useState(1)
  const [phase, setPhase]           = useState('loading') // 'loading'|'deck'|'resume'|'playing'|'between'|'ended'
  const [elapsed, setElapsed]       = useState(0)
  const [grandTotal, setGrandTotal] = useState(0)
  const [runResult, setRunResult]   = useState(null)
  const [quizQuestion, setQuizQuestion] = useState(null)
  const [quizAnswered, setQuizAnswered] = useState(null)
  const [savedRun, setSavedRun]     = useState(null)
  const [saving, setSaving]         = useState(false)
  const [quizGoldTotal, setQuizGoldTotal] = useState(0)  // cumulative gold from quiz correct answers

  const tabHiddenAtRef = useRef(null)

  const effectiveRequired = waveRequired(wave)

  function quizDifficulty(w) {
    return w <= 5 ? 'easy' : w <= 15 ? 'normal' : 'hard'
  }

  function doStartWave(w, startingBlocks) {
    startNextWave(startingBlocks ?? [])
    setPhase('playing')
    setElapsed(0)
  }

  // Start/stop endless music based on phase
  useEffect(() => {
    if (phase === 'playing') startMusic('endless')
    else if (phase === 'ended') stopMusic(1.5)
  }, [phase])

  // On mount: check for a saved run (logged-in users only)
  useEffect(() => {
    async function checkSave() {
      if (!user) { startFreshRun(); return }
      const save = await loadEndlessRun()
      if (save) {
        setSavedRun(save)
        setPhase('resume')
      } else {
        startFreshRun()
      }
    }
    checkSave()
    return () => { stopMusic(0.8); resetLevel() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function startFreshRun() {
    // Show deck selector before starting — wave/total reset happens in handleDeckConfirmed
    setWave(1)
    setGrandTotal(0)
    setElapsed(0)
    setPhase('deck')
  }

  function handleDeckConfirmed({ designIds }) {
    const typePool = getOwnedBlockTypes(unlockedDesigns, unlockedBlocks ?? [])
    const startingBlocks = []
    for (const id of [...new Set(designIds)]) {
      for (let i = 0; i < 2; i++) {
        const block = createBlock(id, pickRandomType(typePool), 0)
        if (block) startingBlocks.push(block)
      }
    }
    startLevel(startingBlocks)
    setPhase('playing')
  }

  function handleResume() {
    const save = savedRun
    setWave(save.wave)
    setGrandTotal(save.grand_total)
    // Restore grid & inventory from saved state
    restoreGrid(save.grid, save.inventory)
    setPhase('playing')
    setElapsed(0)
    setSavedRun(null)
    deleteEndlessRun()
  }

  function handleNewRun() {
    deleteEndlessRun()
    setSavedRun(null)
    startFreshRun()
  }

  async function handleSaveAndExit() {
    setSaving(true)
    await saveEndlessRun({
      wave,
      grandTotal: grandTotal + Math.floor(totalPixelsProduced),
      grid,
      inventory: useGameStore.getState().inventory,
    })
    setSaving(false)
    navigate('/')
  }

  // Warn before refresh during active run
  useEffect(() => {
    if (phase !== 'playing') return
    function warn(e) { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  // Stopwatch
  useEffect(() => {
    if (phase !== 'playing' || gamePaused) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [phase, gamePaused])

  // Track total endless minutes for unlock
  useEffect(() => {
    if (phase !== 'playing' || gamePaused) return
    const id = setInterval(() => {
      addEndlessMinutes?.(1 / 60)
      if (endlessMinutes >= 20) unlockDesign?.('rainbow_prism')
    }, 1000)
    return () => clearInterval(id)
  }, [phase, gamePaused]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pause on tab hide
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) tabHiddenAtRef.current = Date.now()
      else if (tabHiddenAtRef.current !== null) {
        const s = Math.round((Date.now() - tabHiddenAtRef.current) / 1000)
        tabHiddenAtRef.current = null
        setElapsed(e => Math.max(0, e - s))
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Wave complete
  useEffect(() => {
    if (!levelComplete) return
    const newTotal = grandTotal + Math.floor(totalPixelsProduced)
    setGrandTotal(newTotal)
    setPhase('between')
    setQuizQuestion(getEndlessQuestion(quizDifficulty(wave)))
    setQuizAnswered(null)
    const waveKeys = checkEndlessWave({ wave, unlockedKeys: achievements })
    if (waveKeys.length) unlockAchievements(waveKeys)
  }, [levelComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleQuizAnswer(idx) {
    if (quizAnswered !== null || !quizQuestion) return
    const wasCorrect = idx === quizQuestion.correct
    setQuizAnswered({ idx, wasCorrect })
    saveQuizResult(wasCorrect)
    if (wasCorrect) {
      const gold = QUIZ_GOLD[quizQuestion.difficulty] ?? 10
      addGold(gold)
      setQuizGoldTotal(g => g + gold)
    }
  }

  function handleNextWave() {
    const next = wave + 1
    setWave(next)
    const bonusDesigns = quizAnswered?.wasCorrect && quizQuestion
      ? (ENDLESS_REWARDS[quizQuestion.difficulty] ?? 1)
      : 0
    setQuizQuestion(null)
    setQuizAnswered(null)
    const startingBlocks = []
    // Bonus: random design from unlocked collection
    for (let i = 0; i < bonusDesigns; i++) {
      const ids = useUserStore.getState().unlockedDesigns ?? []
      if (ids.length > 0) {
        const b = createBlock(ids[Math.floor(Math.random() * ids.length)])
        if (b) startingBlocks.push(b)
      }
    }
    doStartWave(next, startingBlocks)
  }

  async function handleEndRun() {
    const currentTotal = grandTotal + Math.floor(totalPixelsProduced)
    const runGold      = calcGold(wave, currentTotal)
    if (runGold > 0) addGold(runGold)

    let isHighscore = false
    if (user) isHighscore = await saveEndlessScore(wave, currentTotal)
    if (user) deleteEndlessRun()

    // Score = wave^2 * 100 + total pixels / 10
    const score = Math.floor(wave * wave * 100 + currentTotal / 10)
    setRunResult({ wave, grandTotal: currentTotal, runGold, quizGold: quizGoldTotal, score, isHighscore })
    setPhase('ended')
    setPaused(false)
  }

  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const ALL_SPEEDS = [0.5, 1, 2, 5, 10]
  const availableSpeeds = ALL_SPEEDS.filter(s => s === 1 || (purchasedSpeeds ?? []).includes(s))

  // ── Loading / resume screen ──────────────────────────────────────────────────
  if (phase === 'loading') return null

  // ── Deck selection — first thing before a fresh run ─────────────────────────
  if (phase === 'deck') {
    return (
      <DeckSelector
        levelNumber={0}
        unlockedDesigns={unlockedDesigns}
        bargain={false}
        onConfirm={handleDeckConfirmed}
        onBack={() => navigate('/')}
      />
    )
  }

  if (phase === 'resume' && savedRun) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center px-4">
        <div className="card w-full max-w-sm text-center" style={{ padding: '2rem' }}>
          <div className="text-xs font-black uppercase tracking-widest text-pixel-blue mb-1">Saved Run Found</div>
          <h2 className="text-2xl font-black text-white pixel-heading mb-4">Continue?</h2>
          <div className="flex gap-4 justify-center mb-6">
            <div>
              <div className="text-2xl font-black text-pixel-green">{savedRun.wave}</div>
              <div className="text-xs text-gray-600 uppercase font-bold">wave</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{savedRun.grand_total?.toLocaleString()}</div>
              <div className="text-xs text-gray-600 uppercase font-bold">total px</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleNewRun} className="btn btn-secondary flex-1 text-sm">New Run</button>
            <button onClick={handleResume} className="btn btn-primary flex-1 text-base">Resume →</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-game-bg flex flex-col overflow-hidden select-none">
      {phase === 'playing' && <ProductionEngine requiredOutput={effectiveRequired} />}

      {/* HUD */}
      <div className="bg-game-card border-b-2 border-game-border px-3 py-2 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => setPaused(true)} className="btn btn-secondary text-xs px-3 py-2 flex-shrink-0">⏸</button>
        <div className="flex-shrink-0 hidden sm:block">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Endless</div>
          <div className="text-white font-black text-sm">Wave {wave}</div>
        </div>
        <ProgressBar value={totalPixelsProduced} max={effectiveRequired} />
        {availableSpeeds.length > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {availableSpeeds.map(s => (
              <button
                key={s}
                onClick={() => setGameSpeed(s)}
                className={`text-xs font-black px-1.5 py-1 rounded-lg border transition leading-none
                  ${gameSpeed === s
                    ? 'border-pixel-yellow text-pixel-yellow bg-pixel-yellow/10'
                    : 'border-game-border text-gray-500 hover:border-gray-500'}`}
              >
                {s}×
              </button>
            ))}
          </div>
        )}
        <div className="text-white font-black font-mono text-xl flex-shrink-0">{fmt(elapsed)}</div>
      </div>

      {/* Main play area — ShopSidebar has no deck, shows only Random slot */}
      <div className="flex flex-1 gap-0 overflow-hidden min-h-0">
        <ShopSidebar deckDesignIds={[]} />
        <div className="flex-1 flex items-start justify-center overflow-hidden px-2 py-2">
          <Grid />
        </div>
        <div className="flex flex-col gap-3 flex-shrink-0 overflow-y-auto py-2 pr-2" style={{ width: 240 }}>
          <PixelCounter requiredOutput={effectiveRequired} totalLabel="This wave" />
          <ActiveEffectsPanel />
          <div className="card text-xs font-semibold text-gray-400 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 uppercase tracking-widest font-black text-xs">Total px</span>
              <span className="text-white font-black">{grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Next wave</span>
              <span className="text-pixel-blue font-black">{waveRequired(wave + 1).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <InventoryPanel />

      {/* Pause modal */}
      {gamePaused && phase === 'playing' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
          <div className="card mx-4 w-full max-w-xs text-center" style={{ padding: '2rem' }}>
            <div className="text-4xl font-black text-white pixel-heading mb-1">Paused</div>
            <div className="text-sm text-gray-500 font-semibold mb-6">Endless — Wave {wave}</div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setPaused(false)} className="btn btn-primary text-base">▶ Continue</button>
              <Link to="/settings" onClick={() => setPaused(false)} className="btn btn-secondary text-base">Settings</Link>
              {user && (
                <button onClick={handleSaveAndExit} disabled={saving} className="btn btn-secondary text-base">
                  {saving ? 'Saving…' : '💾 Save & Exit'}
                </button>
              )}
              <button onClick={handleEndRun} className="btn btn-danger text-base">End Run</button>
            </div>
          </div>
        </div>
      )}

      {/* Between-wave overlay */}
      <AnimatePresence>
        {phase === 'between' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4"
          >
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }}
              className="card w-full max-w-sm"
              style={{ padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="text-center mb-4">
                <div className="text-pixel-green text-5xl font-black pixel-heading leading-none mb-1">{wave}</div>
                <div className="text-white font-black text-xl mb-1">Wave Complete!</div>
                <div className="text-gray-500 font-semibold text-sm">
                  Total: <span className="text-white font-black">{grandTotal.toLocaleString()} px</span>
                  <span className="mx-2 text-gray-700">·</span>
                  Next: <span className="text-pixel-blue font-black">{waveRequired(wave + 1).toLocaleString()} px</span>
                </div>
              </div>

              {quizQuestion && (
                <div className="mb-4 rounded-xl border-2 border-game-border bg-game-bg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Challenge</span>
                    <span className={`px-2 py-0.5 rounded-lg border text-xs font-black ${
                      quizQuestion.difficulty === 'easy'   ? 'border-pixel-green/40 text-pixel-green' :
                      quizQuestion.difficulty === 'normal' ? 'border-pixel-yellow/40 text-pixel-yellow' :
                                                             'border-pixel-red/40 text-pixel-red'
                    }`}>
                      {quizQuestion.difficulty} · +{ENDLESS_REWARDS[quizQuestion.difficulty]} design bonus next wave
                    </span>
                  </div>
                  <p className="text-sm font-black text-white mb-3 leading-snug">{quizQuestion.question}</p>
                  <div className="space-y-1.5">
                    {quizQuestion.options.map((opt, i) => {
                      let cls = 'border-game-border text-gray-400 hover:border-gray-500'
                      if (quizAnswered) {
                        if (i === quizQuestion.correct) cls = 'border-pixel-green bg-pixel-green/10 text-pixel-green'
                        else if (i === quizAnswered.idx) cls = 'border-pixel-red bg-pixel-red/10 text-pixel-red'
                        else cls = 'border-game-border text-gray-600 opacity-40'
                      }
                      return (
                        <button key={i} onClick={() => handleQuizAnswer(i)} disabled={!!quizAnswered}
                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${cls}`}
                        >
                          <span className="font-black mr-1.5 opacity-50">{String.fromCharCode(65 + i)}.</span>{opt}
                        </button>
                      )
                    })}
                  </div>
                  {quizAnswered && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 rounded-lg border px-3 py-2 text-xs ${quizAnswered.wasCorrect ? 'border-pixel-green/30 bg-pixel-green/5 text-pixel-green' : 'border-pixel-red/30 bg-pixel-red/5 text-pixel-red'}`}
                    >
                      <div className="font-black mb-0.5">
                        {quizAnswered.wasCorrect
                          ? `Correct! +${QUIZ_GOLD[quizQuestion.difficulty] ?? 10}g · Bonus design next wave.`
                          : 'Incorrect.'}
                      </div>
                      <span className="text-gray-500">{quizQuestion.explanation}</span>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleEndRun} className="btn btn-secondary flex-1 text-sm">End Run</button>
                <button onClick={handleNextWave} className="btn btn-primary flex-1 text-base">Wave {wave + 1} →</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run ended */}
      <AnimatePresence>
        {phase === 'ended' && runResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          >
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }}
              className="card mx-4 w-full max-w-sm text-center"
              style={{ padding: '2.5rem' }}
            >
              <div className="text-4xl font-black text-white pixel-heading mb-1">Run Over</div>
              {runResult.isHighscore && (
                <div className="text-pixel-yellow font-black text-sm mb-3 tracking-wider uppercase">★ New Personal Best!</div>
              )}

              {/* Score banner */}
              <div className="rounded-xl border-2 border-pixel-yellow/40 bg-pixel-yellow/5 py-4 mb-4">
                <div className="text-pixel-yellow font-black pixel-heading" style={{ fontSize: '3rem', lineHeight: 1 }}>
                  {runResult.score.toLocaleString()}
                </div>
                <div className="text-xs font-black uppercase tracking-widest text-pixel-yellow/60 mt-1">Score</div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-xl border border-game-border bg-game-bg py-3">
                  <div className="text-pixel-blue font-black text-xl">{runResult.wave}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-0.5">Waves</div>
                </div>
                <div className="rounded-xl border border-game-border bg-game-bg py-3">
                  <div className="text-white font-black text-lg">{(runResult.grandTotal / 1000).toFixed(1)}k</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-0.5">Points</div>
                </div>
              </div>

              {/* Coins breakdown */}
              <div className="rounded-xl border border-pixel-yellow/30 bg-pixel-yellow/5 px-4 py-3 mb-5 text-left space-y-1.5">
                <div className="text-xs font-black uppercase tracking-widest text-pixel-yellow mb-2">Coins Earned</div>
                <StatRow label="Run Bonus" value={`+${runResult.runGold}`} color="text-pixel-yellow" />
                {runResult.quizGold > 0 && (
                  <StatRow label="Quiz Answers" value={`+${runResult.quizGold}`} color="text-pixel-green" />
                )}
                <div className="border-t border-pixel-yellow/20 pt-1.5 mt-1">
                  <StatRow label="Total Coins" value={`+${runResult.runGold + runResult.quizGold}`} color="text-pixel-yellow" />
                </div>
              </div>

              {!user && <p className="text-xs text-gray-600 mb-4">Log in to save your score</p>}
              <div className="flex gap-3">
                <button onClick={() => navigate('/leaderboard')} className="btn btn-secondary flex-1 text-sm">Leaderboard</button>
                <button onClick={() => navigate('/')} className="btn btn-primary flex-1 text-base">Home</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold text-gray-500">{label}</span>
      <span className={`text-lg font-black font-mono ${color}`}>{value}</span>
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
        <div className="progress-fill" style={{ transform: `scaleX(${pct / 100})`, backgroundColor: '#1499cc' }} />
      </div>
    </div>
  )
}
