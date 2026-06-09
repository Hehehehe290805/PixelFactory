import { useGameStore } from '../../store/gameStore'
import { Link } from 'react-router-dom'

function fmt(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

function liveStar(elapsed, limit) {
  const r = elapsed / limit
  return r <= 0.30 ? 3 : r <= 0.70 ? 2 : 1
}

export default function LevelHUD({ config, effectiveRequired, timeRemaining, elapsedSeconds }) {
  const { totalPixelsProduced } = useGameStore()
  const progress    = Math.min(1, totalPixelsProduced / effectiveRequired)
  const currentStar = liveStar(elapsedSeconds, config.timeLimitSeconds)
  const urgent      = timeRemaining <= 30

  return (
    <div className="bg-game-card border-b-2 border-game-border px-4 py-3 flex items-center gap-4 flex-shrink-0">
      <Link to="/campaign" className="btn btn-secondary text-xs px-3 py-2 flex-shrink-0">← Exit</Link>

      <div className="flex-shrink-0 hidden sm:block">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">LVL {config.number}</div>
        <div className="text-white font-black text-sm leading-tight">{config.name}</div>
      </div>

      {/* Progress */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex justify-between text-xs font-bold text-gray-500">
          <span>{Math.floor(totalPixelsProduced).toLocaleString()} px</span>
          <span>{effectiveRequired.toLocaleString()} px</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress * 100}%`, backgroundColor: progress >= 1 ? '#00d49a' : '#1499cc' }}
          />
        </div>
      </div>

      {/* Live stars */}
      <div className="flex-shrink-0 text-xl leading-none">
        {[1, 2, 3].map(i => (
          <span key={i} className={i <= currentStar ? 'text-pixel-yellow' : 'text-game-border'}>★</span>
        ))}
      </div>

      {/* Timer */}
      {config.tutorial ? (
        <div className="flex-shrink-0 text-xs font-black text-game-border2 uppercase tracking-widest">No Limit</div>
      ) : (
        <div className={`flex-shrink-0 font-black text-2xl font-mono leading-none ${urgent ? 'text-pixel-red animate-pulse' : 'text-white'}`}>
          {fmt(timeRemaining)}
        </div>
      )}
    </div>
  )
}
