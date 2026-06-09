import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { LEVELS } from '../engine/levelConfig'

const TIERS = [
  { label: 'Tutorial',     range: [1,   10],  color: '#1499cc' },
  { label: 'Apprentice',   range: [11,  30],  color: '#00d49a' },
  { label: 'Craftsman',    range: [31,  60],  color: '#ffd166' },
  { label: 'Expert',       range: [61,  100], color: '#f59342' },
  { label: 'Master',       range: [101, 150], color: '#f03e4e' },
  { label: 'Grandmaster',  range: [151, 200], color: '#a066f0' },
]

function Stars({ count }) {
  return (
    <div className="flex gap-0.5 text-sm">
      {[1, 2, 3].map(i => (
        <span key={i} className={i <= count ? 'text-pixel-yellow' : 'text-game-border'}>★</span>
      ))}
    </div>
  )
}

function fmtOutput(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}

export default function Campaign() {
  const { campaignProgress } = useUserStore()
  const [openTier, setOpenTier] = useState(0) // index of expanded tier

  const totalStars = Object.values(campaignProgress).reduce((s, p) => s + (p?.stars ?? 0), 0)
  const maxStars   = LEVELS.length * 3

  function isTierUnlocked(tierIdx) {
    if (tierIdx === 0) return true
    const prevTier  = TIERS[tierIdx - 1]
    const lastLevel = prevTier.range[1]
    // Tier unlocks when the last level of the previous tier has been attempted (any stars)
    return (campaignProgress[lastLevel]?.stars ?? 0) > 0
  }

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn btn-secondary text-sm px-4 py-2">← Back</Link>
            <h1 className="text-4xl font-black text-white pixel-heading">Campaign</h1>
          </div>
          <div className="text-right">
            <div className="text-pixel-yellow font-black text-xl">{totalStars}</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">/ {maxStars} stars</div>
          </div>
        </div>

        {/* Tier accordions */}
        <div className="space-y-3">
          {TIERS.map((tier, tierIdx) => {
            const unlocked  = isTierUnlocked(tierIdx)
            const isOpen    = openTier === tierIdx
            const tierLevels = LEVELS.filter(l => l.number >= tier.range[0] && l.number <= tier.range[1])
            const earned    = tierLevels.reduce((s, l) => s + (campaignProgress[l.number]?.stars ?? 0), 0)
            const maxEarned = tierLevels.length * 3
            const pct       = Math.round((earned / maxEarned) * 100)

            return (
              <div key={tier.label}
                className="rounded-2xl border-2 overflow-hidden"
                style={{ borderColor: unlocked ? tier.color + '66' : '#36366a' }}
              >
                {/* Tier header — click to expand */}
                <button
                  onClick={() => setOpenTier(isOpen ? -1 : tierIdx)}
                  disabled={!unlocked}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left transition"
                  style={{ background: unlocked ? tier.color + '12' : '#111128' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base" style={{ color: unlocked ? tier.color : '#555' }}>
                        {tier.label}
                      </span>
                      <span className="text-xs font-bold text-gray-600">
                        Lv {tier.range[0]}–{tier.range[1]}
                      </span>
                    </div>
                    {unlocked && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-game-bg rounded-full overflow-hidden" style={{ maxWidth: 120 }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tier.color }} />
                        </div>
                        <span className="text-xs font-bold text-gray-500">{earned} / {maxEarned} ★</span>
                      </div>
                    )}
                  </div>
                  {!unlocked
                    ? <span className="text-gray-600 text-sm">🔒</span>
                    : <span className="text-gray-500 text-sm">{isOpen ? '▲' : '▼'}</span>
                  }
                </button>

                {/* Level grid — shown when tier is open */}
                {isOpen && unlocked && (
                  <div className="px-3 py-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                    style={{ background: '#0a0a18' }}>
                    {tierLevels.map(level => {
                      const progress = campaignProgress[level.number]
                      const stars    = progress?.stars ?? 0
                      const locked   = level.number > 1 && !(campaignProgress[level.number - 1]?.stars > 0)

                      return (
                        <Link
                          key={level.number}
                          to={locked ? '#' : `/campaign/level/${level.number}`}
                          className={[
                            'card flex flex-col gap-2 transition',
                            locked ? 'opacity-30 pointer-events-none' : 'hover:border-pixel-blue',
                          ].join(' ')}
                          style={{ padding: '0.75rem' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-gray-600">#{level.number}</span>
                            <Stars count={stars} />
                          </div>
                          <span className="text-white font-black text-xs leading-tight">{level.name}</span>
                          <div className="flex gap-1.5 flex-wrap mt-auto">
                            <span className="text-xs font-bold text-gray-600 bg-game-card2 border border-game-border rounded px-1.5 py-0.5">
                              {fmtOutput(level.requiredOutput)}
                            </span>
                            <span className="text-xs font-bold text-gray-600 bg-game-card2 border border-game-border rounded px-1.5 py-0.5">
                              {level.timeLimitSeconds === level.timeLimitSeconds && level.tutorial ? '∞' : `${level.timeLimitSeconds}s`}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
