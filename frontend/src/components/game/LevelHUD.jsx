import { useGameStore } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'

function fmt(s) {
  return `${Math.floor(Math.abs(s) / 60)}:${(Math.floor(Math.abs(s)) % 60).toString().padStart(2, '0')}`
}

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

  // 4-tier urgency for timer color
  const timerColor = (() => {
    if (config.tutorial) return null
    if (timeRemaining > 60) return '#ddd8f8'
    if (timeRemaining > 30) return '#fbbf24'
    if (timeRemaining > 10) return '#fb923c'
    return '#f87171'
  })()
  const timerAnim = timeRemaining <= 10 ? 'urgentPulse 0.55s ease-in-out infinite' : timeRemaining <= 30 ? 'urgentPulse 1.1s ease-in-out infinite' : undefined

  const availableSpeeds = ALL_SPEEDS.filter(s => s === 1 || purchasedSpeeds.includes(s))

  return (
    <div
      data-tutorial="level-hud"
      className="border-b px-3 py-2 flex items-center gap-3 flex-shrink-0 select-none"
      style={{ background: '#0a0a22', borderBottomColor: '#1e1e48' }}
    >
      {/* Pause */}
      <button
        onClick={() => setPaused(true)}
        className="btn btn-secondary text-xs px-2.5 py-1.5 flex-shrink-0"
        title="Pause"
      >
        ⏸
      </button>

      {/* Level info */}
      <div className="flex-shrink-0 hidden sm:block border-r pr-3" style={{ borderColor: '#1e1e48' }}>
        <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#3c3c72' }}>
          LVL {config.number}
        </div>
        <div className="font-black text-sm leading-tight" style={{ color: '#ddd8f8' }}>{config.name}</div>
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex justify-between text-[10px] font-bold" style={{ color: '#7b78a8' }}>
          <span>{Math.floor(totalPixelsProduced).toLocaleString()} px</span>
          <span>{effectiveRequired.toLocaleString()} px</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${progress >= 1 ? 'progress-fill-complete' : ''}`}
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>

      {/* Live stars */}
      {!config.tutorial && (
        <div className="flex-shrink-0 leading-none hidden sm:flex gap-0.5">
          {[1, 2, 3].map(i => (
            <span
              key={i}
              style={{
                color: i <= currentStar ? '#fbbf24' : '#2e2e60',
                textShadow: i <= currentStar ? 'var(--glow-yellow)' : 'none',
                fontSize: 18,
              }}
            >★</span>
          ))}
        </div>
      )}

      {/* Speed selector */}
      {availableSpeeds.length > 1 && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {availableSpeeds.map(s => (
            <button
              key={s}
              onClick={() => setGameSpeed(s)}
              className="text-xs font-black px-1.5 py-1 rounded-lg border transition leading-none"
              style={gameSpeed === s
                ? { borderColor: '#fbbf24', color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }
                : { borderColor: '#1e1e48', color: '#7b78a8' }
              }
            >
              {s}×
            </button>
          ))}
        </div>
      )}

      {/* Timer */}
      {config.tutorial ? (
        <div className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest" style={{ color: '#2e2e60' }}>
          No Limit
        </div>
      ) : (
        <div
          className="flex-shrink-0 font-black text-2xl font-mono leading-none"
          style={{ color: timerColor, animation: timerAnim }}
        >
          {fmt(timeRemaining)}
        </div>
      )}
    </div>
  )
}
