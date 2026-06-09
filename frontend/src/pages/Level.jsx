import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGameStore, createBlock } from '../store/gameStore'
import { useUserStore } from '../store/userStore'
import { getLevelConfig } from '../engine/levelConfig'
import { totalGreedyBonus, totalForgeBonus } from '../engine/blockEffects'
import { checkLevelComplete, checkGreedy } from '../engine/achievementEngine'
import Grid from '../components/game/Grid'
import LevelHUD from '../components/game/LevelHUD'
import PixelCounter from '../components/game/PixelCounter'
import BlockEditor from '../components/game/BlockEditor'
import ProductionEngine from '../components/game/ProductionEngine'
import StarResult from '../components/ui/StarResult'
import TutorialOverlay from '../components/ui/TutorialOverlay'
import TemplateSaveModal from '../components/ui/TemplateSaveModal'
import InventoryPanel from '../components/game/InventoryPanel'
import ShopSidebar from '../components/game/ShopSidebar'
import TemplatePicker from '../components/ui/TemplatePicker'

const GOLD_BY_STARS = { 3: 100, 2: 70, 1: 50, 0: 0 }

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
    gamePaused, setPaused,
  } = useGameStore()
  const {
    saveCampaignProgress, addGold, unlockAchievements, addCumulativeGreedyGold,
    achievements, campaignProgress, cumulativeGreedyGold,
    templates, saveTemplate,
  } = useUserStore()

  const [timeRemaining, setTimeRemaining] = useState(config?.timeLimitSeconds ?? 120)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [resultShown, setResultShown]       = useState(false)
  const [stars, setStars]                   = useState(0)
  const [goldEarned, setGoldEarned]         = useState(0)
  const tabHiddenAtRef = useRef(null)

  const [templatePrompt, setTemplatePrompt] = useState(null)
  const shownSetPrompts = useRef(new Set())
  const [pickerBlockId, setPickerBlockId] = useState(null)

  const effectiveRequired = config
    ? Math.floor(config.requiredOutput * Math.pow(0.95, colorCheckerReductions))
    : 0

  function doStartLevel() {
    startLevel(buildStartBlocks(config), { ...config.startingPixels })
  }

  useEffect(() => {
    if (!config) { navigate('/campaign'); return }
    doStartLevel()
    return () => resetLevel()
  }, [levelNum]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        tabHiddenAtRef.current = Date.now()
      } else if (tabHiddenAtRef.current !== null) {
        const hiddenMs = Date.now() - tabHiddenAtRef.current
        const hiddenSecs = Math.round(hiddenMs / 1000)
        tabHiddenAtRef.current = null
        setTimeRemaining(t => Math.min(config?.timeLimitSeconds ?? 120, t + hiddenSecs))
        setElapsedSeconds(e => Math.max(0, e - hiddenSecs))
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [config]) // eslint-disable-line react-hooks/exhaustive-deps

  // Timer countdown — paused for tutorial levels or when gamePaused
  useEffect(() => {
    if (!config || levelComplete || resultShown || config.tutorial || gamePaused) return
    const interval = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) { clearInterval(interval); handleTimeUp(); return 0 }
        return t - 1
      })
      setElapsedSeconds(e => e + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown, gamePaused]) // eslint-disable-line react-hooks/exhaustive-deps

  // Elapsed time for tutorial (no limit, just for star calc)
  useEffect(() => {
    if (!config?.tutorial || levelComplete || resultShown || gamePaused) return
    const interval = setInterval(() => setElapsedSeconds(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown, gamePaused]) // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (!levelComplete || resultShown) return
    const ratio = elapsedSeconds / config.timeLimitSeconds
    const s = config.tutorial ? 1 : (ratio <= 0.30 ? 3 : ratio <= 0.70 ? 2 : 1)
    const greedyBonus = totalGreedyBonus(grid)
    const forgeBonus  = totalForgeBonus(grid)
    const baseGold    = GOLD_BY_STARS[s] ?? 0
    const total       = baseGold + greedyBonus + forgeBonus

    setStars(s)
    setGoldEarned(total)
    setResultShown(true)
    saveCampaignProgress(levelNum, s, elapsedSeconds)
    if (total > 0) addGold(total)
    if (greedyBonus > 0) addCumulativeGreedyGold(greedyBonus)

    const levelKeys = checkLevelComplete({ levelNumber: levelNum, stars: s, campaignProgress, unlockedKeys: achievements })
    const greedyKeys = checkGreedy({ cumulativeGreedyGold: cumulativeGreedyGold + greedyBonus, unlockedKeys: achievements })
    unlockAchievements([...levelKeys, ...greedyKeys])
  }, [levelComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeUp() {
    setResultShown(true); setStars(0); setGoldEarned(0)
  }

  function handleOpenForBlock(blockId) {
    const state = useGameStore.getState()
    const block = [
      ...state.inventory,
      ...state.grid.flat().filter(Boolean),
    ].find(b => b.id === blockId)
    if (block && block.pixelCount === 0) {
      setPickerBlockId(blockId)
    } else {
      setSelectedBlock(blockId)
    }
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

  function handleRetry() {
    setResultShown(false)
    setTimeRemaining(config.timeLimitSeconds)
    setElapsedSeconds(0)
    shownSetPrompts.current.clear()
    resetLevel()
    doStartLevel()
  }

  if (!config) return null

  return (
    <div className="h-screen bg-game-bg flex flex-col overflow-hidden">
      <ProductionEngine requiredOutput={effectiveRequired} />

      <LevelHUD config={config} effectiveRequired={effectiveRequired} timeRemaining={timeRemaining} elapsedSeconds={elapsedSeconds} />

      {/* Main play area */}
      <div className="flex flex-1 gap-0 overflow-hidden min-h-0">
        <ShopSidebar />

        <div className="flex-1 flex items-start justify-center overflow-auto px-2 py-2" data-tutorial="grid">
          <Grid selectedBlockId={selectedBlockId} onBlockSelect={handleOpenForBlock} />
        </div>

        {/* Right stats */}
        <div className="flex flex-col gap-3 flex-shrink-0 overflow-y-auto py-2 pr-2" style={{ width: 196 }}>
          <PixelCounter requiredOutput={effectiveRequired} />
          {colorCheckerReductions > 0 && (
            <div className="text-xs font-black text-pixel-green border-2 border-pixel-green/40 rounded-xl px-3 py-2">
              Color Checker: −{colorCheckerReductions * 5}% req.
            </div>
          )}
        </div>
      </div>

      <InventoryPanel selectedBlockId={selectedBlockId} onBlockSelect={setSelectedBlock} />

      {/* Template picker */}
      {pickerBlockId && (
        <TemplatePicker
          blockId={pickerBlockId}
          onPick={layout => {
            useGameStore.getState().applyTemplate(pickerBlockId, layout)
            setPickerBlockId(null)
            setSelectedBlock(pickerBlockId)
          }}
          onBlank={() => {
            setPickerBlockId(null)
            setSelectedBlock(pickerBlockId)
          }}
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

      {/* BlockEditor — z-50 so it renders above the tutorial overlay (z-40) */}
      {selectedBlockId && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 px-4"
          style={{ zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) handleCloseEditor() }}
        >
          <BlockEditor blockId={selectedBlockId} onClose={handleCloseEditor} />
        </div>
      )}

      {/* Tutorial (Level 1 only) */}
      {config.tutorial && (
        <TutorialOverlay active={!resultShown} />
      )}

      {templatePrompt && !resultShown && (
        <TemplateSaveModal
          block={templatePrompt.block}
          setName={templatePrompt.setName}
          onSave={name => {
            saveTemplate(name, templatePrompt.block.pixelLayout, templatePrompt.setName)
            setTemplatePrompt(null)
          }}
          onSkip={() => setTemplatePrompt(null)}
        />
      )}

      {/* Pause modal */}
      {gamePaused && !resultShown && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
          <div className="card mx-4 w-full max-w-xs text-center" style={{ padding: '2rem' }}>
            <div className="text-4xl font-black text-white pixel-heading mb-1">Paused</div>
            <div className="text-sm text-gray-500 font-semibold mb-6">Level {config.number} — {config.name}</div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPaused(false)}
                className="btn btn-primary text-base"
              >
                ▶ Continue
              </button>
              <Link
                to="/settings"
                onClick={() => setPaused(false)}
                className="btn btn-secondary text-base"
              >
                Settings
              </Link>
              <button
                onClick={() => navigate('/campaign')}
                className="btn btn-danger text-base"
              >
                ✕ Exit Level
              </button>
            </div>
          </div>
        </div>
      )}

      {resultShown && (
        <StarResult
          stars={stars}
          levelConfig={config}
          elapsedSeconds={elapsedSeconds}
          goldEarned={goldEarned}
          onContinue={() => navigate('/campaign')}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}
