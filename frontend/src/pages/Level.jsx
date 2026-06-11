import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { startMusic, stopMusic, getLevelTrack, playLevelComplete, playDesignUnlock } from '../lib/audio'
import { useGameStore, createBlock, pickRandomType } from '../store/gameStore'
import { getOwnedBlockTypes } from '../lib/constants'
import { useUserStore } from '../store/userStore'
import { useShopStore } from '../store/shopStore'
import { getLevelConfig } from '../engine/levelConfig'
import { totalGreedyBonus, totalForgeBonus } from '../engine/blockEffects'
import { checkLevelComplete, checkGreedy } from '../engine/achievementEngine'
import { useDesignUnlocks, shouldShowDesignChoice, getStarterDesignIds } from '../lib/designUnlocks'
import { useSettingsStore } from '../store/settingsStore'
import { getLevelContent } from '../data/learningContent'
import Grid from '../components/game/Grid'
import LevelHUD from '../components/game/LevelHUD'
import PixelCounter from '../components/game/PixelCounter'
import ProductionEngine from '../components/game/ProductionEngine'
import ActiveEffectsPanel from '../components/game/ActiveEffectsPanel'
import StarResult from '../components/ui/StarResult'
import LearningCard from '../components/ui/LearningCard'
import TutorialOverlay from '../components/ui/TutorialOverlay'
import InventoryPanel from '../components/game/InventoryPanel'
import ShopSidebar from '../components/game/ShopSidebar'
import DeckSelector from '../components/ui/DeckSelector'

const GOLD_BY_STARS = { 3: 100, 2: 70, 1: 50, 0: 0 }

// ── Tutorial helpers ──────────────────────────────────────────────────────────
function getTutorialStartingBlocks(levelNum) {
  const ids = {
    1: ['daisy', 'oak', 'house', 'star'],
    2: ['daisy', 'cat', 'heart', 'snowflake', 'mountain', 'circle'],
    3: ['daisy', 'oak'],
    4: ['daisy', 'rose', 'tulip', 'lily', 'hibiscus', 'cat', 'house'],
    5: ['daisy', 'rose', 'tulip', 'lily', 'hibiscus', 'oak', 'cat'],
  }[levelNum] ?? ['daisy', 'oak', 'house', 'star']
  return ids.map(id => createBlock(id)).filter(Boolean)
}

function getTutorialDeck(levelNum) {
  return {
    3: ['daisy', 'oak', 'house', 'star', 'cat'],
    4: ['daisy', 'rose', 'tulip', 'lily', 'hibiscus'],
    5: ['daisy', 'rose', 'tulip', 'lily', 'hibiscus'],
  }[levelNum] ?? []
}

export default function Level() {
  const { levelNumber } = useParams()
  const navigate        = useNavigate()
  const levelNum        = parseInt(levelNumber, 10)
  const config          = getLevelConfig(levelNum)

  const {
    grid, deckSelection, startLevel, levelComplete, resetLevel,
    gamePaused, setPaused, gameSpeed, setDeckSelection,
    totalPixelsProduced, addPixels,
  } = useGameStore()

  const {
    saveCampaignProgress, addGold, unlockAchievements,
    addCumulativeGreedyGold, achievements, campaignProgress,
    cumulativeGreedyGold, gold, unlockedDesigns: unlockedDesignIds,
    unlockDesign, unlockDesigns, user,
  } = useUserStore()

  const { activeGridStyle } = useShopStore()
  const { showLearning }    = useSettingsStore()
  const { unlockedDesigns } = useDesignUnlocks()

  const [timeRemaining, setTimeRemaining] = useState(config?.timeLimitSeconds ?? 120)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [resultShown, setResultShown]       = useState(false)
  const [stars, setStars]                   = useState(0)
  const [goldEarned, setGoldEarned]         = useState(0)
  const tabHiddenAtRef = useRef(null)

  // Deck / pre-buy flow — tutorial skips the deck selector entirely
  const isTutorial = config?.tutorial === true
  const [deckPhase, setDeckPhase] = useState(!isTutorial)
  const [activeDeck, setActiveDeck] = useState([])   // designIds for current level

  // Design choice modal (offered after certain level completions)
  const [designChoicePair, setDesignChoicePair] = useState(null)

  // Designs unlocked notification
  const [unlockedThisLevel, setUnlockedThisLevel] = useState([])
  const [showUnlocked, setShowUnlocked]           = useState(false)

  // Inventory open state for tutorial
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [tutorialDone, setTutorialDone]   = useState(false)

  // Pre-level learning card (shown between deck selection and gameplay for non-tutorial levels)
  const preLevelContent = !isTutorial ? getLevelContent(levelNum) : null
  const [preLevelPhase, setPreLevelPhase] = useState(false)
  const [preLevelBonus, setPreLevelBonus] = useState(0)

  const effectiveRequired = config
    ? (activeGridStyle === 'efficiency'
        ? Math.floor(config.requiredOutput * 0.90)
        : config.requiredOutput)
    : 0

  const effectiveTimeLimit = config
    ? (activeGridStyle === 'efficiency'
        ? Math.floor(config.timeLimitSeconds * 1.20)
        : config.timeLimitSeconds)
    : 120

  function handleDeckConfirmed({ designIds }) {
    setActiveDeck(designIds)
    setDeckSelection(designIds)

    // Give starting copies based on deck size: 3 cards→2 each, 2 cards→3 each, 1 card→6
    const { unlockedBlocks } = useShopStore.getState()
    const typePool = getOwnedBlockTypes(unlockedDesigns, unlockedBlocks ?? [])
    const uniqueDesigns = [...new Set(designIds)]
    const copiesPerDesign = uniqueDesigns.length === 1 ? 6 : uniqueDesigns.length === 2 ? 3 : 2
    const startingBlocks = []
    for (const id of uniqueDesigns) {
      for (let i = 0; i < copiesPerDesign; i++) {
        const block = createBlock(id, pickRandomType(typePool), 0)
        if (block) startingBlocks.push(block)
      }
    }

    startLevel(startingBlocks)
    setDeckPhase(false)
    setTimeRemaining(effectiveTimeLimit)
    setElapsedSeconds(0)

    // Show pre-level learning card if available
    if (showLearning && preLevelContent) {
      setPreLevelPhase(true)
    }
  }

  function handlePreLevelContinue(wasCorrect) {
    if (wasCorrect === true && preLevelContent?.type === 'quiz') {
      const bonus = Math.floor(effectiveRequired * 0.15)
      setPreLevelBonus(bonus)
      addPixels(bonus)
    }
    setPreLevelPhase(false)
  }

  // Start music when gameplay begins (deck phase ends); stop on unmount
  useEffect(() => {
    if (!deckPhase) startMusic(getLevelTrack(levelNum))
    else stopMusic(1.0)
  }, [deckPhase]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopMusic(0.8), []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!config) { navigate('/campaign'); return }
    if (config.tutorial) {
      const tutorialBlocks = getTutorialStartingBlocks(levelNum)
      startLevel(tutorialBlocks)
      // Give levels 3-5 a deck so the shop sidebar has designs to sell
      const tutDeck = getTutorialDeck(levelNum)
      if (tutDeck.length > 0) {
        setActiveDeck(tutDeck)
        setDeckSelection(tutDeck)
      }
      setTimeRemaining(effectiveTimeLimit)
      setElapsedSeconds(0)
    }
    return () => resetLevel()
  }, [levelNum]) // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before refresh during active run
  useEffect(() => {
    if (deckPhase || resultShown) return
    function warn(e) { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [deckPhase, resultShown])

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        tabHiddenAtRef.current = Date.now()
      } else if (tabHiddenAtRef.current !== null) {
        const hiddenSecs = Math.round((Date.now() - tabHiddenAtRef.current) / 1000)
        tabHiddenAtRef.current = null
        setTimeRemaining(t => Math.min(effectiveTimeLimit, t + hiddenSecs))
        setElapsedSeconds(e => Math.max(0, e - hiddenSecs))
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [config]) // eslint-disable-line react-hooks/exhaustive-deps

  // Timer
  useEffect(() => {
    if (!config || levelComplete || resultShown || config.tutorial || gamePaused || deckPhase || preLevelPhase) return
    const interval = setInterval(() => {
      setTimeRemaining(t => {
        const dec = gameSpeed
        if (t <= dec) { clearInterval(interval); handleTimeUp(); return 0 }
        return t - dec
      })
      setElapsedSeconds(e => e + gameSpeed)
    }, 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown, gamePaused, gameSpeed, deckPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tutorial elapsed (no time limit)
  useEffect(() => {
    if (!config?.tutorial || levelComplete || resultShown || gamePaused || deckPhase || preLevelPhase) return
    const interval = setInterval(() => setElapsedSeconds(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown, gamePaused, deckPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Level complete
  useEffect(() => {
    if (!levelComplete || resultShown) return
    stopMusic(1.5)
    playLevelComplete()
    const ratio = elapsedSeconds / effectiveTimeLimit
    const s = config.tutorial ? 3 : (ratio <= 0.60 ? 3 : ratio <= 0.85 ? 2 : 1)
    const greedyBonus = totalGreedyBonus(grid)
    const forgeBonus  = totalForgeBonus(grid)
    const baseGold    = GOLD_BY_STARS[s] ?? 0
    const total       = baseGold + greedyBonus + forgeBonus
    const goldMult    = activeGridStyle === 'gold_rush' ? 1.15 : 1

    setStars(s); setGoldEarned(Math.floor(total * goldMult)); setResultShown(true)
    saveCampaignProgress(levelNum, s, elapsedSeconds)
    if (levelNum === 1 && !campaignProgress[1]) {
      const starterIds = getStarterDesignIds()
      unlockDesigns(starterIds)
      setUnlockedThisLevel(starterIds)
    }
    if (total > 0) addGold(Math.floor(total * goldMult))
    if (greedyBonus > 0) addCumulativeGreedyGold(greedyBonus)

    const levelKeys  = checkLevelComplete({ levelNumber: levelNum, stars: s, campaignProgress, unlockedKeys: achievements })
    const greedyKeys = checkGreedy({ cumulativeGreedyGold: cumulativeGreedyGold + greedyBonus, unlockedKeys: achievements })
    unlockAchievements([...levelKeys, ...greedyKeys])

    // Check if a design choice should be offered after this level
    const choicePair = shouldShowDesignChoice(levelNum, unlockedDesignIds ?? [])
    if (choicePair) setDesignChoicePair(choicePair)
  }, [levelComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeUp() { stopMusic(0.8); setResultShown(true); setStars(0); setGoldEarned(0) }

  function handleAfterUnlocked() {
    setShowUnlocked(false)
    navigate('/campaign')
  }

  function handleRetry() {
    setResultShown(false)
    setElapsedSeconds(0)
    setDesignChoicePair(null)
    setUnlockedThisLevel([])
    setShowUnlocked(false)
    setPreLevelBonus(0)
    resetLevel()
    if (isTutorial) {
      const tutorialBlocks = getTutorialStartingBlocks(levelNum)
      startLevel(tutorialBlocks)
      const tutDeck = getTutorialDeck(levelNum)
      if (tutDeck.length > 0) { setActiveDeck(tutDeck); setDeckSelection(tutDeck) }
      setTimeRemaining(effectiveTimeLimit)
    } else {
      setDeckPhase(true)
    }
  }

  function handleStarResultContinue() {
    if (designChoicePair) return
    if (unlockedThisLevel.length > 0) { playDesignUnlock(); setShowUnlocked(true); return }
    navigate('/campaign')
  }

  if (!config) return null
  if (!user) { navigate('/'); return null }

  return (
    <div className="h-screen bg-game-bg flex flex-col overflow-hidden select-none">
      {!deckPhase && !preLevelPhase && <ProductionEngine requiredOutput={effectiveRequired} />}

      <LevelHUD
        config={{ ...config, timeLimitSeconds: effectiveTimeLimit }}
        effectiveRequired={effectiveRequired}
        timeRemaining={timeRemaining}
        elapsedSeconds={elapsedSeconds}
      />

      {/* Main play area */}
      <div className="flex flex-1 gap-0 min-h-0" style={{ overflow: 'hidden' }}>
        <ShopSidebar deckDesignIds={activeDeck} />

        <div className="flex-1 flex items-start justify-center px-2 pt-5 pb-2" style={{ overflowX: 'hidden', overflowY: 'visible' }} data-tutorial="grid">
          <Grid />
        </div>

        <div className="flex flex-col gap-3 flex-shrink-0 overflow-y-auto py-2 pr-2" style={{ width: 284 }}>
          <PixelCounter requiredOutput={effectiveRequired} preLevelBonus={preLevelBonus} />
          <ActiveEffectsPanel />
        </div>
      </div>

      <InventoryPanel onOpenStateChange={setInventoryOpen} />

      {/* Tutorial */}
      {config.tutorial && (
        <TutorialOverlay
          active={!resultShown && !deckPhase && !tutorialDone}
          inventoryOpen={inventoryOpen}
          onDone={() => setTutorialDone(true)}
          tutorialLevel={config.tutorialLevel ?? 1}
        />
      )}

      {/* Pause modal */}
      {gamePaused && !resultShown && !deckPhase && (
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

      {/* Deck selector */}
      {deckPhase && (
        <DeckSelector
          levelNumber={levelNum}
          unlockedDesigns={unlockedDesigns}
          bargain={activeGridStyle === 'bargain'}
          onConfirm={handleDeckConfirmed}
          onBack={() => navigate('/campaign')}
        />
      )}

      {/* Design choice modal (offered after level completion) */}
      {resultShown && designChoicePair && (
        <DesignChoiceModal
          pair={designChoicePair}
          onChoose={id => {
            unlockDesign(id)
            setUnlockedThisLevel([id])
            setDesignChoicePair(null)
            setShowUnlocked(true)
          }}
        />
      )}

      {/* Designs unlocked notification */}
      {resultShown && showUnlocked && (
        <DesignsUnlockedPanel designIds={unlockedThisLevel} onContinue={handleAfterUnlocked} />
      )}

      {/* Pre-level learning card (non-tutorial levels only) */}
      {!deckPhase && preLevelPhase && preLevelContent && (
        <LearningCard
          content={preLevelContent}
          levelNumber={levelNum}
          mode="pre"
          bonusAmount={Math.floor(effectiveRequired * 0.15)}
          onContinue={handlePreLevelContinue}
        />
      )}

      {resultShown && !designChoicePair && !showUnlocked && (
        <StarResult
          stars={stars}
          levelConfig={config}
          elapsedSeconds={elapsedSeconds}
          goldEarned={goldEarned}
          onContinue={handleStarResultContinue}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}

// ── Design Choice Modal ───────────────────────────────────────────────────────
import { DESIGNS } from '../data/designLibrary'
import { DesignMiniThumb } from '../components/ui/DeckSelector'

function DesignChoiceModal({ pair, onChoose }) {
  const [A, B] = pair.map(id => DESIGNS.find(d => d.id === id)).filter(Boolean)
  if (!A && !B) return null

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 px-4">
      <div className="card w-full max-w-sm text-center" style={{ padding: '2rem' }}>
        <div className="text-xs font-black uppercase tracking-widest text-pixel-yellow mb-1">New Design Unlocked</div>
        <h2 className="text-xl font-black text-white pixel-heading mb-2">Choose One</h2>
        <p className="text-xs text-gray-500 mb-6">Pick a design to add to your collection permanently</p>
        <div className="flex gap-4 justify-center">
          {[A, B].filter(Boolean).map(design => (
            <button
              key={design.id}
              onClick={() => onChoose(design.id)}
              className="flex-1 rounded-xl border-2 border-game-border hover:border-pixel-green flex flex-col items-center gap-2 p-4 transition"
              style={{ background: '#0d0d22' }}
            >
              <DesignMiniThumb design={design} size={64} centered />
              <div className="text-sm font-black text-white">{design.name}</div>
              <div className="text-xs text-pixel-blue capitalize">{design.blockType.replace(/_/g, ' ')}</div>
              <div className="text-xs text-gray-500 capitalize">{design.series}</div>
              <div className="text-xs text-gray-400 leading-snug">{design.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Designs Unlocked Panel ────────────────────────────────────────────────────
function DesignsUnlockedPanel({ designIds, onContinue }) {
  const designs = designIds.map(id => DESIGNS.find(d => d.id === id)).filter(Boolean)
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 px-4">
      <div className="card w-full max-w-md text-center" style={{ padding: '2rem' }}>
        <div className="text-xs font-black uppercase tracking-widest text-pixel-green mb-1">Collection updated</div>
        <h2 className="text-2xl font-black text-white pixel-heading mb-1">
          {designs.length === 1 ? '1 New Design' : `${designs.length} New Designs`}
        </h2>
        <p className="text-xs text-gray-500 mb-5">Added to your collection</p>
        <div className="grid grid-cols-5 gap-2 mb-6">
          {designs.map(d => (
            <div key={d.id} className="flex flex-col items-center gap-1">
              <div className="rounded-xl border-2 border-pixel-green/40 bg-pixel-green/5 p-1.5">
                <DesignMiniThumb design={d} size={40} />
              </div>
              <span className="text-[9px] font-black text-gray-300 text-center leading-tight truncate w-full">{d.name}</span>
              <span className="text-[8px] text-gray-600 capitalize">{d.series}</span>
            </div>
          ))}
        </div>
        <button onClick={onContinue} className="btn btn-primary w-full text-base">Continue →</button>
      </div>
    </div>
  )
}
