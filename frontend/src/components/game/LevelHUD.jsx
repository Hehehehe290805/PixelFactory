import { useGameStore } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'

function fmt(s) {
  return `${Math.floor(Math.abs(s) / 60)}:${(Math.floor(Math.abs(s)) % 60).toString().padStart(2, '0')}`
}

// 3 stars if ≤60% time used, 2 stars if ≤85%, else 1 star
function liveStar(elapsed, limit) {
  const r = elapsed / limit
  return r <= 0.60 ? 3 : r <= 0.85 ? 2 : 1
}

const ALL_SPEEDS = [0.5, 1, 2, 5, 10]

export default function LevelHUD({ config, effectiveRequired, timeRemaining, elapsedSeconds }) {
  const { totalPixelsProduced, gameSpeed, setGameSpeed, setPaused } = useGameStore()
  const { purchasedSpeeds } = useShopStore()

  const progress    = Math.min(1, totalPixelsProduced / effectiveRequired)
  const currentStar = liveStar(elapsedSeconds, config.timeLimitSeconds)
  const urgent      = timeRemaining <= 30

  // Speed buttons: always show 1×, plus any purchased speeds
  const availableSpeeds = ALL_SPEEDS.filter(s => s === 1 || purchasedSpeeds.includes(s))

  return (
    <div className="bg-game-card border-b-2 border-game-border px-3 py-2 flex items-center gap-3 flex-shrink-0 select-none">
      {/* Pause */}
      <button
        onClick={() => setPaused(true)}
        className="btn btn-secondary text-xs px-3 py-2 flex-shrink-0"
        title="Pause"
      >
        ⏸
      </button>

      <div className="flex-shrink-0 hidden sm:block">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">LVL {config.number}</div>
        <div className="text-white font-black text-sm leading-tight">{config.name}</div>
      </div>

      {/* Progress bar */}
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

      {/* Live stars — hidden for tutorial */}
      {!config.tutorial && (
        <div className="flex-shrink-0 text-xl leading-none hidden sm:flex">
          {[1, 2, 3].map(i => (
            <span key={i} className={i <= currentStar ? 'text-pixel-yellow' : 'text-game-border'}>★</span>
          ))}
        </div>
      )}

      {/* Speed selector — shown once any speed pack is purchased */}
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
