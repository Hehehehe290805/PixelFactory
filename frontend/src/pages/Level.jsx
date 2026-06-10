import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGameStore, createBlock } from '../store/gameStore'
import { useUserStore } from '../store/userStore'
import { useShopStore } from '../store/shopStore'
import { getLevelConfig } from '../engine/levelConfig'
import { totalGreedyBonus, totalForgeBonus } from '../engine/blockEffects'
import { checkLevelComplete, checkGreedy } from '../engine/achievementEngine'
import { useUnlocks } from '../lib/unlocks'
import { PIXEL_COLORS, BLOCK_TYPES } from '../lib/constants'
import { useSettingsStore } from '../store/settingsStore'
import { getLevelContent } from '../data/learningContent'
import Grid from '../components/game/Grid'
import LevelHUD from '../components/game/LevelHUD'
import PixelCounter from '../components/game/PixelCounter'
import BlockEditor from '../components/game/BlockEditor'
import ProductionEngine from '../components/game/ProductionEngine'
import StarResult from '../components/ui/StarResult'
import LearningCard from '../components/ui/LearningCard'
import TutorialOverlay from '../components/ui/TutorialOverlay'
import TemplateSaveModal from '../components/ui/TemplateSaveModal'
import InventoryPanel from '../components/game/InventoryPanel'
import ShopSidebar from '../components/game/ShopSidebar'
import TemplatePicker from '../components/ui/TemplatePicker'

const GOLD_BY_STARS = { 3: 100, 2: 70, 1: 50, 0: 0 }

// Pre-level pixel packs: spend gold → get bonus starting pixels
const PRE_PACKS = [
  { qty: 10,  cost: 30  },
  { qty: 25,  cost: 70  },
  { qty: 50,  cost: 130 },
  { qty: 100, cost: 240 },
]

function buildStartBlocks(config) {
  const blocks = []
  for (const { type, count } of config.startingBlocks) {
    for (let i = 0; i < count; i++) blocks.push(createBlock(type))
  }
  return blocks
}

export default function Level() {
  const { levelNumber } = useParams()
  const navigate        = useNavigate()
  const levelNum        = parseInt(levelNumber, 10)
  const config          = getLevelConfig(levelNum)

  const {
    grid, inventory, pixelInventory, selectedBlockId, setSelectedBlock,
    startLevel, levelComplete, resetLevel, colorCheckerReductions, removeBlock,
    gamePaused, setPaused, gameSpeed,
  } = useGameStore()
  const {
    saveCampaignProgress, addGold, unlockAchievements, addCumulativeGreedyGold,
    achievements, campaignProgress, cumulativeGreedyGold,
    templates, saveTemplate, gold,
  } = useUserStore()
  const { isBlockUnlocked, isPixelUnlocked } = useUnlocks()
  const { showLearning } = useSettingsStore()

  const [timeRemaining, setTimeRemaining] = useState(config?.timeLimitSeconds ?? 120)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [resultShown, setResultShown]       = useState(false)
  const [learningShown, setLearningShown]   = useState(false)
  const [stars, setStars]                   = useState(0)
  const [goldEarned, setGoldEarned]         = useState(0)
  const tabHiddenAtRef = useRef(null)

  // Pre-level shop
  const [preLevelOpen, setPreLevelOpen] = useState(true)
  const [bonusPixels, setBonusPixels]   = useState({}) // extra starting pixels bought pre-level
  const [bonusBlocks, setBonusBlocks]   = useState([]) // extra starting blocks bought pre-level

  // Template stuff
  const [templatePrompt, setTemplatePrompt] = useState(null)
  const shownSetPrompts = useRef(new Set())
  const [pickerBlockId, setPickerBlockId] = useState(null)

  // Inventory open state (lifted for tutorial)
  const [inventoryOpen, setInventoryOpen] = useState(false)

  // Track whether the game was manually paused before editor opened
  const wasManuallyPausedRef = useRef(false)

  const effectiveRequired = config
    ? Math.floor(config.requiredOutput * Math.pow(0.95, colorCheckerReductions))
    : 0

  function doStartLevel() {
    const mergedPixels = { ...config.startingPixels }
    for (const [c, n] of Object.entries(bonusPixels)) {
      mergedPixels[c] = (mergedPixels[c] ?? 0) + n
    }
    startLevel([...buildStartBlocks(config), ...bonusBlocks], mergedPixels)
  }

  function handleStartLevel() {
    doStartLevel()
    setPreLevelOpen(false)
  }

  useEffect(() => {
    if (!config) { navigate('/campaign'); return }
    // Don't call doStartLevel here — pre-level shop opens first
    return () => resetLevel()
  }, [levelNum]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-pause when editor opens; restore previous state when it closes
  useEffect(() => {
    if (selectedBlockId) {
      wasManuallyPausedRef.current = gamePaused
      setPaused(true)
    } else {
      setPaused(wasManuallyPausedRef.current)
    }
  }, [selectedBlockId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before refresh/close when level is in progress
  useEffect(() => {
    if (preLevelOpen || resultShown) return
    function warn(e) { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [preLevelOpen, resultShown])

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        tabHiddenAtRef.current = Date.now()
      } else if (tabHiddenAtRef.current !== null) {
        const hiddenSecs = Math.round((Date.now() - tabHiddenAtRef.current) / 1000)
        tabHiddenAtRef.current = null
        setTimeRemaining(t => Math.min(config?.timeLimitSeconds ?? 120, t + hiddenSecs))
        setElapsedSeconds(e => Math.max(0, e - hiddenSecs))
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [config]) // eslint-disable-line react-hooks/exhaustive-deps

  // Timer — respects gameSpeed so 2× speed burns time 2× faster
  useEffect(() => {
    if (!config || levelComplete || resultShown || config.tutorial || gamePaused || preLevelOpen) return
    const interval = setInterval(() => {
      setTimeRemaining(t => {
        const dec = gameSpeed
        if (t <= dec) { clearInterval(interval); handleTimeUp(); return 0 }
        return t - dec
      })
      setElapsedSeconds(e => e + gameSpeed)
    }, 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown, gamePaused, gameSpeed, preLevelOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tutorial elapsed (no time limit)
  useEffect(() => {
    if (!config?.tutorial || levelComplete || resultShown || gamePaused || preLevelOpen) return
    const interval = setInterval(() => setElapsedSeconds(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown, gamePaused, preLevelOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Detect new sets → prompt template save
  useEffect(() => {
    for (const row of grid) {
      for (const block of row) {
        if (!block?.activeSet) continue
        const key = `${block.id}_${block.activeSet}`
        if (shownSetPrompts.current.has(key)) continue
        const alreadySaved = templates.some(t => t.set_type === block.activeSet && !t.is_official)
        if (!alreadySaved) {
          shownSetPrompts.current.add(key)
          setTemplatePrompt({ block, setName: block.activeSet })
          return
        }
        shownSetPrompts.current.add(key)
      }
    }
  }, [grid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Level complete
  useEffect(() => {
    if (!levelComplete || resultShown) return
    const ratio = elapsedSeconds / config.timeLimitSeconds
    // Tutorial always gives 3 stars; otherwise: ≤60% time → 3★, ≤85% → 2★, else 1★
    const s = config.tutorial ? 3 : (ratio <= 0.60 ? 3 : ratio <= 0.85 ? 2 : 1)
    const greedyBonus = totalGreedyBonus(grid)
    const forgeBonus  = totalForgeBonus(grid)
    const baseGold    = GOLD_BY_STARS[s] ?? 0
    const total       = baseGold + greedyBonus + forgeBonus

    setStars(s); setGoldEarned(total); setResultShown(true)
    saveCampaignProgress(levelNum, s, elapsedSeconds)
    if (total > 0) addGold(total)
    if (greedyBonus > 0) addCumulativeGreedyGold(greedyBonus)

    const levelKeys  = checkLevelComplete({ levelNumber: levelNum, stars: s, campaignProgress, unlockedKeys: achievements })
    const greedyKeys = checkGreedy({ cumulativeGreedyGold: cumulativeGreedyGold + greedyBonus, unlockedKeys: achievements })
    unlockAchievements([...levelKeys, ...greedyKeys])
  }, [levelComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeUp() { setResultShown(true); setStars(0); setGoldEarned(0) }

  function handleOpenForBlock(blockId) {
    const state = useGameStore.getState()
    const block = [...state.inventory, ...state.grid.flat().filter(Boolean)].find(b => b.id === blockId)
    if (block && block.pixelCount === 0) setPickerBlockId(blockId)
    else setSelectedBlock(blockId)
  }

  function handleCloseEditor() {
    const state = useGameStore.getState()
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 12; c++) {
        const b = state.grid[r][c]
        if (b && b.id === state.selectedBlockId && b.pixelCount === 0) { removeBlock(r, c); break }
      }
    }
    setSelectedBlock(null)
  }

  function handleCancelEditor(originalLayout, originalInventory) {
    const pixelCount = originalLayout.flat().filter(Boolean).length
    useGameStore.setState(s => ({
      inventory: s.inventory.map(b =>
        b.id === selectedBlockId ? { ...b, pixelLayout: originalLayout, pixelCount } : b
      ),
      grid: s.grid.map(row => row.map(b =>
        b && b.id === selectedBlockId ? { ...b, pixelLayout: originalLayout, pixelCount } : b
      )),
      pixelInventory: originalInventory,
    }))
    // Remove from grid if it was originally empty (same as close behaviour)
    if (pixelCount === 0) {
      const state = useGameStore.getState()
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const b = state.grid[r][c]
          if (b && b.id === selectedBlockId) { removeBlock(r, c); break }
        }
      }
    }
    setSelectedBlock(null)
  }

  function handleRetry() {
    setResultShown(false)
    setLearningShown(false)
    setTimeRemaining(config.timeLimitSeconds)
    setElapsedSeconds(0)
    setBonusPixels({})
    setBonusBlocks([])
    shownSetPrompts.current.clear()
    setPreLevelOpen(true)
  }

  function handleStarResultContinue() {
    const content = getLevelContent(levelNum)
    if (showLearning && content) {
      setLearningShown(true)
    } else {
      navigate('/campaign')
    }
  }

  if (!config) return null

  return (
    <div className="h-screen bg-game-bg flex flex-col overflow-hidden select-none">
      {!preLevelOpen && <ProductionEngine requiredOutput={effectiveRequired} />}

      <LevelHUD config={config} effectiveRequired={effectiveRequired} timeRemaining={timeRemaining} elapsedSeconds={elapsedSeconds} />

      {/* Main play area */}
      <div className="flex flex-1 gap-0 overflow-hidden min-h-0">
        <ShopSidebar />

        <div className="flex-1 flex items-start justify-center overflow-hidden px-2 py-2" data-tutorial="grid">
          <Grid selectedBlockId={selectedBlockId} onBlockSelect={handleOpenForBlock} />
        </div>

        <div className="flex flex-col gap-3 flex-shrink-0 overflow-y-auto py-2 pr-2" style={{ width: 196 }}>
          <PixelCounter requiredOutput={effectiveRequired} />
          {colorCheckerReductions > 0 && (
            <div className="text-xs font-black text-pixel-green border-2 border-pixel-green/40 rounded-xl px-3 py-2">
              Color Checker: −{colorCheckerReductions * 5}% req.
            </div>
          )}
        </div>
      </div>

      <InventoryPanel
        selectedBlockId={selectedBlockId}
        onBlockSelect={setSelectedBlock}
        onOpenStateChange={setInventoryOpen}
      />

      {/* Template picker */}
      {pickerBlockId && (
        <TemplatePicker
          blockId={pickerBlockId}
          onPick={layout => {
            useGameStore.getState().applyTemplate(pickerBlockId, layout)
            setPickerBlockId(null)
            setSelectedBlock(pickerBlockId)
          }}
          onBlank={() => { setPickerBlockId(null); setSelectedBlock(pickerBlockId) }}
          onClose={() => {
            const state = useGameStore.getState()
            for (let r = 0; r < 12; r++) {
              for (let c = 0; c < 12; c++) {
                const b = state.grid[r][c]
                if (b && b.id === pickerBlockId && b.pixelCount === 0) { removeBlock(r, c); break }
              }
            }
            setPickerBlockId(null)
          }}
        />
      )}

      {/* BlockEditor — z-50 so it's above tutorial overlay (z-40) */}
      {selectedBlockId && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 px-4"
          style={{ zIndex: 50 }}
          onClick={config.tutorial ? undefined : e => { if (e.target === e.currentTarget) handleCloseEditor() }}
        >
          <BlockEditor blockId={selectedBlockId} onClose={handleCloseEditor} onCancel={handleCancelEditor} isTutorial={!!config.tutorial} />
        </div>
      )}

      {/* Tutorial */}
      {config.tutorial && (
        <TutorialOverlay active={!resultShown && !preLevelOpen} inventoryOpen={inventoryOpen} />
      )}

      {templatePrompt && !resultShown && (
        <TemplateSaveModal
          block={templatePrompt.block}
          setName={templatePrompt.setName}
          onSave={name => { saveTemplate(name, templatePrompt.block.pixelLayout, templatePrompt.setName); setTemplatePrompt(null) }}
          onSkip={() => setTemplatePrompt(null)}
        />
      )}

      {/* Pause modal (z-70) — only for manual pause, not editor auto-pause */}
      {gamePaused && !selectedBlockId && !pickerBlockId && !resultShown && !preLevelOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
          <div className="card mx-4 w-full max-w-xs text-center" style={{ padding: '2rem' }}>
            <div className="text-4xl font-black text-white pixel-heading mb-1">Paused</div>
            <div className="text-sm text-gray-500 font-semibold mb-6">Level {config.number} — {config.name}</div>
            <div className="flex flex-col gap-3">
              <button onClick={() => setPaused(false)} className="btn btn-primary text-base">▶ Continue</button>
              <Link to="/settings" onClick={() => setPaused(false)} className="btn btn-secondary text-base">Settings</Link>
              <button onClick={() => navigate('/campaign')} className="btn btn-danger text-base">Exit Level</button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-level shop */}
      {preLevelOpen && (
        <PreLevelShop
          config={config}
          gold={gold}
          bonusPixels={bonusPixels}
          setBonusPixels={setBonusPixels}
          bonusBlocks={bonusBlocks}
          setBonusBlocks={setBonusBlocks}
          isPixelUnlocked={isPixelUnlocked}
          isBlockUnlocked={isBlockUnlocked}
          addGold={addGold}
          onStart={handleStartLevel}
          onBack={() => navigate('/campaign')}
        />
      )}

      {resultShown && !learningShown && (
        <StarResult
          stars={stars}
          levelConfig={config}
          elapsedSeconds={elapsedSeconds}
          goldEarned={goldEarned}
          onContinue={handleStarResultContinue}
          onRetry={handleRetry}
        />
      )}

      {resultShown && learningShown && (
        <LearningCard
          content={getLevelContent(levelNum)}
          levelNumber={levelNum}
          onContinue={() => navigate('/campaign')}
        />
      )}
    </div>
  )
}

// ── Pre-level shop ─────────────────────────────────────────────────────────────
function PreLevelShop({ config, gold, bonusPixels, setBonusPixels, bonusBlocks, setBonusBlocks, isPixelUnlocked, isBlockUnlocked, addGold, onStart, onBack }) {
  function buyPixelPack(qty, cost) {
    if (gold < cost) return
    addGold(-cost)
    // Distribute evenly across unlocked colors
    const cols = Object.keys(PIXEL_COLORS).filter(k => isPixelUnlocked(k) && !PIXEL_COLORS[k].special)
    if (!cols.length) return
    const per = Math.floor(qty / cols.length)
    const rem = qty - per * cols.length
    const next = { ...bonusPixels }
    cols.forEach(c => { next[c] = (next[c] ?? 0) + per })
    next[cols[0]] = (next[cols[0]] ?? 0) + rem
    setBonusPixels(next)
  }

  function buyBlock(type) {
    const bt = BLOCK_TYPES[type]
    const cost = bt.shopCost
    if (gold < cost) return
    addGold(-cost)
    setBonusBlocks(bs => [...bs, createBlock(type)])
  }

  const availableBlocks = Object.entries(BLOCK_TYPES)
    .filter(([key]) => isBlockUnlocked(key))
    .filter(([key]) => !config.startingBlocks.some(sb => sb.type === key)) // don't duplicate starters

  const totalBonusPx = Object.values(bonusPixels).reduce((s, n) => s + n, 0)

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 px-4">
      <div className="card w-full max-w-md max-h-[90vh] flex flex-col" style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-0.5">Level {config.number}</div>
            <h2 className="text-2xl font-black text-white pixel-heading">{config.name}</h2>
            <div className="text-xs text-gray-500 mt-1">
              Goal: <span className="text-white font-black">{config.requiredOutput.toLocaleString()} px</span>
              {' · '}Time: <span className="text-white font-black">{Math.floor(config.timeLimitSeconds / 60)}:{(config.timeLimitSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-pixel-yellow font-black text-xl">{gold.toLocaleString()}</div>
            <div className="text-xs text-gray-600 font-bold uppercase">gold</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
          {/* Pixel packs */}
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
              Pixel Packs {totalBonusPx > 0 && <span className="text-pixel-green ml-2">+{totalBonusPx} queued</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRE_PACKS.map(({ qty, cost }) => (
                <button
                  key={qty}
                  onClick={() => buyPixelPack(qty, cost)}
                  disabled={gold < cost}
                  className={`rounded-xl border-2 flex flex-col items-center py-2.5 gap-0.5 transition
                    ${gold >= cost ? 'border-game-border hover:border-pixel-blue cursor-pointer' : 'border-game-border opacity-40 cursor-not-allowed'}`}
                  style={{ background: '#0d0d22' }}
                >
                  <span className="text-sm font-black text-white">+{qty} px</span>
                  <span className="text-xs font-bold text-pixel-yellow">{cost}g</span>
                </button>
              ))}
            </div>
          </div>

          {/* Extra blocks */}
          {availableBlocks.length > 0 && (
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Extra Blocks {bonusBlocks.length > 0 && <span className="text-pixel-green ml-2">+{bonusBlocks.length}</span>}
              </div>
              <div className="space-y-1">
                {availableBlocks.map(([key, bt]) => (
                  <button
                    key={key}
                    onClick={() => buyBlock(key)}
                    disabled={gold < bt.shopCost}
                    className={`w-full rounded-xl border-2 flex items-center gap-3 px-3 py-2 text-left transition
                      ${gold >= bt.shopCost ? 'border-game-border hover:border-pixel-blue cursor-pointer' : 'border-game-border opacity-40 cursor-not-allowed'}`}
                    style={{ background: '#0d0d22' }}
                  >
                    <span className="text-sm font-black text-white flex-1">{bt.label}</span>
                    <span className="text-xs text-gray-500 flex-1 truncate">{bt.desc.split('.')[0]}</span>
                    <span className="text-xs font-black text-pixel-yellow flex-shrink-0">{bt.shopCost}g</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-4 flex-shrink-0">
          <button onClick={onBack} className="btn btn-secondary px-4 py-2 text-sm">← Back</button>
          <button onClick={onStart} className="btn btn-primary flex-1 text-base">
            {totalBonusPx > 0 || bonusBlocks.length > 0 ? `Start with +${totalBonusPx}px, +${bonusBlocks.length} blocks` : 'Start Level'}
          </button>
        </div>
      </div>
    </div>
  )
}
