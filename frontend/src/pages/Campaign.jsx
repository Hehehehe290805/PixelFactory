import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { LEVELS } from '../engine/levelConfig'

function StarDisplay({ count }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map(i => (
        <span key={i} className={i <= count ? 'text-pixel-yellow' : 'text-gray-600'}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function Campaign() {
  const { campaignProgress } = useUserStore()

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="text-gray-400 hover:text-white transition">← Back</Link>
          <h1 className="text-3xl font-black text-white pixel-heading">Campaign</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LEVELS.map(level => {
            const progress = campaignProgress[level.number]
            const stars = progress?.stars ?? 0
            const locked = level.number > 1 && !(campaignProgress[level.number - 1]?.stars > 0)

            return (
              <Link
                key={level.number}
                to={locked ? '#' : `/campaign/level/${level.number}`}
                className={`
                  bg-game-card border rounded-xl p-4 flex flex-col gap-2 transition
                  ${locked
                    ? 'border-game-border opacity-40 cursor-not-allowed pointer-events-none'
                    : 'border-game-border hover:border-pixel-blue cursor-pointer'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">LVL {level.number}</span>
                  <StarDisplay count={stars} />
                </div>
                <span className="text-white font-semibold text-sm">{level.name}</span>
                <div className="text-xs text-gray-500">
                  <span>{level.requiredOutput.toLocaleString()} px</span>
                  <span className="mx-1">·</span>
                  <span>{level.timeLimitSeconds}s</span>
                </div>
                {locked && <span className="text-xs text-gray-600">🔒 Complete previous level</span>}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
