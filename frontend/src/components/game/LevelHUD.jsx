import { useGameStore } from '../../store/gameStore'
import { Link } from 'react-router-dom'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function liveStar(elapsedSeconds, timeLimitSeconds) {
  const ratio = elapsedSeconds / timeLimitSeconds
  if (ratio <= 0.30) return 3
  if (ratio <= 0.70) return 2
  return 1
}

export default function LevelHUD({ config, timeRemaining, elapsedSeconds }) {
  const { totalPixelsProduced } = useGameStore()
  const progress = Math.min(1, totalPixelsProduced / config.requiredOutput)
  const currentStar = liveStar(elapsedSeconds, config.timeLimitSeconds)
  const urgentTime = timeRemaining <= 30

  return (
    <div className="bg-game-card border-b border-game-border px-4 py-3 flex items-center gap-4">
      {/* Back */}
      <Link to="/campaign" className="text-gray-500 hover:text-white text-sm transition flex-shrink-0">
        ← Exit
      </Link>

      {/* Level name */}
      <div className="flex-shrink-0">
        <span className="text-xs text-gray-500">LVL {config.number}</span>
        <span className="text-white font-semibold ml-2">{config.name}</span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.floor(totalPixelsProduced).toLocaleString()} px</span>
          <span>{config.requiredOutput.toLocaleString()} px</span>
        </div>
        <div className="h-3 bg-game-bg rounded-full overflow-hidden border border-game-border">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: progress >= 1 ? '#06d6a0' : '#118ab2',
            }}
          />
        </div>
      </div>

      {/* Star indicator */}
      <div className="flex-shrink-0 text-lg">
        {[1, 2, 3].map(i => (
          <span key={i} className={i <= currentStar ? 'text-pixel-yellow' : 'text-gray-700'}>★</span>
        ))}
      </div>

      {/* Timer */}
      <div className={`flex-shrink-0 font-mono text-xl font-bold ${urgentTime ? 'text-red-400' : 'text-white'}`}>
        {formatTime(timeRemaining)}
      </div>
    </div>
  )
}
