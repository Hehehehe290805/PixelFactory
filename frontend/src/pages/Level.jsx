import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  const tabHiddenAtRef = useRef(null) // tracks when tab was hidden

  // Template save prompt state
  const [templatePrompt, setTemplatePrompt] = useState(null) // { block, setName }
  const shownSetPrompts = useRef(new Set()) // avoid double-prompting same set

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

  // Pause timer when tab is hidden so alt-tab doesn't consume time
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        tabHiddenAtRef.current = Date.now()
      } else if (tabHiddenAtRef.current !== null) {
        const hiddenMs = Date.now() - tabHiddenAtRef.current
        const hiddenSecs = Math.round(hiddenMs / 1000)
        tabHiddenAtRef.current = null
        // Restore time that was silently consumed while hidden
        setTimeRemaining(t => Math.min(config?.timeLimitSeconds ?? 120, t + hiddenSecs))
        setElapsedSeconds(e => Math.max(0, e - hiddenSecs))
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [config]) // eslint-disable-line react-hooks/exhaustive-deps

  // Timer countdown — paused for tutorial levels (config.tutorial === true)
  useEffect(() => {
    if (!config || levelComplete || resultShown || config.tutorial) return
    const interval = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) { clearInterval(interval); handleTimeUp(); return 0 }
        return t - 1
      })
      setElapsedSeconds(e => e + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown]) // eslint-disable-line react-hooks/exhaustive-deps

  // Elapsed time still ticks for tutorial (for star calc) but no time limit
  useEffect(() => {
    if (!config?.tutorial || levelComplete || resultShown) return
    const interval = setInterval(() => setElapsedSeconds(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown]) // eslint-disable-line react-hooks/exhaustive-deps

  // Detect new sets on the grid and prompt template save
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

  // Level complete handler
  useEffect(() => {
    if (!levelComplete || resultShown) return
    const ratio = elapsedSeconds / config.timeLimitSeconds
    // Tutorial (level 1) always gives 1 star — no speed-based rating
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

  // Close the editor — if the block was placed empty and still has 0 pixels, cancel the placement
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
    <div className="min-h-screen bg-game-bg flex flex-col">
      <ProductionEngine requiredOutput={effectiveRequired} />

      <LevelHUD config={config} effectiveRequired={effectiveRequired} timeRemaining={timeRemaining} elapsedSeconds={elapsedSeconds} />

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
          {colorCheckerReductions > 0 && (
            <div className="text-xs font-black text-pixel-green border-2 border-pixel-green/40 rounded-xl px-3 py-2">
              Color Checker: −{colorCheckerReductions * 5}% req.
            </div>
          )}
        </div>
      </div>

      {/* Inventory — bottom bar */}
      <InventoryPanel selectedBlockId={selectedBlockId} onBlockSelect={setSelectedBlock} />

      {/* BlockEditor — centered modal overlay */}
      {selectedBlockId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4"
          onClick={e => { if (e.target === e.currentTarget) handleCloseEditor() }}>
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

