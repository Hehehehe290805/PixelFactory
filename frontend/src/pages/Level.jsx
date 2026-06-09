import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore, createBlock } from '../store/gameStore'
import { useUserStore } from '../store/userStore'
import { getLevelConfig } from '../engine/levelConfig'
import Grid from '../components/game/Grid'
import LevelHUD from '../components/game/LevelHUD'
import PixelCounter from '../components/game/PixelCounter'
import BlockEditor from '../components/game/BlockEditor'
import ProductionEngine from '../components/game/ProductionEngine'
import StarResult from '../components/ui/StarResult'

export default function Level() {
  const { levelNumber } = useParams()
  const navigate = useNavigate()
  const levelNum = parseInt(levelNumber, 10)
  const config = getLevelConfig(levelNum)

  const { startLevel, levelComplete, resetLevel, inventory, selectedBlockId, setSelectedBlock } = useGameStore()
  const { saveCampaignProgress } = useUserStore()

  const [timeRemaining, setTimeRemaining] = useState(config?.timeLimitSeconds ?? 120)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [resultShown, setResultShown] = useState(false)
  const [stars, setStars] = useState(0)

  useEffect(() => {
    if (!config) { navigate('/campaign'); return }

    // Build starting inventory from config
    const blocks = []
    for (const { type, count } of config.startingBlocks) {
      for (let i = 0; i < count; i++) blocks.push(createBlock(type))
    }
    startLevel(blocks)

    return () => resetLevel()
  }, [levelNum]) // eslint-disable-line react-hooks/exhaustive-deps

  // Timer
  useEffect(() => {
    if (!config || levelComplete || resultShown) return
    const interval = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          clearInterval(interval)
          handleTimeUp()
          return 0
        }
        return t - 1
      })
      setElapsedSeconds(e => e + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [config, levelComplete, resultShown]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (levelComplete && !resultShown) {
      const ratio = elapsedSeconds / config.timeLimitSeconds
      const s = ratio <= 0.30 ? 3 : ratio <= 0.70 ? 2 : 1
      setStars(s)
      setResultShown(true)
      saveCampaignProgress(levelNum, s, elapsedSeconds)
    }
  }, [levelComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeUp() {
    // Time ran out — still show result with 1 star if any progress, else 0
    setResultShown(true)
    setStars(0)
  }

  if (!config) return null

  const selectedBlock = inventory.find(b => b.id === selectedBlockId) ?? null

  return (
    <div className="min-h-screen bg-game-bg flex flex-col">
      <ProductionEngine requiredOutput={config.requiredOutput} />

      {/* Top HUD */}
      <LevelHUD
        config={config}
        timeRemaining={timeRemaining}
        elapsedSeconds={elapsedSeconds}
      />

      {/* Main play area */}
      <div className="flex flex-1 gap-4 px-4 py-4 overflow-hidden">
        {/* Left panel: inventory */}
        <div className="w-44 flex flex-col gap-3 flex-shrink-0">
          <h3 className="text-xs text-gray-500 uppercase tracking-widest">Inventory</h3>
          <div className="flex flex-col gap-2 overflow-y-auto">
            {inventory.map(block => (
              <button
                key={block.id}
                onClick={() => setSelectedBlock(block.id === selectedBlockId ? null : block.id)}
                className={`
                  rounded-lg border p-2 text-left transition
                  ${block.id === selectedBlockId
                    ? 'border-pixel-blue bg-pixel-blue/10'
                    : 'border-game-border bg-game-card hover:border-pixel-blue/50'
                  }
                `}
              >
                <div className="text-xs text-gray-400 capitalize">{block.type.replace('_', ' ')}</div>
                <div className="text-xs text-gray-600 mt-0.5">{block.pixelCount} px</div>
              </button>
            ))}
            {inventory.length === 0 && (
              <p className="text-xs text-gray-600 italic">All blocks placed</p>
            )}
          </div>
        </div>

        {/* Center: grid */}
        <div className="flex-1 flex items-start justify-center">
          <Grid selectedBlockId={selectedBlockId} onBlockSelect={setSelectedBlock} />
        </div>

        {/* Right panel: pixel counter + block editor */}
        <div className="w-52 flex flex-col gap-3 flex-shrink-0">
          <PixelCounter requiredOutput={config.requiredOutput} />
          {selectedBlockId && (
            <BlockEditor
              blockId={selectedBlockId}
              onClose={() => setSelectedBlock(null)}
            />
          )}
        </div>
      </div>

      {/* Star result overlay */}
      {resultShown && (
        <StarResult
          stars={stars}
          levelConfig={config}
          elapsedSeconds={elapsedSeconds}
          onContinue={() => navigate('/campaign')}
          onRetry={() => { setResultShown(false); setTimeRemaining(config.timeLimitSeconds); setElapsedSeconds(0); resetLevel(); startLevel(config.startingBlocks.flatMap(({ type, count }) => Array.from({ length: count }, () => createBlock(type)))) }}
        />
      )}
    </div>
  )
}
